import axios, { AxiosInstance } from "axios";
import { MusicStore } from "./store";
import { CodyResponse, CodyResponseType } from "./models";
const querystring = require("querystring");

const musicStore = MusicStore.getInstance();
export const SPOTIFY_ROOT_API = "https://api.spotify.com";

const spotifyClient: AxiosInstance = axios.create({
    baseURL: SPOTIFY_ROOT_API
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

    async getGenreFromSpotify(artist: string): Promise<any> {
        if (!musicStore.spotifyAccessToken) {
            return this.throwNoSpotifyTokenInfoError();
        }
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

    async spotifyApiGet(
        api: string,
        qsOptions: any = {}
    ): Promise<CodyResponse> {
        if (!musicStore.spotifyAccessToken) {
            return this.throwNoSpotifyTokenInfoError();
        }
        api = this.addQueryStringToApi(api, qsOptions);

        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;

        return spotifyClient
            .get(api)
            .then((resp: any) => {
                return this.buildSuccessResponse(resp);
            })
            .catch(async err => {
                return this.buildErrorResponse(err);
            });
    }

    async spotifyApiPut(
        api: string,
        qsOptions: any = {},
        payload: any = {}
    ): Promise<CodyResponse> {
        if (!musicStore.spotifyAccessToken) {
            return this.throwNoSpotifyTokenInfoError();
        }
        api = this.addQueryStringToApi(api, qsOptions);

        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;
        return spotifyClient
            .put(api, payload)
            .then((resp: any) => {
                return this.buildSuccessResponse(resp);
            })
            .catch(err => {
                return this.buildErrorResponse(err);
            });
    }

    async spotifyApiPost(
        api: string,
        qsOptions: any = {},
        payload: any = {}
    ): Promise<CodyResponse> {
        if (!musicStore.spotifyAccessToken) {
            return this.throwNoSpotifyTokenInfoError();
        }
        api = this.addQueryStringToApi(api, qsOptions);

        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;
        return spotifyClient
            .post(api, payload)
            .then((resp: any) => {
                return this.buildSuccessResponse(resp);
            })
            .catch(err => {
                return this.buildErrorResponse(err);
            });
    }

    async spotifyApiDelete(
        api: string,
        qsOptions: any = {},
        payload: any = {}
    ): Promise<CodyResponse> {
        if (!musicStore.spotifyAccessToken) {
            return this.throwNoSpotifyTokenInfoError();
        }
        api = this.addQueryStringToApi(api, qsOptions);

        spotifyClient.defaults.headers.common["Authorization"] = `Bearer ${
            musicStore.spotifyAccessToken
        }`;
        return spotifyClient
            .delete(api, payload)
            .then((resp: any) => {
                return this.buildSuccessResponse(resp);
            })
            .catch(err => {
                return this.buildErrorResponse(err);
            });
    }

    addQueryStringToApi(api: string, qsOptions: any = {}) {
        const qs = querystring.stringify(qsOptions);
        if (qs) {
            api += `?${qs}`;
        }
        return api;
    }

    buildSuccessResponse(resp: any): CodyResponse {
        // it's 200 by default
        const codyResp = new CodyResponse();
        if (resp.status) {
            codyResp.status = resp.status;
        }
        if (resp.statusText) {
            codyResp.statusText = resp.statusText;
        }
        codyResp.data = resp && resp.data ? resp.data : resp;
        return codyResp;
    }

    buildErrorResponse(err: any): CodyResponse {
        const codyResp = new CodyResponse();
        if (err.status) {
            codyResp.status = err.status;
        } else {
            codyResp.status = 500;
        }
        codyResp.state = CodyResponseType.Failed;
        codyResp.error = err;
        codyResp.message = err.message;
        if (err.response && err.response.status === 401) {
            codyResp.statusText = "EXPIRED";
        } else {
            codyResp.statusText = "ERROR";
        }
        return codyResp;
    }

    throwNoSpotifyTokenInfoError(): CodyResponse {
        const codyResp = new CodyResponse();
        codyResp.status = 400;
        codyResp.state = CodyResponseType.Failed;
        codyResp.message = "Missing Spotify access token information.";
        codyResp.statusText = "ERROR";
        return codyResp;
    }
}
