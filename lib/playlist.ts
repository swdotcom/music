import { MusicClient, SPOTIFY_ROOT_API } from "./client";
import {
    CodyResponse,
    CodyResponseType,
    PlaylistItem,
    Track,
    PaginationItem,
    PlayerType
} from "./models";
import { MusicStore } from "./store";
import { UserProfile } from "./profile";
import { MusicUtil } from "./util";
import { CacheUtil } from "./cache";

const musicClient = MusicClient.getInstance();
const musicStore = MusicStore.getInstance();
const userProfile = UserProfile.getInstance();
const musicUtil = new MusicUtil();
const cacheUtil = CacheUtil.getInstance();

export class Playlist {
    private static instance: Playlist;
    private constructor() {
        //
    }
    static getInstance() {
        if (!Playlist.instance) {
            Playlist.instance = new Playlist();
        }
        return Playlist.instance;
    }

    async removeFromSpotifyLiked(trackIds: string[]): Promise<CodyResponse> {
        trackIds = musicUtil.createTrackIdsFromUris(trackIds);
        const api = `/v1/me/tracks`;
        /**
         * ["4iV5W9uYEdYUVa79Axb7Rh", "1301WleyT98MSxVHPZCA6M"]
         */
        const qsOptions = { ids: trackIds.join(",") };
        let codyResp: CodyResponse = await musicClient.spotifyApiDelete(
            api,
            qsOptions
        );

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiDelete(api, qsOptions);
        }

