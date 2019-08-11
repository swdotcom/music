import { MusicClient } from "./client";
import { MusicStore } from "./store";

const musicClient = MusicClient.getInstance();
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

    async getUserProfile(): Promise<SpotifyUser> {
        let spotifyUser: SpotifyUser = new SpotifyUser();
        let api = "/v1/me";
        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (response && response.status === 200 && response.data) {
            spotifyUser = response.data;
            musicStore.spotifyUserId = spotifyUser.id;
        }

        return spotifyUser;
    }
}
