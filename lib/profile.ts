import { MusicClient } from "./client";
import { MusicStore } from "./store";
import { MusicPlayerState } from "./playerstate";
import { SpotifyAuthState } from "./models";

const musicClient = MusicClient.getInstance();
const musicPlayerCtr = MusicPlayerState.getInstance();
const musicStore = MusicStore.getInstance();

export class SpotifyUser {
    birthdate: string = ""; // format YYYY-MM-DD
    country: string = "";
    display_name: string = "";
    email: string = "";
    uri: string = "";
    id: string = "";
    followers: any = {};
    product: string = "";
    // {"birthdate":"1937-06-01","country":"SE","display_name":"JM Wizzler",
    // "email":"email@example.com","external_urls":{"spotify":"https://open.spotify.com/user/wizzler"},
    // "followers":{"href":null,"total":3829},"href":"https://api.spotify.com/v1/users/wizzler",
    // "id":"wizzler","images":[{"height":null,
    // "url":"https://fbcdn-profile-a.akamaihd.net/hprofile-ak-frc3/t1.0-1/1970403_10152215092574354_1798272330_n.jpg",
    //"width":null}],"product":"premium","type":"user","uri":"spotify:user:wizzler"}
}

export class UserProfile {
    private static instance: UserProfile;
    private constructor() {
        //
    }

    static getInstance() {
        if (!UserProfile.instance) {
            UserProfile.instance = new UserProfile();
        }
        return UserProfile.instance;
    }

    async accessExpired(): Promise<boolean> {
        if (!musicStore.hasSpotifyAccessToken()) {
            // no access token to check against
            return false;
        }
        const api = "/v1/me";
        let resp = await musicClient.spotifyApiGet(api);
        if (resp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            resp = await musicClient.spotifyApiGet(api);
            if (resp.status === 401) {
                return true;
            }
        }
        return false;
    }

    async getUserProfile(): Promise<SpotifyUser> {
        let userProfile: SpotifyUser = new SpotifyUser();
        let api = "/v1/me";
        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (response && response.status === 200 && response.data) {
            userProfile = response.data;
            musicStore.spotifyUserId = userProfile.id;
        }

        return userProfile;
    }

    async spotifyAuthState(): Promise<SpotifyAuthState> {
        // check if they have oauth activated
        const oauthActivated = musicStore.spotifyAccessToken ? true : false;

        // they have a spotify access token, check devices
        const devices = await musicPlayerCtr.getSpotifyDevices();

        const loggedIn =
            oauthActivated && devices && devices.length > 0 ? true : false;

        let authState: SpotifyAuthState = new SpotifyAuthState();
        authState.loggedIn = loggedIn;
        authState.oauthActivated = oauthActivated;

        return authState;
    }
}