        return codyResp;
    }

    async saveToSpotifyLiked(trackIds: string[]): Promise<CodyResponse> {
        trackIds = musicUtil.createTrackIdsFromUris(trackIds);
        const api = `/v1/me/tracks`;
        /**
         * {ids:["4iV5W9uYEdYUVa79Axb7Rh", "1301WleyT98MSxVHPZCA6M"]}
         */
        const qsOptions = {};
        const payload = {
            ids: trackIds
        };
        let codyResp: CodyResponse = await musicClient.spotifyApiPut(
            api,
            qsOptions,
            payload
        );

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPut(api, qsOptions, payload);
        }

        return codyResp;
    }

    async getSavedTracks(qsOptions: any = {}) {
        let tracks: Track[] = [];

        if (!qsOptions.limit) {
            qsOptions["limit"] = 50;
        } else if (qsOptions.limit < 1) {
            qsOptions.limit = 1;
        }
        if (!qsOptions.offset) {
            qsOptions["offset"] = 0;
        }

        const api = `/v1/me/tracks`;
        let codyResp: CodyResponse = await musicClient.spotifyApiGet(
            api,
            qsOptions
        );

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiGet(api, qsOptions);
        }

        while (true) {
            if (
                musicUtil.isResponseOkWithData(codyResp) &&
                codyResp.data.items
            ) {
                let trackContainers: any[] = codyResp.data.items;

                // ensure the playerType is set
                trackContainers.forEach((item: any) => {
                    if (item.track) {
                        const track: Track = this.buildTrack(item.track);
                        tracks.push(track);
                    }
                });

                if (codyResp.data.next) {
                    // fetch the next set (remove the root)
                    let nextApi = codyResp.data.next.substring(
                        SPOTIFY_ROOT_API.length
                    );
                    codyResp = await musicClient.spotifyApiGet(nextApi, {});
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        return tracks;
    }

    async getPlaylists(qsOptions: any = {}): Promise<PlaylistItem[]> {
        let playlists: PlaylistItem[] = [];
        if (!musicStore.spotifyUserId) {
            await userProfile.getUserProfile();
        }

        if (musicStore.spotifyUserId) {
            if (!qsOptions.limit) {
                qsOptions["limit"] = 50;
            } else if (qsOptions.limit < 1) {
                qsOptions.limit = 1;
            }
            if (!qsOptions.offset) {
                qsOptions["offset"] = 0;
            }

            const api = `/v1/users/${musicStore.spotifyUserId}/playlists`;
            let codyResp: CodyResponse = await musicClient.spotifyApiGet(
                api,
                qsOptions
            );
            // check if the token needs to be refreshed
            if (codyResp.statusText === "EXPIRED") {
                // refresh the token
                await musicClient.refreshSpotifyToken();
                // try again
                codyResp = await musicClient.spotifyApiGet(api, qsOptions);
            }
            if (
                codyResp &&
                codyResp.status === 200 &&
                codyResp.data &&
                codyResp.data.items
            ) {
                playlists = codyResp.data.items;
                // ensure the playerType is set
                playlists.map((playlist: PlaylistItem) => {
                    playlist.playerType = PlayerType.WebSpotify;
                    playlist.type = "playlist";
                });
            }
        }

        return playlists;
    }

    async getPlaylistTracks(playlist_id: string, qsOptions: any = {}) {
        if (!qsOptions.limit) {
            // maximum is 100 at a time
            qsOptions["limit"] = 100;
        } else if (qsOptions.limit < 1) {
            qsOptions.limit = 1;
        }
        if (!qsOptions.offset) {
            qsOptions["offset"] = 0;
        }

        // fields to return for the present moment
        // TODO: allow options to update this
        qsOptions["fields"] =
            "href,limit,next,offset,previous,total,items(track(name,id,album(id,name),artists))";

        const api = `/v1/playlists/${playlist_id}/tracks`;
        let codyResp = await musicClient.spotifyApiGet(api, qsOptions);

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPost(api, qsOptions);
        }

        const paginationItem: PaginationItem = new PaginationItem();
        let tracks: Track[] = [];
        while (true) {
            if (
                codyResp &&
                codyResp.status === 200 &&
                codyResp.data &&
                codyResp.data.items
            ) {
                let trackContainers: any[] = codyResp.data.items;

                // ensure the playerType is set
                trackContainers.forEach((item: any) => {
                    if (item.track) {
                        const track: Track = this.buildTrack(item.track);
                        tracks.push(track);
                    }
                });

                if (codyResp.data.next) {
                    // fetch the next set (remove the root)
                    let nextApi = codyResp.data.next.substring(
                        SPOTIFY_ROOT_API.length
                    );
                    codyResp = await musicClient.spotifyApiGet(nextApi, {});
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        delete codyResp.data;
        paginationItem.items = tracks;
        paginationItem.total = tracks.length;
        codyResp["data"] = paginationItem;

        return codyResp;
    }

    async getPlaylistNames(qsOptions: any = {}): Promise<string[]> {
        let names: string[] = [];
        let playlists = await this.getPlaylists(qsOptions);
        if (playlists) {
            names = playlists.map((playlistItem: PlaylistItem) => {
                return playlistItem.name;
            });
        }
        return names;
    }

    /**
     * Create a new playlist
     * @param name
     * @param isPublic
     */
    async createPlaylist(
        name: string,
        isPublic: boolean,
        description: string = ""
    ) {
        // get the profile if we don't have it
        if (!musicStore.spotifyUserId) {
            await userProfile.getUserProfile();
        }

        if (musicStore.spotifyUserId) {
            /**
             * --data "{\"name\":\"A New Playlist\", \"public\":false}
             */
            const payload = {
                name,
                public: isPublic,
                description
            };
            const api = `/v1/users/${musicStore.spotifyUserId}/playlists`;
            return await musicClient.spotifyApiPost(
                api,
                {},
                JSON.stringify(payload)
            );
        }

        const failedCreate: CodyResponse = new CodyResponse();
        failedCreate.status = 500;
        failedCreate.state = CodyResponseType.Failed;
        failedCreate.message = "Unable to fetch the user ID";
        return failedCreate;
    }

    async deletePlaylist(playlist_id: string) {
        const api = `/v1/playlists/${playlist_id}/followers`;
        let codyResp = await musicClient.spotifyApiDelete(api, {}, {});

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiDelete(api, {}, {});
        }

        return codyResp;
    }

    /**
     * type: Valid types are: album , artist, playlist, and track
     * q: can have a filter and keywords, or just keywords. You
     * can have a wildcard as well. The query will search against
     * the name and description if a specific filter isn't specified.
     * examples:
     * 1) search for a track by name "what a time to be alive"
     *    query string: ?q=name:what%20a%20time&type=track
     *    result: this should return tracks matching the track name
     * 2) search for a track using a wildcard in the name
     *    query string: ?q=name:what*&type=track&limit=50
     *    result: will return all tracks with "what" in the name
     * 3) search for an artist in name or description
     *    query string: ?tania%20bowra&type=artist
     *    result: will return all artists where tania bowra is in
     *            the name or description
     * limit: max of 50
     * @param type
     * @param q
     */
    async search(type: string, q: string, limit: number = 50) {
        limit = limit < 1 ? 1 : limit > 50 ? 50 : limit;
        q = q.trim();

        const cacheId = `search_${type}_${q}_${limit}`;
        let searchResult = cacheUtil.getItem(cacheId);
        if (searchResult) {
            // return the value from cache
            return searchResult;
        }

        let qryObj: any = {
            type,
            q,
            limit
        };

        // concat the key/value filterObjects

        const api = `/v1/search`;

        let codyResp: CodyResponse = await musicClient.spotifyApiGet(
            api,
            qryObj
        );

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiGet(api, qryObj);
        }

        let hasData =
            codyResp &&
            codyResp.data &&
            codyResp.data.tracks &&
            codyResp.data.tracks.items &&
            codyResp.data.tracks.items.length > 0
                ? true
                : false;

        // empty result example (and the basic result structure)
        /**
         * {"status":200,"state":"success","statusText":"OK","message":"",
         *   "data":{
         *     "tracks":{
         *       "href":"https://api.spotify.com/v1/search?query=track%3AEl+Perd%C3%B3n+artist%3ANicky+Jam+%26+Enrique+Iglesias&type=track&market=US&offset=0&limit=1",
         *       "items":[],
         *       "limit":1,
         *       "next":null,
         *       "offset":0,
         *       "previous":null,
         *       "total":0
         *     }
         *   },
         *   "error":{}
         *  }
         */
        // If the search doesn't return anything for a track and the search
        // included "track:" and "artist:", try again with just the "track:"
        if (type === "track" && !hasData) {
            // create a new query with just the track
            if (q.includes("track:") && q.includes("artist:")) {
                const trackIdx = q.indexOf("track:");
                const artistIdx = q.indexOf("artist:");
                if (artistIdx > trackIdx) {
                    // grab everything up until the artistIdx
                    q = q.substring(0, artistIdx);
                } else {
                    // grab everything start from the trackIdx
                    q = q.substring(trackIdx);
                }

                q = q.trim();

                qryObj = {
                    type,
                    q,
                    limit
                };
                codyResp = await musicClient.spotifyApiGet(api, qryObj);
            }
        }

        hasData =
            codyResp &&
            codyResp.data &&
            codyResp.data.tracks &&
            codyResp.data.tracks.items &&
            codyResp.data.tracks.items.length > 0
                ? true
                : false;

        let emptyResult: any = {};
        if (!hasData) {
            if (type === "track") {
                emptyResult["tracks"] = { items: [] };
            } else if (type === "album") {
                emptyResult["albums"] = { items: [] };
            } else if (type === "artist") {
                emptyResult["artists"] = { items: [] };
            } else {
                emptyResult["playlists"] = { items: [] };
            }
        }

        searchResult = hasData ? codyResp.data : emptyResult;
        if (hasData) {
            // 6 hours
            cacheUtil.setItem(cacheId, searchResult, 60 * 60 * 6);
        }

        return searchResult;
    }

    /**
     * Add tracks to a given playlist
     * @param playlist_id
     * @param track_ids
     * @param position
     */
    async addTracksToPlaylist(
        playlist_id: string,
        track_ids: string[],
        position: number = 0
    ) {
        let codyResp = new CodyResponse();
        if (!track_ids) {
            codyResp.status = 500;
            codyResp.state = CodyResponseType.Failed;
            codyResp.message = "No track URIs provided to remove from playlist";
            return codyResp;
        }
        const tracks = musicUtil.createUrisFromTrackIds(track_ids);

        let payload = {
            uris: tracks,
            position
        };

        const api = `/v1/playlists/${playlist_id}/tracks`;
        codyResp = await musicClient.spotifyApiPost(api, {}, payload);

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPost(api, {}, payload);
        }

        return codyResp;
    }

    /**
     * Replace tracks of a given playlist. This will wipe out
     * the current set of tracks.
     * @param playlist_id
     * @param track_ids
     */
    async replacePlaylistTracks(playlist_id: string, track_ids: string[]) {
        let codyResp = new CodyResponse();
        if (!track_ids) {
            codyResp.status = 500;
            codyResp.state = CodyResponseType.Failed;
            codyResp.message = "No track URIs provided to remove from playlist";
            return codyResp;
        }
        const tracks = musicUtil.createUrisFromTrackIds(track_ids);

        let payload = {
            uris: tracks
        };

        const api = `/v1/playlists/${playlist_id}/tracks`;
        codyResp = await musicClient.spotifyApiPut(api, {}, payload);

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPut(api, {}, payload);
        }

        return codyResp;
    }

    /**
     * Track IDs should be the uri (i.e. "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
     * but if it's only the id (i.e. "4iV5W9uYEdYUVa79Axb7Rh") this will add
     * the uri part "spotify:track:"
     * @param playlist_id
     * @param trackIds
     */
    async removeTracksFromPlaylist(
        playlist_id: string,
        track_ids: string[]
    ): Promise<CodyResponse> {
        let codyResp = new CodyResponse();
        if (!track_ids) {
            codyResp.status = 500;
            codyResp.state = CodyResponseType.Failed;
            codyResp.message = "No track URIs provided to remove from playlist";
            return codyResp;
        }
        const tracks = musicUtil.createUrisFromTrackIds(
            track_ids,
            true /*addUriObj*/
        );

        codyResp = await musicClient.spotifyApiDelete(
            `/v1/playlists/${playlist_id}/tracks`,
            {},
            { tracks }
        );

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiDelete(
                `/v1/playlists/${playlist_id}/tracks`,
                {},
                { tracks }
            );
        }

        return codyResp;
    }

    buildTrack(spotifyTrack: any) {
        let artists: string[] = [];
        if (spotifyTrack.artists) {
            artists = spotifyTrack.artists.map((artist: any) => {
                return artist.name;
            });
        }

        let track: Track = new Track();
        track.playerType = PlayerType.WebSpotify;
        track.type = spotifyTrack.type;
        track.artist = artists.join(", ");
        track.artist_names = artists;
        track.artists = spotifyTrack.artists;
        track.uri = spotifyTrack.uri;
        track.id = spotifyTrack.id;
        track.name = spotifyTrack.name;
        track.popularity = spotifyTrack.popularity;
        track.duration_ms = spotifyTrack.duration_ms;
        track.duration = spotifyTrack.duration_ms;
        track.disc_number = spotifyTrack.disc_number;
        track.explicit = spotifyTrack.explicit;
        track.href = spotifyTrack.href;
        track.album = spotifyTrack.album;
        return track;
    }
}
