import axios, { AxiosInstance } from "axios";
import { MusicStore } from "./store";
const querystring = require("querystring");

const musicStore = MusicStore.getInstance();

const spotifyClient: AxiosInstance = axios.create({
    baseURL: "https://api.spotify.com"
});
const spotifyAccountClient: AxiosInstance = axios.create({
    baseURL: "https://accounts.spotify.com",
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
});
const itunesSearchClient: AxiosInstance = axios.create({
    baseURL: "https://itunes.apple.com"
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

    getGenreFromSpotify(artist: string): Promise<any> {
        const qParam = encodeURIComponent(`artist:${artist}`);
        const qryStr = `q=${qParam}&type=artist&limit=1`;
        const api = `/v1/search?${qryStr}`;

        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;
        return spotifyClient
            .get(api)
            .then(resp => {
                let genre = "";
                if (resp.data && resp.data.artists && resp.data.artists.items) {
                    const items = resp.data.artists.items;
                    if (items && items.length > 0) {
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (item && item.genres && item.genres.length > 0) {
                                genre = item.genres.join(", ");
                                break;
                            }
                        }
                    }
                }
                return {
                    status: "success",
                    statusText: resp.statusText,
                    data: genre
                };
            })
            .catch(err => {
                return this.buildErrorResponse(err);
            });
    }

    async getGenreFromItunes(
        artist: string,
        songName: string = ""
    ): Promise<string> {
        // try from itunes
        // search?term=${terms}&limit=3
        let terms = songName ? `${artist} ${songName}` : artist;
        const api = `search?term=${terms}`;
        return itunesSearchClient
            .get(api)
            .then(resp => {
                let secondaryGenreName = "";
                if (resp.data && resp.data.resultCount > 0) {
                    for (let i = 0; i < resp.data.resultCount; i++) {
                        let result = resp.data.results[i];
                        if (result.kind === "song" && result.primaryGenreName) {
                            return result.primaryGenreName;
                        } else if (result.primaryGenreName) {
                            secondaryGenreName = result.primaryGenreName;
                        }
                    }
                }
                return secondaryGenreName;
            })
            .catch(err => {
                console.error(
                    "Unable to retrieve genre from itunes search: ",
                    err.message
                );
                return "";
            });
    }

    /**
     * Refresh the spotify access token
     */
    async refreshSpotifyToken() {
        if (!musicStore.spotifyRefreshToken) {
            return {
                status: "failed",
                statusText: "ERROR",
                data: "",
                message: "Missing Spotify Credentials"
            };
        }
        const authPayload = `${musicStore.spotifyClientId}:${
            musicStore.spotifyClientSecret
        }`;
        const encodedAuthPayload = Buffer.from(authPayload).toString("base64");

        spotifyAccountClient.defaults.headers.common[
            "Authorization"
        ] = `Basic ${encodedAuthPayload}`;
        spotifyAccountClient.defaults.headers.post["Content-Type"] =
            "application/x-www-form-urlencoded";
        const payload = {
            grant_type: "refresh_token",
            refresh_token: musicStore.spotifyRefreshToken
        };
        const params = new URLSearchParams();
        params.append("grant_type", "refresh_token");
        params.append("refresh_token", musicStore.spotifyRefreshToken);
        let response = await spotifyAccountClient
            .post("/api/token", params)
            .then(resp => {
                if (resp.data && resp.data.access_token) {
                    return { status: "success", data: resp.data.access_token };
                } else {
                    return {
                        status: "failed",
                        message: "Unable refresh the access token"
                    };
                }
            })
            .catch(err => {
                if (err.response) {
                    return {
                        status: "failed",
                        message: err.message
                    };
                }
                return err;
            });
        if (response.status === "success") {
            musicStore.spotifyAccessToken = response.data;
        }
        return response;
    }

    spotifyApiGet(api: string, qsOptions: any = {}): Promise<any> {
        const qs = querystring.stringify(qsOptions);
        if (qs) {
            api += `?${qs}`;
        }

        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;

        return spotifyClient.get(api).catch(async err => {
            return this.buildErrorResponse(err);
        });
    }

    spotifyApiPut(
        api: string,
        qsOptions: any = {},
        payload: any = {}
    ): Promise<any> {
        const qs = querystring.stringify(qsOptions);
        if (qs) {
            api += `?${qs}`;
        }

        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;
        return spotifyClient.put(api, payload).catch(err => {
            return this.buildErrorResponse(err);
        });
    }

    spotifyApiPost(
        api: string,
        qsOptions: any = {},
        payload: any = {}
    ): Promise<any> {
        const qs = querystring.stringify(qsOptions);
        if (qs) {
            api += `?${qs}`;
        }

        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;
        return spotifyClient.post(api, payload).catch(err => {
            return this.buildErrorResponse(err);
        });
    }

    buildErrorResponse(err: any) {
        if (err.response && err.response.status === 401) {
            return {
                status: "failed",
                statusText: "EXPIRED",
                error: err,
                message: err.message
            };
        } else {
            return {
                status: "failed",
                statusText: "ERROR",
                error: err,
                message: err.message
            };
        }
    }
}
