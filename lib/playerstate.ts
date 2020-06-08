import { MusicUtil } from "./util";
import { MusicController } from "./controller";
import { MusicStore } from "./store";
import { MusicClient } from "./client";
import {
    PlayerDevice,
    Track,
    PlayerType,
    PlayerContext,
    TrackStatus,
    Artist,
    PlayerName,
    CodyResponse,
} from "./models";
import { CacheManager } from "./cache";
import { AudioStat } from "./audiostat";

const moment = require("moment-timezone");
const musicStore = MusicStore.getInstance();
const musicClient = MusicClient.getInstance();
const audioStat = AudioStat.getInstance();
const musicController = MusicController.getInstance();
const musicUtil = new MusicUtil();
const cacheMgr = CacheManager.getInstance();

export const SPOTIFY_LIKED_SONGS_PLAYLIST_NAME = "Liked Songs";

export class MusicPlayerState {
    private static instance: MusicPlayerState;
    private constructor() {
        //
    }
    static getInstance() {
        if (!MusicPlayerState.instance) {
            MusicPlayerState.instance = new MusicPlayerState();
        }
        return MusicPlayerState.instance;
    }

    async isWindowsSpotifyRunning(): Promise<boolean> {
        /**
         * /tasklist /fi "imagename eq Spotify.exe" /fo list /v |find " - "
         * Window Title: Dexys Midnight Runners - Come On Eileen
         */
        let result = await musicUtil
            .execCmd(MusicController.WINDOWS_SPOTIFY_TRACK_FIND)
            .catch((e) => {
                // console.log(
                //     "Error trying to identify if spotify is running on windows: ",
                //     e.message
                // );
                return null;
            });
        if (result && result.toLowerCase().includes("title")) {
            return true;
        }
        return false;
    }

