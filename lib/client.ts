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

const spotifyGenres = [
    "top",
    "summer",
    "pop",
    "mood",
    "electronic dance",
    "edm",
    "decades",
    "hip hop",
    "rap",
    "hip-hop",
    "chill",
    "workout",
    "party",
    "focus",
    "sleep",
    "pride",
    "rock",
    "dinner",
    "jazz",
    "r&b",
    "rhythm",
    "romance",
    "soul",
    "indie",
    "gaming",
    "classical",
    "heavy metal",
    "latin",
    "kids & family",
    "reggae",
    "blues",
    "funk",
    "punk",
    "country",
    "folk",
    "acoustic",
    "desi",
    "arab",
    "afro",
    "travel",
    "k-pop"
];

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

    getHighestFrequencySpotifyGenre(genreList: any[]): string {
        if (musicStore.debug) {
            console.log("Genre List: ", genreList);
        }
        let selectedGenre = "";

        if (!genreList || genreList.length === 0) {
            // there are no genre items, return empty
            return selectedGenre;
        }

        let map: any = {};

        // create a mapping of the originals
        genreList.forEach((genre: string) => {
            genre = genre ? genre.trim().toLowerCase() : "";
            if (genre) {
                // creates a mapping of the orig i.e. {"hip hop": {rank: 0, genre: "hip hop"}}
                map[genre] = { rank: 0, genre };
                const tokens = genre.split(" ");

                // now create single token mapping i.e. {rock: {rank: 0, genre: "rock"}}
                tokens.forEach((token: string) => {
                    token = token ? token.trim() : "";

                    if (!map[token]) {
                        map[token] = { rank: 0, genre: token };
                    }
                });
            }
        });

        const hasKeys = Object.keys(map).length ? true : false;

        if (hasKeys) {
            // this will increment the rank so we can sort them in descending order
            // to find the highest ranking genre
            genreList.forEach((genre: string) => {
                genre = genre ? genre.trim().toLowerCase() : "";
                if (genre) {
                    // now split the words
                    const tokens = genre.split(" ");
                    tokens.forEach((token: string) => {
                        token = token ? token.trim() : "";
                        if (token) {
                            const tokenRegex = new RegExp(
                                "\\b" + token + "\\b",
                                "ig"
                            );

                            Object.keys(map).forEach(key => {
                                if (key !== token && key !== genre) {
                                    if (key.match(tokenRegex)) {
                                        // increment the count
                                        map[key].rank += 1;
                                    }
                                }
                            });
                        }
                    });
                }
            });

            // Now go over every key to see if it's tokens(s)
            // are found in another key's set of keywords
            Object.keys(map).forEach(key => {
                // check to see if this key pattern matches other keys
                Object.keys(map).forEach(subKey => {
                    // but don't match itself
                    if (subKey !== key) {
                        let regex = new RegExp("\\b" + key + "\\b", "ig");
                        if (subKey.match(regex)) {
                            map[key].rank += 1;
                        }
                    }
                });
            });
        }

        if (musicStore.debug) {
            console.log("GENRE RESULT: ", JSON.stringify(map, null, 2));
        }

        // get the one with the highest rank (sort desc)
        if (Object.keys(map).length) {
            genreList = [];
            Object.keys(map).forEach(key => {
                genreList.push(map[key]);
            });
            genreList = genreList.sort((a: any, b: any) => b.rank - a.rank);
            // stop if the rank starts to descend and we haven't found anything
            let initialCount = genreList[0].rank;
            for (let i = 0; i < genreList.length; i++) {
                const obj: any = genreList[i];
                if (spotifyGenres.includes(obj.genre)) {
                    selectedGenre = obj.genre;
                    break;
                }
                if (obj.rank < initialCount) {
                    break;
                }
            }

            // if nothing returned, return the 1st one
            if (!selectedGenre) {
                selectedGenre = genreList[0].genre;
            }
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
