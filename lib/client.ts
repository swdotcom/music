import axios, { AxiosInstance } from "axios";
import { MusicStore } from "./store";
import { promises } from "fs";

const musicStore = new MusicStore();

const spotifyClient: AxiosInstance = axios.create({
    baseURL: "https://api.spotify.com"
});
const connectServerClient: AxiosInstance = axios.create({
    baseURL: "http://localhost:5000"
});

export class MusicClient {
    async refreshSpotifyToken() {
        const payload = `${musicStore.spotifyClientId}:${
            musicStore.spotifyClientSecret
        }`;
        const encodedPayload = Buffer.from(payload).toString("base64");

        connectServerClient.defaults.headers.common[
            "Authorization"
        ] = `Basic ${encodedPayload}`;
        connectServerClient.defaults.headers.common["Content-Type"] =
            "application/x-www-form-urlencoded";
        const body = {
            grant_type: "refresh_token",
            refresh_token: musicStore.spotifyRefreshToken
        };

        return await connectServerClient
            .post("/api/token", body)
            .then(resp => {
                return resp;
            })
            .catch(err => {
                return err;
            });
    }

    spotifyApiGet(api: string): Promise<any> {
        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;

        return spotifyClient.get(api).catch(async error => {
            if (error.response && error.response.status === 401) {
                return { statusText: "EXPIRED", error, message: error.message };
            } else {
                return { statusText: "ERROR", error, message: error.message };
            }
        });
    }
}