    async isSpotifyWebRunning(): Promise<boolean> {
        let accessToken = musicStore.spotifyAccessToken;
        if (accessToken) {
            let spotifyDevices: PlayerDevice[] = await this.getSpotifyDevices();
            if (spotifyDevices.length > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * returns...
     * {
        "devices" : [ {
            "id" : "5fbb3ba6aa454b5534c4ba43a8c7e8e45a63ad0e",
            "is_active" : false,
            "is_private_session": true,
            "is_restricted" : false,
            "name" : "My fridge",
            "type" : "Computer",
            "volume_percent" : 100
        } ]
        }
     */
    async getSpotifyDevices(
        clearCache: boolean = false
    ): Promise<PlayerDevice[]> {
        if (clearCache) {
            cacheMgr.set("spotify-devices", null);
        }
        const accessToken = musicStore.spotifyAccessToken;
        if (!accessToken) {
            return [];
        }
        let devices = cacheMgr.get("spotify-devices");
        if (devices && devices.length) {
            return devices;
        }
        const api = "/v1/me/player/devices";
        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }
        devices = [];
        if (response.data && response.data.devices) {
            devices = response.data.devices;
        }

        if (devices && devices.length) {
            cacheMgr.set("spotify-devices", devices);
        }

        return devices || [];
    }

    /**
     * returns i.e.
     * track = {
            artist: 'Bob Dylan',
            album: 'Highway 61 Revisited',
            disc_number: 1,
            duration: 370,
            played count: 0,
            track_number: 1,
            starred: false,
            popularity: 71,
            id: 'spotify:track:3AhXZa8sUQht0UEdBJgpGc',
            name: 'Like A Rolling Stone',
            album_artist: 'Bob Dylan',
            artwork_url: 'http://images.spotify.com/image/e3d720410b4a0770c1fc84bc8eb0f0b76758a358',
            spotify_url: 'spotify:track:3AhXZa8sUQht0UEdBJgpGc' }
        }
    */
    async getWindowsSpotifyTrackInfo() {
        let windowTitleStr = "Window Title:";
        // get the artist - song name from the command result, then get the rest of the info from spotify
        let songInfo = await musicUtil
            .execCmd(MusicController.WINDOWS_SPOTIFY_TRACK_FIND)
            .catch((e) => {
                // console.log(
                //     "Error trying to identify if spotify is running on windows: ",
                //     e.message
                // );
                return null;
            });
        if (!songInfo || !songInfo.includes(windowTitleStr)) {
            // it must have paused, or an ad, or it was closed
            return null;
        }
        // fetch it from spotify
        // result will be something like: "Window Title: Dexys Midnight Runners - Come On Eileen"
        songInfo = songInfo.substring(windowTitleStr.length);
        let artistSong = songInfo.split("-");
        let artist = artistSong[0].trim();
        let song = artistSong[1].trim();

        const qParam = encodeURIComponent(`artist:${artist} track:${song}`);
        const qryStr = `q=${qParam}&type=track&limit=2&offset=0`;
        let api = `/v1/search?${qryStr}`;
        let resp = await musicClient.spotifyApiGet(api);
        let trackInfo = null;
        if (
            musicUtil.isResponseOk(resp) &&
            resp.data &&
            resp.data.tracks &&
            resp.data.tracks.items
        ) {
            trackInfo = resp.data.tracks.items[0];
            // set the other attributes like start and type
            trackInfo["type"] = "spotify";
            trackInfo["state"] = "playing";
            trackInfo["start"] = 0;
            trackInfo["end"] = 0;
            trackInfo["genre"] = "";
        }

        return trackInfo;
    }

    async getSpotifyTracks(
        ids: string[],
        includeArtistData: boolean = false,
        includeAudioFeaturesData: boolean = false,
        includeGenre: boolean = false
    ): Promise<Track[]> {
        const finalIds: string[] = [];
        ids.forEach((id) => {
            id = musicUtil.createSpotifyIdFromUri(id);
            if (id) {
                finalIds.push(id);
            }
        });
        const tracksToReturn: Track[] = [];
        const api = `/v1/tracks`;
        const qsOptions = { ids: finalIds.join(",") };

        let response = await musicClient.spotifyApiGet(api, qsOptions);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api, qsOptions);
        }

        if (response && response.status === 200 && response.data) {
            let artistIdMap: any = {};
            const tracks: any[] = response.data.tracks || [];
            for (let x = 0; x < tracks.length; x++) {
                const trackData = tracks[x];
                const track: Track = musicUtil.copySpotifyTrackToCodyTrack(
                    trackData
                );
                track.progress_ms = response.data.progress_ms
                    ? response.data.progress_ms
                    : 0;

                if (includeArtistData) {
                    for (let i = 0; i < track.artists.length; i++) {
                        const artist: any = track.artists[i];
                        artistIdMap[artist.id] = artist.id;
                    }
                }

                tracksToReturn.push(track);
            }

            if (includeArtistData) {
                let artistIds = Object.keys(artistIdMap).map((key) => {
                    return key;
                });

                // fetch the artists all at once or in batches
                let artists: any[] = [];
                if (artistIds) {
                    // spotify's limit is 50, so batch if it's greater than 50
                    if (artistIds.length > 50) {
                        let hasData = artistIds.length ? true : false;
                        while (hasData) {
                            // keep removing from the artistIds
                            let splicedArtistIds = artistIds.splice(0, 50);

                            const batchedArtists = await this.getSpotifyArtistsByIds(
                                splicedArtistIds
                            );
                            if (batchedArtists && batchedArtists.length) {
                                artists.push(...batchedArtists);
                            }
                            hasData = artistIds.length ? true : false;
                            if (!hasData) {
                                break;
                            }
                        }
                    } else {
                        artists = await this.getSpotifyArtistsByIds(artistIds);
                    }
                }

                if (artists && artists.length > 0) {
                    // go through the tracks and update the artist with the fully populated one
                    for (let t of tracksToReturn) {
                        const trackArtistIds: string[] = t.artists.map(
                            (artist: any) => {
                                return artist.id;
                            }
                        );
                        const artistsForTrack: any[] = artists.filter(
                            (n: any) => trackArtistIds.includes(n.id)
                        );
                        if (artistsForTrack && artistsForTrack.length) {
                            // replace the artists
                            t.artists = artistsForTrack;
                        }

                        if (!t.genre && includeGenre) {
                            // first check if we have an artist in artists
                            let genre = "";
                            if (t.artists && t.artists.length) {
                                for (let artistCandidate of t.artists) {
                                    if (
                                        artistCandidate.genres &&
                                        artistCandidate.genres.length
                                    ) {
                                        try {
                                            genre = musicClient.getHighestFrequencySpotifyGenre(
                                                artistCandidate.genres
                                            );
                                        } catch (e) {
                                            //
                                        }
                                        break;
                                    }
                                }
                            }
                            if (genre) {
                                t.genre = genre;
                            }
                        }
                    }
                }
            }

            // get the features
            if (includeAudioFeaturesData) {
                const spotifyAudioFeatures = await audioStat
                    .getSpotifyAudioFeatures(ids)
                    .catch((e) => {
                        return null;
                    });
                if (spotifyAudioFeatures && spotifyAudioFeatures.length > 0) {
                    // "id": "4JpKVNYnVcJ8tuMKjAj50A",
                    // "uri": "spotify:track:4JpKVNYnVcJ8tuMKjAj50A",
                    // track.features = spotifyAudioFeatures[0];
                    for (let i = 0; i < spotifyAudioFeatures.length; i++) {
                        const uri: string = spotifyAudioFeatures[i].uri;
                        const foundTrack = tracksToReturn.find(
                            (t: Track) => t.uri === uri
                        );
                        if (foundTrack) {
                            foundTrack.features = spotifyAudioFeatures[i];
                        }
                    }
                }
            }
        }

        return tracksToReturn;
    }

