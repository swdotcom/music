import { MusicClient } from "./client";
import { CodyResponse, CodyResponseType } from "./models";
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

    async createPlaylist(name: string, isPublic: boolean) {
        // get the profile if we don't have it
        if (!musicStore.spotifyUserId) {
            await userProfile.getUserProfile();
        }

        if (!musicStore.spotifyUserId) {
            /**
             * --data "{\"name\":\"A New Playlist\", \"public\":false}
             */
            const payload = {
                name,
                public: isPublic
            };
            const api = `/v1/users/${musicStore.spotifyUserId}/playlists`;
            return await musicClient.spotifyApiPost(api, {}, payload);
        }

        const failedCreate: CodyResponse = new CodyResponse();
        failedCreate.status = 500;
        failedCreate.state = CodyResponseType.Failed;
        failedCreate.message = "Unable to fetch the user ID";
        return failedCreate;
    }

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
        let tracks = [];
        for (let i = 0; i < track_ids.length; i++) {
            let trackId = track_ids[i];
            if (!trackId.includes("spotify:track:")) {
                trackId = `spotify:track:${trackId}`;
            }
            tracks.push(trackId);
        }

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
            codyResp = await await musicClient.spotifyApiPost(api, {}, payload);
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
        let tracks: any[] = [];

        for (let i = 0; i < track_ids.length; i++) {
            let trackId = track_ids[i];
            if (!trackId.includes("spotify:track:")) {
                trackId = `spotify:track:${trackId}`;
            }
            const urlObj = {
                uri: trackId
            };
            tracks.push(urlObj);
        }

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
            codyResp = await await musicClient.spotifyApiDelete(
                `/v1/playlists/${playlist_id}/tracks`,
                {},
                { tracks }
            );
        }

        return codyResp;
    }
}
