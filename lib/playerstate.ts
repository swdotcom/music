import { MusicUtil } from "./util";
import { MusicController } from "./controller";
import { MusicStore } from "./store";
import { MusicClient } from "./client";
import {
    PlayerDevice,
    Track,
    PlayerType,
    TrackStatus,
    PlayerContext,
    PlayerName,
    SpotifyAudioFeature
} from "./models";

const musicCtr = MusicController.getInstance();
const musicStore = MusicStore.getInstance();
const musicClient = MusicClient.getInstance();
const musicUtil = new MusicUtil();

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

    async getCurrentlyRunningTrackState(): Promise<Track> {
        let trackState: Track = new Track();
        let spotifyDesktopRunning = await this.isSpotifyDesktopRunning();
        let itunesDesktopRunning = await this.isItunesDesktopRunning();
        if (spotifyDesktopRunning || itunesDesktopRunning) {
            trackState = await this.getDesktopTrackState();
        } else if (await this.isSpotifyWebRunning()) {
            trackState = await this.getSpotifyWebCurrentTrack();
        }
        return trackState;
    }

    async isWindowsSpotifyRunning(): Promise<boolean> {
        /**
         * /tasklist /fi "imagename eq Spotify.exe" /fo list /v |find " - "
         * Window Title: Dexys Midnight Runners - Come On Eileen
         */
        let result = await musicUtil
            .execCmd(MusicController.WINDOWS_SPOTIFY_TRACK_FIND)
            .catch(e => {
                console.log(
                    "Error trying to identify if spotify is running on windows: ",
                    e.message
                );
                return null;
            });
        if (result && result.toLowerCase().includes("title")) {
            return true;
        }
        return false;
    }

    async isSpotifyDesktopRunning() {
        let isRunning = false;
        if (musicUtil.isMac()) {
            isRunning = await musicCtr.isMusicPlayerActive(
                PlayerName.SpotifyDesktop
            );
        } else if (musicUtil.isWindows()) {
            isRunning = await this.isWindowsSpotifyRunning();
        }
        // currently do not support linux desktop for spotify
        return isRunning;
    }

    async isItunesDesktopRunning() {
        let isRunning = false;
        if (musicUtil.isMac()) {
            isRunning = await musicCtr.isMusicPlayerActive(
                PlayerName.ItunesDesktop
            );
        }
        // currently do not supoport windows or linux desktop for itunes
        return isRunning;
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

    async getSpotifyAudioFeatures(
        ids: string[]
    ): Promise<SpotifyAudioFeature[]> {
        let audiofeatures: SpotifyAudioFeature[] = [];
        if (!ids || ids.length === 0) {
            return audiofeatures;
        }
        const qstr = `?ids=${ids.join(",")}`;
        const api = `/v1/audio-features${qstr}`;
        let response = await musicClient.spotifyApiGet(api);
        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }
        // response.data will have a listof audio_features if it's successful:
        if (response.data && response.data.audio_features) {
            /**
             * { "audio_features":
                [ { "danceability": 0.808,
                    "energy": 0.626,
                    "key": 7,
                    "loudness": -12.733,
                    "mode": 1,
                    "speechiness": 0.168,
                    "acousticness": 0.00187,
                    "instrumentalness": 0.159,
                    "liveness": 0.376,
                    "valence": 0.369,
                    "tempo": 123.99,
                    "type": "audio_features",
                    "id": "4JpKVNYnVcJ8tuMKjAj50A",
                    "uri": "spotify:track:4JpKVNYnVcJ8tuMKjAj50A",
                    "track_href": "https://api.spotify.com/v1/tracks/4JpKVNYnVcJ8tuMKjAj50A",
                    "analysis_url": "http://echonest-analysis.s3.amazonaws.com/TR/WhpYUARk1kNJ_qP0AdKGcDDFKOQTTgsOoINrqyPQjkUnbteuuBiyj_u94iFCSGzdxGiwqQ6d77f4QLL_8=/3/full.json?AWSAccessKeyId=AKIAJRDFEY23UEVW42BQ&Expires=1458063189&Signature=JRE8SDZStpNOdUsPN/PoS49FMtQ%3D",
                    "duration_ms": 535223,
                    "time_signature": 4
                    },
            */
            audiofeatures = response.data.audio_features;
        }
        return audiofeatures;
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
    async getSpotifyDevices(): Promise<PlayerDevice[]> {
        let devices: PlayerDevice[] = [];

        const api = "/v1/me/player/devices";
        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }
        if (response.data && response.data.devices) {
            devices = response.data.devices;
        }
        return devices;
    }

    async getDesktopTrackState(): Promise<Track> {
        let outgoingTrack;
        let spotifyTrack;
        let itunesTrack;
        if (musicUtil.isMac()) {
            const spotifyRunning = await musicCtr.isMusicPlayerActive(
                PlayerName.SpotifyDesktop
            );
            // spotify first
            if (spotifyRunning) {
                const state = await musicCtr.run(
                    PlayerName.SpotifyDesktop,
                    "state"
                );
                if (state) {
                    spotifyTrack = JSON.parse(state);
                }

                if (spotifyTrack) {
                    spotifyTrack.type = PlayerName.SpotifyDesktop;
                    spotifyTrack.playerType = PlayerType.MacSpotifyDesktop;
                }
            }

            // next itunes
            const itunesRunning = await musicCtr.isMusicPlayerActive(
                PlayerName.ItunesDesktop
            );
            if (itunesRunning) {
                const state = await musicCtr.run(
                    PlayerName.ItunesDesktop,
                    "state"
                );
                if (state) {
                    itunesTrack = JSON.parse(state);
                }

                if (itunesTrack) {
                    itunesTrack.type = PlayerName.ItunesDesktop;
                    itunesTrack.playerType = PlayerType.MacItunesDesktop;
                }
            }

            if (spotifyTrack && itunesTrack) {
                if (itunesTrack.state !== "playing") {
                    outgoingTrack = spotifyTrack;
                }
            } else if (spotifyTrack) {
                outgoingTrack = spotifyTrack;
            } else {
                outgoingTrack = itunesTrack;
            }
        } else if (musicUtil.isWindows()) {
            // supports only spotify for now
            const winSpotifyRunning = await this.isWindowsSpotifyRunning();
            if (winSpotifyRunning) {
                outgoingTrack = await this.getWindowsSpotifyTrackInfo();
                if (outgoingTrack) {
                    outgoingTrack.type = PlayerName.SpotifyDesktop;
                    outgoingTrack.playerType = PlayerType.MacSpotifyDesktop;
                }
            }
        }

        // make sure it's not an advertisement
        if (outgoingTrack && !musicUtil.isEmptyObj(outgoingTrack)) {
            // "artist":"","album":"","id":"spotify:ad:000000012c603a6600000020316a17a1"
            if (
                outgoingTrack.type === PlayerType.MacSpotifyDesktop &&
                outgoingTrack.id.includes("spotify:ad:")
            ) {
                // it's a spotify ad
                outgoingTrack.status = TrackStatus.Advertisement;
            } else if (!outgoingTrack.artist && !outgoingTrack.album) {
                // not enough info to send
                outgoingTrack.status = TrackStatus.NotAssigned;
            }
        }

        // include common attributes
        if (
            outgoingTrack &&
            !musicUtil.isEmptyObj(outgoingTrack) &&
            outgoingTrack.duration
        ) {
            // create the attributes
            outgoingTrack["duration_ms"] = outgoingTrack.duration;
        }

        return outgoingTrack;
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
            .catch(e => {
                console.log(
                    "Error trying to identify if spotify is running on windows: ",
                    e.message
                );
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

    async getSpotifyWebCurrentTrack(): Promise<Track> {
        let trackState: Track = new Track();

        let api = "/v1/me/player/currently-playing";
        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (response && response.data && response.data.item) {
            let track: Track = response.data.item;
            // override "type" with "spotify"
            track.type = "spotify";
            if (track.duration_ms) {
                track.duration = track.duration_ms;
            }
            musicUtil.extractAristFromSpotifyTrack(track);

            trackState = track;
            trackState.playerType = PlayerType.WebSpotify;

            return trackState;
        }
        return trackState;
    }

    async getSpotifyWebPlayerState(): Promise<PlayerContext> {
        let playerContext: PlayerContext = new PlayerContext();
        let api = "/v1/me/player";
        let response = await musicClient.spotifyApiGet(api);
        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (response && response.data && response.data.item) {
            // override "type" with "spotify"
            response.data.item["type"] = "spotify";
            musicUtil.extractAristFromSpotifyTrack(response.data.item);
            playerContext = response.data;
        }
        return playerContext;
    }

    launchWebPlayer(options: any) {
        if (options.album) {
            return musicUtil.launchWebUrl(
                `https://open.spotify.com/album/${options.album}`
            );
        } else if (options.track) {
            return musicUtil.launchWebUrl(
                `https://open.spotify.com/track/${options.track}`
            );
        }
        return musicUtil.launchWebUrl("https://open.spotify.com/browse");
    }
}
