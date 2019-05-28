import { MusicClient } from "./client";
import { CodyResponse, CodyResponseType, PlaylistItem, Track } from "./models";
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
        qsOptions["fields"] = "items(track(name,id,album(id,name),artists))";

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
            codyResp.data.items &&
            codyResp.data.items.length > 0
        ) {
            codyResp.data.items.forEach((item: any) => {
                let artists: any[] = [];
                if (
                    item.track &&
                    item.track.artists &&
                    item.track.artists.length > 0
                ) {
                    item.track.artists.forEach((artist: any) => {
                        artists.push(artist.name);
                    });
                    delete item.track.artists;
                    item.track["artists"] = artists;
                }
            });
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
