import { MusicClient } from "./client";
import {
    CodyResponse,
    CodyResponseType,
    PlaylistItem,
    Track,
    PaginationItem,
    PlayerType,
    Album
} from "./models";
import { MusicStore } from "./store";
import { UserProfile } from "./profile";

const musicClient = MusicClient.getInstance();
const musicStore = MusicStore.getInstance();
const userProfile = UserProfile.getInstance();

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
                codyResp = await musicClient.spotifyApiGet(api, {});
            }
            if (codyResp && codyResp.data && codyResp.data.items) {
                playlists = codyResp.data.items;
            }
        }

        return playlists;
    }

    async getPlaylistTracks(playlist_id: string, qsOptions: any = {}) {
        if (!qsOptions.limit) {
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

        // get the artists
        if (
            codyResp.state === CodyResponseType.Success &&
            codyResp.data.items
        ) {
            const paginationItem: PaginationItem = new PaginationItem();
            paginationItem.offset = codyResp.data.offset;
            paginationItem.next = codyResp.data.next;
            paginationItem.previous = codyResp.data.previous;
            paginationItem.limit = codyResp.data.limit;
            paginationItem.total = codyResp.data.total;

            let tracks: Track[] = [];

            codyResp.data.items.forEach((item: any) => {
                if (item.track) {
                    // create a Track
                    let track: Track = new Track();
                    track.artists = item.track.artists.map((artist: any) => {
                        return artist.name;
                    });
                    if (track.artist) {
                        track.artist = track.artists.join(", ");
                    }
                    track.id = item.track.id;
                    track.name = item.track.name;
                    track.uri = item.track.uri;
                    track.href = item.track.href;
                    track.explicit = item.track.explicit;
                    track.type = "track";
                    track.playerType = PlayerType.WebSpotify;

                    // get the album info
                    let albumData: Album = new Album();
                    albumData.id = item.track.album.id;
                    albumData.name = item.track.album.name;
                    track.albumData = albumData;
                    track.album = albumData.name;

                    tracks.push(track);
                }
            });

            paginationItem.items = tracks;
            // delete the old type of data
            delete codyResp.data;
            // update with the pagination item info
            codyResp["data"] = paginationItem;
        }

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
        const tracks = this.normalizeTrackIds(track_ids);

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
        const tracks = this.normalizeTrackIds(track_ids);

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
        const tracks = this.normalizeTrackIds(track_ids, true /*addUriObj*/);

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

    normalizeTrackIds(track_ids: string[], useUriObj: boolean = false) {
        let tracks = [];

        for (let i = 0; i < track_ids.length; i++) {
            let uri = track_ids[i];
            if (!uri.includes("spotify:track:")) {
                uri = `spotify:track:${uri}`;
            }
            if (useUriObj) {
                const urlObj = {
                    uri
                };
                tracks.push(urlObj);
            } else {
                tracks.push(uri);
            }
        }

        return tracks;
    }
}
