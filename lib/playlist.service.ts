import { MusicClient, SPOTIFY_ROOT_API } from "./client";
import {
    CodyResponse,
    CodyResponseType,
    PlaylistItem,
    Track,
    PaginationItem,
    PlayerType,
} from "./models";
import { MusicStore } from "./store";
import { UserProfile } from "./profile";
import { MusicUtil } from "./util";
import { CacheManager } from "./cache";

const musicClient = MusicClient.getInstance();
const musicStore = MusicStore.getInstance();
const userProfile = UserProfile.getInstance();
const musicUtil = new MusicUtil();

const cacheMgr: CacheManager = CacheManager.getInstance();

export class PlaylistService {
    private static instance: PlaylistService;
    private constructor() {
        //
    }
    static getInstance() {
        if (!PlaylistService.instance) {
            PlaylistService.instance = new PlaylistService();
        }
        return PlaylistService.instance;
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
        if (codyResp.status === 401) {
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
            ids: trackIds,
        };
        let codyResp: CodyResponse = await musicClient.spotifyApiPut(
            api,
            qsOptions,
            payload
        );

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPut(api, qsOptions, payload);
        }

        return codyResp;
    }

    async getSavedTracks(qsOptions: any = {}) {
        let tracks: Track[] = [];

        const totalTracksToFetch =
            !qsOptions.limit || qsOptions.limit === -1 ? -1 : qsOptions.limit;

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
        if (codyResp.status === 401) {
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
                let fetchedLimit = false;
                for (let x = 0; x < trackContainers.length; x++) {
                    const item = trackContainers[x];
                    if (item.track) {
                        const track: Track = musicUtil.buildTrack(item.track);
                        tracks.push(track);
                    }
                    if (
                        totalTracksToFetch > 0 &&
                        tracks.length >= totalTracksToFetch
                    ) {
                        fetchedLimit = true;
                        break;
                    }
                }

                if (fetchedLimit) {
                    break;
                }

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
            const spotifyUserId = musicStore.spotifyUserId;
            const fetchAll = qsOptions.all ? true : false;
            let limit = qsOptions.limit ? qsOptions.limit : 50;
            limit = limit < 1 ? 1 : limit;
            let offset = qsOptions.offset ? qsOptions.offset : 0;
            let codyResp = await this.getPlaylistsForUser(
                spotifyUserId,
                limit,
                offset
            );

            if (musicUtil.isItemsResponseOk(codyResp)) {
                let playlistItems = codyResp.data.items;
                // ensure the playerType is set
                playlistItems.forEach((playlist: PlaylistItem) => {
                    playlist.playerType = PlayerType.WebSpotify;
                    playlist.type = "playlist";

                    playlists.push(playlist);
                });

                // check if we need to fetch every playlist
                if (fetchAll) {
                    let threshold = codyResp.data.limit + codyResp.data.offset;
                    let total = codyResp.data.total;

                    while (total > threshold) {
                        // update the next offset and fetch the next set
                        offset = threshold;

                        codyResp = await this.getPlaylistsForUser(
                            musicStore.spotifyUserId,
                            limit,
                            offset
                        );

                        if (musicUtil.isItemsResponseOk(codyResp)) {
                            playlistItems = codyResp.data.items;
                            // ensure the playerType is set
                            playlistItems.forEach((playlist: PlaylistItem) => {
                                playlist.playerType = PlayerType.WebSpotify;
                                playlist.type = "playlist";
                                playlists.push(playlist);
                            });
                        }
                        threshold = codyResp.data.limit + codyResp.data.offset;
                        total = codyResp.data.total;
                    }
                }
            }
        }

        return playlists;
    }

    async getPlaylistsForUser(
        spotifyUserId: string,
        limit: number,
        offset: number
    ): Promise<CodyResponse> {
        limit = limit || 50;
        offset = offset || 0;
        const qsOptions = {
            limit,
            offset,
        };

        const api = `/v1/users/${spotifyUserId}/playlists`;
        let codyResp: CodyResponse = await musicClient.spotifyApiGet(
            api,
            qsOptions
        );
        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiGet(api, qsOptions);
        }

        return codyResp;
    }

    async getSpotifyPlaylist(playlist_id: string): Promise<PlaylistItem> {
        let playlistItem: PlaylistItem = new PlaylistItem();

        // make sure the ID is not the URI
        playlist_id = musicUtil.createSpotifyIdFromUri(playlist_id);

        const api = `/v1/playlists/${playlist_id}`;

        let codyResp: CodyResponse = await musicClient.spotifyApiGet(api, {});

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiGet(api, {});
        }

        if (musicUtil.isResponseOk(codyResp)) {
            playlistItem = {
                ...codyResp.data,
            };
        }

        return playlistItem;
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
            "href,limit,next,offset,previous,total,items(track(name,id,album(id,name),artists,popularity))";

        const api = `/v1/playlists/${playlist_id}/tracks`;
        let codyResp = await musicClient.spotifyApiGet(api, qsOptions);

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
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
                        const track: Track = musicUtil.buildTrack(item.track);
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
        let playlistNames = await this.getPlaylists(qsOptions);
        if (playlistNames) {
            names = playlistNames.map((playlistItem: PlaylistItem) => {
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
    ): Promise<CodyResponse> {
        // get the profile if we don't have it
        if (!musicStore.spotifyUserId) {
            await userProfile.getUserProfile();
        }

        const spotifyUserId = musicStore.spotifyUserId;

        let playlists: PlaylistItem[] = cacheMgr.get("playlists");
        if (!playlists) {
            // fetch the playlists again
            playlists = await this.getPlaylists();
        }

        // check if it's already in the playlist
        const existingPlaylist: PlaylistItem[] = playlists.length
            ? playlists.filter((n: PlaylistItem) => n.name === name)
            : [];
        if (existingPlaylist.length > 0) {
            // already exists, return it
            const failedCreate: CodyResponse = new CodyResponse();
            failedCreate.status = 500;
            failedCreate.state = CodyResponseType.Failed;
            failedCreate.message = `The playlist '${name}' already exists`;
            return failedCreate;
        }

        if (spotifyUserId) {
            /**
             * --data "{\"name\":\"A New Playlist\", \"public\":false}
             */
            const payload = {
                name,
                public: isPublic,
                description,
            };
            const api = `/v1/users/${spotifyUserId}/playlists`;
            const resp: CodyResponse = await musicClient.spotifyApiPost(
                api,
                {},
                JSON.stringify(payload)
            );
            if (resp && resp.state === CodyResponseType.Success) {
                // fetch this playlist to add it to "playlists"
                const playlistId = resp.data.id;
                const createdPlaylistItem: PlaylistItem = await this.getSpotifyPlaylist(
                    playlistId
                );
                if (createdPlaylistItem) {
                    playlists.push(createdPlaylistItem);
                }
            }
            return resp;
        }

        const failedCreate: CodyResponse = new CodyResponse();
        failedCreate.status = 500;
        failedCreate.state = CodyResponseType.Failed;
        failedCreate.message = "Unable to fetch the user ID";
        return failedCreate;
    }

    async deletePlaylist(playlist_id: string): Promise<CodyResponse> {
        playlist_id = musicUtil.createSpotifyIdFromUri(playlist_id);
        const api = `/v1/playlists/${playlist_id}/followers`;
        let codyResp = await musicClient.spotifyApiDelete(api, {}, {});

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
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

        let qryObj: any = {
            type,
            q,
            limit,
        };

        // concat the key/value filterObjects

        const api = `/v1/search`;

        let codyResp: CodyResponse = await musicClient.spotifyApiGet(
            api,
            qryObj
        );

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
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
                    limit,
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

        const searchResult = hasData ? codyResp.data : emptyResult;

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
            codyResp.message = "No track URIs provided to add to playlist";
            return codyResp;
        }
        const tracks = musicUtil.createUrisFromTrackIds(track_ids);

        let payload = {
            uris: tracks,
            position,
        };

        const api = `/v1/playlists/${playlist_id}/tracks`;
        codyResp = await musicClient.spotifyApiPost(api, {}, payload);

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
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
            uris: tracks,
        };

        const api = `/v1/playlists/${playlist_id}/tracks`;
        codyResp = await musicClient.spotifyApiPut(api, {}, payload);

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
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
        playlist_id = musicUtil.createSpotifyIdFromUri(playlist_id);
        let codyResp = new CodyResponse();
        if (!track_ids) {
            codyResp.status = 500;
            codyResp.state = CodyResponseType.Failed;
            codyResp.message = "No track URIs provided to remove from playlist";
            return codyResp;
        }
        // returns list of URIs
        let payload: any = {};
        payload["tracks"] = musicUtil.createUrisFromTrackIds(
            track_ids,
            true /*addUriObj*/
        );

        // console.log(`removeTracksFromPlaylist ${JSON.stringify(payload)}`);

        codyResp = await musicClient.spotifyApiDelete(
            `/v1/playlists/${playlist_id}/tracks`,
            {},
            payload
        );

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiDelete(
                `/v1/playlists/${playlist_id}/tracks`,
                {},
                payload
            );
        }

        return codyResp;
    }

    async getTopSpotifyTracks() {
        let tracks: Track[] = [];

        const api = `/v1/me/top/tracks`;

        // add to the api to prevent the querystring from escaping the comma
        const qsOptions = {
            time_range: "medium_term",
            limit: 50,
        };

        let response = await musicClient.spotifyApiGet(api, qsOptions);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api, qsOptions);
        }
        if (musicUtil.isResponseOk(response)) {
            tracks = response.data.items;
        }

        if (tracks && tracks.length > 0) {
            tracks = tracks.map((track) => {
                return musicUtil.copySpotifyTrackToCodyTrack(track);
            });
        }

        return tracks;
    }

    /**
     * follow a playlist
     * @param playlist_id
     */
    async followPlaylist(playlist_id: string): Promise<CodyResponse> {
        playlist_id = musicUtil.createSpotifyIdFromUri(playlist_id);
        const api = `/v1/playlists/${playlist_id}/followers`;
        let codyResp = await musicClient.spotifyApiPut(api, {}, {});

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPut(api, {}, {});
        }

        return codyResp;
    }
}
