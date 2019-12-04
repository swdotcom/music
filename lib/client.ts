import axios, { AxiosInstance } from "axios";
import { MusicStore } from "./store";
import { CodyResponse, CodyResponseType } from "./models";
const querystring = require("querystring");
const natural = require("natural");

const musicStore = MusicStore.getInstance();
const tokenizer = new natural.WordTokenizer();
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

    buildGenreMap(map: any, token: string) {
        let tokenRegex = new RegExp("\\b" + token + "\\b", "ig");

        const existingKeys = Object.keys(map);
        let foundMatch = false;

        if (existingKeys && existingKeys.length) {
            for (let i = 0; i < existingKeys.length; i++) {
                const key = existingKeys[i];
                let matched = key.match(tokenRegex);

                if (!matched) {
                    // try the other way
                    const inverseRegex = new RegExp("\\b" + key + "\\b", "ig");
                    matched = token.match(inverseRegex);
                    if (matched) {
                        // delete the other one and use the new one
                        const existingCount = map[key].count;
                        map[token] = {
                            count: existingCount + 1,
                            genre: token
                        };
                        foundMatch = true;
                        break;
                    }
                } else {
                    // increment the count
                    map[key].count += 1;
                    foundMatch = true;
                }
            }
        }

        if (!foundMatch) {
            // add it to the map
            map[token] = { count: 1, genre: token };
        }
        return map;
    }

    getHighestFrequencySpotifyGenre(genreList: any[]): string {
        let selectedGenre = "";

        if (!genreList || genreList.length === 0) {
            // there are no genre items, return empty
            return selectedGenre;
        }

        let map: any = {};

        for (let y = 0; y < genreList.length; y++) {
            let genre: string = genreList[y];

            genre = genre ? genre.trim() : "";
            if (!genre) {
                continue;
            }

            // split the individual tokens from each genre
            const tokens = genre.split(" ");

            // also add single words
            for (let z = 0; z < tokens.length; z++) {
                let token = tokens[z] ? tokens[z].trim() : "";
                if (!token) {
                    continue;
                }

                map = this.buildGenreMap(map, token);
            }

            // const tokens = tokenizer.tokenize(genre);
            // const token = tokens.join(" ").toLowerCase();
            map = this.buildGenreMap(map, genre);
        }

        // get the one with the highest count (sort desc)
        if (Object.keys(map).length) {
            genreList = [];
            Object.keys(map).forEach(key => {
                genreList.push(map[key]);
            });
            selectedGenre = genreList.sort(
                (a: any, b: any) => b.count - a.count
            )[0].genre;
        }

        return selectedGenre;
    }

    getGenreFromItems(items: []) {
        let genre = "";
        for (let i = 0; i < items.length; i++) {
            const item: any = items[i];
            if (item && item.genres && item.genres.length > 0) {
                genre = this.getHighestFrequencySpotifyGenre(item.genres);
                if (genre) {
                    break;
                }
            }
        }
        return genre;
    }

    async getGenreFromSpotify(artist: string): Promise<any> {
        if (!musicStore.spotifyAccessToken) {
            return this.throwNoSpotifyTokenInfoError();
        }
        const qParam = encodeURIComponent(`artist:${artist}`);
        const qryStr = `q=${qParam}&type=artist&limit=1`;
        const api = `/v1/search?${qryStr}`;

        spotifyClient.defaults.headers.common[
            "Authorization"
        ] = `Bearer ${musicStore.spotifyAccessToken}`;
        return spotifyClient
            .get(api)
            .then(resp => {
                let genre = "";
                if (
                    resp.data &&
                    resp.data.artists &&
                    resp.data.artists.items &&
                    resp.data.artists.items.length
                ) {
                    genre = this.getGenreFromItems(resp.data.artists.items);
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
        let genre = "";

        let terms = "";
        if (songName && artist) {
            terms = `${artist.trim()} ${songName.trim()}`;
        } else if (songName) {
            terms = `${songName.trim()}`;
        } else if (artist) {
            terms = `${artist.trim()}`;
        }

        // try from itunes
        // search?term=${terms}&limit=3
        let api = `search?term=${encodeURIComponent(terms)}`;
        let resp = await itunesSearchClient.get(api).catch(err => {
            return "";
        });
        if (resp) {
            genre = await this.findNameFromItunesResponse(resp);
        } else {
            // try without the artist, just the song name
            api = `search?term=${encodeURIComponent(songName)}`;
            resp = await itunesSearchClient.get(api).catch(err => {
                return "";
            });
            if (resp) {
                genre = await this.findNameFromItunesResponse(resp);
            }
        }
        return genre;
    }

    findNameFromItunesResponse(resp: any) {
        let genre = "";
        if (resp.data && resp.data.resultCount > 0) {
            for (let i = 0; i < resp.data.resultCount; i++) {
                let result = resp.data.results[i];
                if (result.kind === "song" && result.primaryGenreName) {
                    return result.primaryGenreName;
                } else if (result.primaryGenreName) {
                    genre = result.primaryGenreName;
                }
            }
        }
        return genre;
    }

    /**
     * Refresh the spotify access token
     */
    async refreshSpotifyToken(optionalRefreshToken: string = "") {
        if (!musicStore.spotifyRefreshToken) {
            return {
                status: "failed",
                statusText: "ERROR",
                data: "",
                message: "Missing Spotify Credentials"
            };
        }
        const authPayload = `${musicStore.spotifyClientId}:${musicStore.spotifyClientSecret}`;
        const encodedAuthPayload = Buffer.from(authPayload).toString("base64");

        spotifyAccountClient.defaults.headers.common[
            "Authorization"
        ] = `Basic ${encodedAuthPayload}`;
        spotifyAccountClient.defaults.headers.post["Content-Type"] =
            "application/x-www-form-urlencoded";

        const useOptionalAccessToken = optionalRefreshToken ? true : false;
        const refreshToken = optionalRefreshToken
            ? optionalRefreshToken
            : musicStore.spotifyRefreshToken;
        let response = await spotifyAccountClient
            .post(
                `/api/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
                null
            )
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
                console.log("refresh token error: ", err.message);
                if (err.response) {
                    return {
                        status: "failed",
                        message: err.message
                    };
                }
                return err;
            });
        if (response.status === "success" && !useOptionalAccessToken) {
            musicStore.spotifyAccessToken = response.data;
        }
        return response;
    }

    async spotifyApiGet(
        api: string,
        qsOptions: any = {},
        optionalAccessToken: string = ""
    ): Promise<CodyResponse> {
        if (!musicStore.spotifyAccessToken) {
            return this.throwNoSpotifyTokenInfoError();
        }
        api = this.addQueryStringToApi(api, qsOptions);

        // console.log(`GET API: ${api}`);
        const accessToken = optionalAccessToken
            ? optionalAccessToken
            : musicStore.spotifyAccessToken;

        spotifyClient.defaults.headers.common[
            "Authorization"
        ] = `Bearer ${accessToken}`;

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

        spotifyClient.defaults.headers.common[
            "Authorization"
        ] = `Bearer ${musicStore.spotifyAccessToken}`;
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

        spotifyClient.defaults.headers.common[
            "Authorization"
        ] = `Bearer ${musicStore.spotifyAccessToken}`;
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

        // console.log("DELETE API: ", api);

        spotifyClient.defaults.headers.common[
            "Authorization"
        ] = `Bearer ${musicStore.spotifyAccessToken}`;
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
        if (err.response && err.response.data && err.response.data.error) {
            codyResp.message = err.response.data.error.message;
        } else {
            codyResp.message = err.message;
        }
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