    async getSpotifyTrackById(
        id: string,
        includeArtistData: boolean = false,
        includeAudioFeaturesData: boolean = false,
        includeGenre: boolean = false
    ): Promise<Track> {
        id = musicUtil.createSpotifyIdFromUri(id);
        let track: Track;
        let api = `/v1/tracks/${id}`;

        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (response && response.status === 200 && response.data) {
            track = musicUtil.copySpotifyTrackToCodyTrack(response.data);
            track.progress_ms = response.data.progress_ms
                ? response.data.progress_ms
                : 0;

            // get the arist data
            if (includeArtistData && track.artists) {
                let artists: Artist[] = [];

                for (let i = 0; i < track.artists.length; i++) {
                    const artist = track.artists[i];
                    const artistData: Artist = await this.getSpotifyArtistById(
                        artist.id
                    );
                    artists.push(artistData);
                }
                if (artists.length > 0) {
                    track.artists = artists;
                } else {
                    track.artists = [];
                }
            }

            if (!track.genre && includeGenre) {
                // first check if we have an artist in artists
                // artists[0].genres[0]

                let genre = "";
                if (
                    track.artists &&
                    track.artists.length > 0 &&
                    track.artists[0].genres
                ) {
                    // make sure we use the highest frequency genre
                    genre = musicClient.getHighestFrequencySpotifyGenre(
                        track.artists[0].genres
                    );
                }
                if (!genre) {
                    // get the genre
                    genre = await musicController.getGenre(
                        track.artist,
                        track.name
                    );
                }
                if (genre) {
                    track.genre = genre;
                }
            }

            // get the features
            if (includeAudioFeaturesData) {
                const spotifyAudioFeatures = await audioStat.getSpotifyAudioFeatures(
                    [id]
                );
                if (spotifyAudioFeatures && spotifyAudioFeatures.length > 0) {
                    track.features = spotifyAudioFeatures[0];
                }
            }
        } else {
            track = new Track();
        }

        return track;
    }

