import axios, { AxiosInstance } from "axios";
import { MusicStore } from "./store";
const querystring = require("querystring");
const superagent = require("superagent");

const musicStore = MusicStore.getInstance();

const spotifyClient: AxiosInstance = axios.create({
    baseURL: "https://api.spotify.com"
});
const connectServerClient: AxiosInstance = axios.create({
    baseURL: "http://localhost:5000"
});

/**
 * Spotify Error Cases
 * When performing an action that is restricted,
 * 404 NOT FOUND or 403 FORBIDDEN will be returned together with a player error message.
 * For example, if there are no active devices found, the request will
 * return 404 NOT FOUND response code and the reason NO_ACTIVE_DEVICE, or,
 * if the user making the request is non-premium, a 403 FORBIDDEN response
 * code will be returned together with the PREMIUM_REQUIRED reason.
 */

export class MusicClient {
    private static instance: MusicClient;
    private constructor() {
        //
    }
    static getInstance() {
        if (!MusicClient.instance) {
            MusicClient.instance = new MusicClient();
        }
        return MusicClient.instance;
    }

    /**
     * Refresh the spotify access token
     */
    async refreshSpotifyToken() {
        const payload = `${musicStore.spotifyClientId}:${
            musicStore.spotifyClientSecret
        }`;
        const encodedPayload = Buffer.from(payload).toString("base64");

        let response = await superagent
            .post("https://accounts.spotify.com/api/token")
            .send({
                grant_type: "refresh_token",
                refresh_token: musicStore.spotifyRefreshToken
            }) // sends a JSON post body
            .set("Authorization", `Basic ${encodedPayload}`)
            .set("Accept", "application/json")
            .set("Content-Type", "application/x-www-form-urlencoded")
            .then((resp: any) => {
                /**
                 * -- main attributes --
                 * ok:true
                 * status:200
                 * statusCode:200
                 * unauthorized:false
                 * noContent:false
                 * notAcceptable:false
                 * notFound:false
                 * body:Object {
                        access_token:"BQAXPZVQT5_7tBViPq_u5xb8iczA0cjMAls6xk35Tg5_ahSTg-SoZfd5KfOp_bvDcRQQwYhbzFMzU2OrNz1heDf4qtRcbTvadzJaZjSWonahP3cjXhuT2J-UoW-kfZXXWHJvDpG6D7tcqNrssbaaQqi-zPZcdRkL0HM6g8BRtJxH4WKnVQsujH-sIkFsOHFsCFd8LT9o2XBVTqUbUEsgERyayXOf3v-rFwRLFqgSawtlv99oftxFemKZ-IwgSgOs4tww2zh43jIGPLQF1ECJsQgNQ-m5ELRwfdL77-5dgGqe"
                        expires_in:3600
                        scope:"playlist-read-private playlist-read-collaborative user-follow-read playlist-modify-private user-read-email user-read-private app-remote-control streaming user-follow-modify user-modify-playback-state user-library-read user-library-modify playlist-modify-public user-read-playback-state user-read-currently-playing user-read-recently-played user-top-read"
                        token_type:"Bearer"
                */
                if (resp.ok && resp.body) {
                    return { status: "success", data: resp.body.access_token };
                }
                return {
                    status: "failed",
                    message: `Response info: ${JSON.stringify(resp)}`
                };
            })
            .catch((error: any) => {
                return { status: "failed", message: error.message };
            });
        if (response.status === "success") {
            musicStore.spotifyAccessToken = response.data;
        }
        return response;
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

    spotifyApiPut(api: string, qsOptions: any = {}, payload: any = {}) {
        const qs = querystring.stringify(qsOptions);
        if (qs) {
            api += `?${qs}`;
        }
        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;
        return spotifyClient.put(api, payload).catch(err => {
            if (err.response) {
                return {
                    status: err.response.status,
                    statusText: err.response.statusText,
                    message: err.message
                };
            }
            return err;
        });
    }

    spotifyApiPost(api: string, qsOptions: any = {}, payload: any = {}) {
        const qs = querystring.stringify(qsOptions);
        if (qs) {
            api += `?${qs}`;
        }
        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;
        return spotifyClient.post(api, payload).catch(err => {
            if (err.response) {
                return {
                    status: err.response.status,
                    statusText: err.response.statusText,
                    message: err.message
                };
            }
            return err;
        });
    }
}