    async getSpotifyArtistsByIds(ids: string[]): Promise<Artist[]> {
        let artists: Artist[] = [];

        ids = musicUtil.createSpotifyIdsFromUris(ids);

        // check the cache first

        let api = `/v1/artists`;
        const qParam = { ids };

        let response = await musicClient.spotifyApiGet(api, qParam);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api, qParam);
        }

        if (response && response.status === 200 && response.data) {
            artists = response.data.artists || [];
        }

        return artists;
    }

    async getSpotifyArtistById(id: string): Promise<Artist> {
        let artist: Artist = new Artist();

        id = musicUtil.createSpotifyIdFromUri(id);

        // check the cache first

        let api = `/v1/artists/${id}`;

        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (response && response.status === 200 && response.data) {
            const artistData = response.data;
            // delete external_urls
            delete artistData.external_urls;
            artist = artistData;
        }

        return artist;
    }

    async getSpotifyWebCurrentTrack(): Promise<Track> {
        let track: Track;

        let api = "/v1/me/player/currently-playing";
        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (
            response &&
            response.status === 200 &&
            response.data &&
            response.data.item
        ) {
            const data = response.data;
            track = musicUtil.copySpotifyTrackToCodyTrack(data.item);
            track.progress_ms = data.progress_ms ? data.progress_ms : 0;

            // set the actions ("actions": {"disallows": {"resuming": true}})
            track.actions = data.actions;

            // set whether this track is playing or not
            /**
             * data: {
                context:null
                currently_playing_type:"track"
                is_playing:true
                item:Object {album: Object, artists: Array(1), available_markets: Array(79), …}
                progress_ms:153583
                timestamp:1583797755729
            }
            */
            const isPlaying =
                data.is_playing !== undefined && data.is_playing !== null
                    ? data.is_playing
                    : false;
            if (track.uri && track.uri.includes("spotify:ad:")) {
                track.state = TrackStatus.Advertisement;
            } else {
                track.state = isPlaying
                    ? TrackStatus.Playing
                    : TrackStatus.Paused;
            }
        } else {
            track = new Track();
            track.state = TrackStatus.NotAssigned;
            track.httpStatus = response.status;
        }

        return track;
    }

    async getSpotifyRecentlyPlayedTracksBefore(
        limit: number = 50,
        before: number = 0
    ): Promise<CodyResponse> {
        return this.fetchSpotifyReentlyPlayedTracksData(limit, 0, before);
    }

    async getSpotifyRecentlyPlayedTracksAfter(
        limit: number = 50,
        after: number = 0
    ): Promise<CodyResponse> {
        return this.fetchSpotifyReentlyPlayedTracksData(limit, after, 0);
    }

    async getSpotifyRecentlyPlayedTracks(
        limit: number = 50,
        after: number = 0,
        before: number = 0
    ): Promise<Track[]> {
        const resp: CodyResponse = await this.fetchSpotifyReentlyPlayedTracksData(
            limit,
            after,
            before
        );
        if (resp && resp.data && resp.data.tracks) {
            return resp.data.tracks;
        }
        return [];
    }

    /**
     * Fetch the recently played tracks data
     * @param limit (max of 1000)
     * @param after
     * @param before
     */
    async fetchSpotifyReentlyPlayedTracksData(
        limit: number = 50,
        after: number = 0,
        before: number = 0
    ): Promise<CodyResponse> {
        let api = "/v1/me/player/recently-played";
        const qsOptions: any = {};

        // max # of tracks for pagination
        let trackLimit = limit;
        if (trackLimit <= 0 || trackLimit > 1000) {
            trackLimit = 1000;
        }

        // spotify api limit is 50
        let apiLimit = limit;
        if (apiLimit <= 0 || apiLimit > 50) {
            apiLimit = 50;
        }

        // set the spotify per api limit
        qsOptions["limit"] = apiLimit;

        if (after && after > 0) {
            qsOptions["after"] = after;
        } else if (before && before > 0) {
            qsOptions["before"] = before;
        }
        let resp: CodyResponse = await musicClient.spotifyApiGet(
            api,
            qsOptions
        );

        // check if the token needs to be refreshed
        if (resp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            resp = await musicClient.spotifyApiGet(api, qsOptions);
        }

        let tracks: Track[] = [];
        if (musicUtil.isItemsResponseOk(resp)) {
            resp.data.items.forEach((item: any) => {
                let spotifyTrack = item.track;
                const track: Track = musicUtil.copySpotifyTrackToCodyTrack(
                    spotifyTrack
                );
                track.played_at = item.played_at;
                track.played_at_utc_seconds = moment(item.played_at).unix();
                tracks.push(track);
            });

            let cursors = resp.data.cursors;
            if (cursors) {
                cursors.before = parseInt(cursors.before, 10);
                cursors.after = parseInt(cursors.after, 10);
            } else {
                cursors = {
                    before: 0,
                    after: 0,
                };
            }

            if (resp.data.next && tracks.length < trackLimit) {
                // continue fetching until we've reached the limit
                let reachedLimit = false;
                let nextApi = resp.data.next;
                while (!reachedLimit) {
                    let nextCursors = resp.data.cursors;
                    if (nextCursors && cursors) {
                        // update the before and after
                        const prevBefore = cursors.before;
                        const before = parseInt(nextCursors.before, 10);
                        if (before < prevBefore || prevBefore === 0) {
                            cursors.before = before;
                        }

                        const prevAfter = cursors.after;
                        const after = parseInt(nextCursors.after, 10);
                        if (after > prevAfter || prevAfter === 0) {
                            cursors.after = after;
                        }
                    }
                    if (!nextApi) {
                        reachedLimit = true;
                        break;
                    }

                    // get the next api
                    api = nextApi.substring(
                        nextApi.indexOf("/v1"),
                        nextApi.length
                    );
                    const nextResults = await musicClient.spotifyApiGet(api);
                    if (musicUtil.isItemsResponseOk(nextResults)) {
                        nextApi = nextResults.data.next;
                        if (nextResults.data.items.length > 0) {
                            nextResults.data.items.forEach((item: any) => {
                                let spotifyTrack = item.track;
                                const track: Track = musicUtil.copySpotifyTrackToCodyTrack(
                                    spotifyTrack
                                );
                                track.played_at = item.played_at;
                                track.played_at_utc_seconds = moment(
                                    item.played_at
                                ).unix();
                                tracks.push(track);
                            });
                        } else {
                            reachedLimit = true;
                        }
                    } else {
                        reachedLimit = true;
                    }

                    if (tracks.length >= trackLimit) {
                        reachedLimit = true;
                    }
                }
            }

            // update the cursors
            resp.data.cursors = cursors;
        }

        if (resp.data) {
            delete resp.data.items;
            delete resp.data.href;
            delete resp.data.next;
            delete resp.data.limit;
            // add tracks to the response
            resp.data["tracks"] = tracks;
        }

        return resp;
    }

    async getRecommendationsForTracks(
        seed_tracks: string[] = [],
        limit: number = 40,
        market: string = "",
        min_popularity: number = 20,
        target_popularity: number = 90,
        seed_genres: string[] = [],
        seed_artists: string[] = [],
        features: any = {}
    ) {
        let tracks: Track[] = [];

        // change the trackIds to non-uri ids
        seed_tracks = musicUtil.createTrackIdsFromUris(seed_tracks);
        // the create trackIds will create normal artist ids as well
        seed_artists = musicUtil.createTrackIdsFromUris(seed_artists);
        // it can only take up to 5, remove the rest
        if (seed_tracks.length > 5) {
            seed_tracks.length = 5;
        }
        if (seed_genres.length > 5) {
            seed_genres.length = 5;
        }
        if (seed_artists.length > 5) {
            seed_artists.length = 5;
        }
        const qsOptions: any = {
            limit,
            min_popularity,
            target_popularity,
        };
        if (seed_genres.length) {
            qsOptions["seed_genres"] = seed_genres.join(",");
        }
        if (seed_tracks.length) {
            qsOptions["seed_tracks"] = seed_tracks.join(",");
        }
        if (seed_artists.length) {
            qsOptions["seed_artists"] = seed_artists.join(",");
        }
        if (market) {
            qsOptions["market"] = market;
        }
        const featureKeys = Object.keys(features);
        if (featureKeys.length) {
            featureKeys.forEach((key) => {
                qsOptions[key] = features[key];
            });
        }
        const api = `/v1/recommendations`;

        // add to the api to prevent the querystring from escaping the comma

        let response = await musicClient.spotifyApiGet(api, qsOptions);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api, qsOptions);
        }

        if (musicUtil.isResponseOk(response)) {
            tracks = response.data.tracks;
        }

        return tracks;
    }

    async setMute(mute: boolean, device_id = ""): Promise<CodyResponse> {
        const api = `/v1/me/player/volume`;

        if (musicStore.prevVolumePercent === 0) {
            // get the previous volume
            const devices: PlayerDevice[] = await this.getSpotifyDevices();

            const playerContext: PlayerContext = await this.getSpotifyPlayerContext(
                false
            );

            if (playerContext && playerContext.device) {
                musicStore.prevVolumePercent =
                    playerContext.device.volume_percent;
            }
            if (playerContext.device.volume_percent === 0) {
                playerContext.device.volume_percent = 50;
            }
        }

        let qsOptions: any = {
            volume_percent: mute ? 0 : musicStore.prevVolumePercent,
        };
        if (device_id) {
            qsOptions["device_id"] = device_id;
        }
        let codyResp = await musicClient.spotifyApiPut(api, qsOptions, {});

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPut(api, qsOptions, {});
        }

        return codyResp;
    }

    async setShuffle(shuffle: boolean, device_id = ""): Promise<CodyResponse> {
        const api = `/v1/me/player/shuffle`;
        let qsOptions: any = {
            state: shuffle,
        };
        if (device_id) {
            qsOptions["device_id"] = device_id;
        }
        let codyResp = await musicClient.spotifyApiPut(api, qsOptions, {});

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPut(api, qsOptions, {});
        }

        return codyResp;
    }

    async setRepeatOff(device_id: string = ""): Promise<CodyResponse> {
        return await this.setRepeat("off", device_id);
    }

    async setTrackRepeat(device_id: string = ""): Promise<CodyResponse> {
        return await this.setRepeat("track", device_id);
    }

    async setPlaylistRepeat(device_id: string = ""): Promise<CodyResponse> {
        return await this.setRepeat("context", device_id);
    }

    async updateRepeatMode(
        setToOn: boolean,
        device_id: string = ""
    ): Promise<CodyResponse> {
        const state = setToOn ? "track" : "off";

        return await this.setRepeat(state, device_id);
    }

    async setRepeat(
        state: string,
        device_id: string = ""
    ): Promise<CodyResponse> {
        const api = `/v1/me/player/repeat`;
        let qsOptions: any = {
            state,
        };
        if (device_id) {
            qsOptions["device_id"] = device_id;
        }
        let codyResp = await musicClient.spotifyApiPut(api, qsOptions, {});

        // check if the token needs to be refreshed
        if (codyResp.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPut(api, qsOptions, {});
        }

        return codyResp;
    }

    async getSpotifyPlayerContext(clearCache: boolean): Promise<PlayerContext> {
        if (clearCache) {
            cacheMgr.set("player-context", null);
        }
        let playerContext: PlayerContext = cacheMgr.get("player-context");
        if (playerContext) {
            return playerContext;
        }

        playerContext = new PlayerContext();
        let api = "/v1/me/player";
        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.status === 401) {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (
            response &&
            response.status === 200 &&
            response.data &&
            response.data.item
        ) {
            // override "type" with "spotify"
            response.data.item["type"] = "spotify";
            response.data.item["playerType"] = PlayerType.WebSpotify;
            musicUtil.extractAristFromSpotifyTrack(response.data.item);
            playerContext = response.data;
            if (playerContext && playerContext.device) {
                // 15 second cache
                cacheMgr.set("player-context", playerContext, 15);
            }
        }
        return playerContext;
    }

    async launchAndPlaySpotifyTrack(
        trackId: string = "",
        playlistId: string = "",
        playerName: PlayerName = PlayerName.SpotifyWeb
    ) {
        // check if there's any spotify devices
        const spotifyDevices: PlayerDevice[] = await this.getSpotifyDevices();

        if (!spotifyDevices || spotifyDevices.length === 0) {
            // no spotify devices found, lets launch the web player with the track

            // launch it
            await this.launchWebPlayer(playerName);

            // now select it from within the playlist within 2 seconds
            await setTimeout(() => {
                this.playSpotifyTrackFromPlaylist(
                    trackId,
                    musicStore.spotifyUserId,
                    playlistId
                );
            }, 5000);
        } else {
            // a device is found, play using the device
            await this.playSpotifyTrackFromPlaylist(
                trackId,
                musicStore.spotifyUserId,
                playlistId
            );
        }
    }

    async playSpotifyTrackFromPlaylist(
        trackId: string,
        spotifyUserId: string,
        playlistId: string = ""
    ) {
        const spotifyUserUri = musicUtil.createSpotifyUserUriFromId(
            spotifyUserId
        );
        if (playlistId === SPOTIFY_LIKED_SONGS_PLAYLIST_NAME) {
            playlistId = "";
        }
        const spotifyDevices: PlayerDevice[] = await this.getSpotifyDevices();
        const deviceId = spotifyDevices.length > 0 ? spotifyDevices[0].id : "";
        let options: any = {};
        if (deviceId) {
            options["device_id"] = deviceId;
        }

        if (trackId) {
            options["track_ids"] = [trackId];
        } else {
            options["offset"] = { position: 0 };
        }
        if (playlistId) {
            const playlistUri = `${spotifyUserUri}:playlist:${playlistId}`;
            options["context_uri"] = playlistUri;
        }

        /**
         * to play a track without the play list id
         * curl -X "PUT" "https://api.spotify.com/v1/me/player/play?device_id=4f38ae14f61b3a2e4ed97d537a5cb3d09cf34ea1"
         * --data "{\"uris\":[\"spotify:track:2j5hsQvApottzvTn4pFJWF\"]}"
         */

        if (!playlistId) {
            // just play by track id
            await musicController.spotifyWebPlayTrack(trackId, deviceId);
        } else {
            // we have playlist id within the options, use that
            await musicController.spotifyWebPlayPlaylist(
                playlistId,
                trackId,
                deviceId
            );
        }
    }

    launchWebPlayer(options: any) {
        if (options.album_id) {
            const albumId = musicUtil.createSpotifyIdFromUri(options.album_id);
            return musicUtil.launchWebUrl(
                `https://open.spotify.com/album/${albumId}`
            );
        } else if (options.track_id) {
            const trackId = musicUtil.createSpotifyIdFromUri(options.track_id);
            return musicUtil.launchWebUrl(
                `https://open.spotify.com/track/${trackId}`
            );
        } else if (options.playlist_id) {
            const playlistId = musicUtil.createSpotifyIdFromUri(
                options.playlist_id
            );
            return musicUtil.launchWebUrl(
                `https://open.spotify.com/playlist/${playlistId}`
            );
        }
        return musicUtil.launchWebUrl("https://open.spotify.com");
    }

    updateSpotifyLoved(loved: boolean) {
        //
    }
}
