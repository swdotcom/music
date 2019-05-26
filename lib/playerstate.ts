import { MusicUtil } from "./util";
import { MusicController } from "./controller";
import { MusicStore } from "./store";
import { MusicClient } from "./client";
import {
    PlayerDevice,
    Track,
    PlayerType,
    PlayerContext,
    TrackStatus
} from "./models";

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
        let track: Track = new Track();

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
            track = response.data.item;
            // override "type" with "spotify"
            track.type = "spotify";
            if (track.duration_ms) {
                track.duration = track.duration_ms;
            }
            musicUtil.extractAristFromSpotifyTrack(track);

            track.playerType = PlayerType.WebSpotify;
        }

        // initialize it with not assigned
        if (track) {
            track["state"] = TrackStatus.NotAssigned;
        }
        if (track && track.uri) {
            if (track.uri.includes("spotify:ad:")) {
                track.state = TrackStatus.Advertisement;
            } else {
                let context: PlayerContext = await this.getSpotifyPlayerContext();
                // is_playing
                if (context && context.is_playing) {
                    track["state"] = TrackStatus.Playing;
                } else {
                    track["state"] = TrackStatus.Paused;
                }
            }
        }

        return track;
    }

    async getSpotifyPlayerContext(): Promise<PlayerContext> {
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
        if (options.album_id) {
            return musicUtil.launchWebUrl(
                `https://open.spotify.com/album/${options.album_id}`
            );
        } else if (options.track_id) {
            return musicUtil.launchWebUrl(
                `https://open.spotify.com/track/${options.track_id}`
            );
        } else if (options.playlist_id) {
            return musicUtil.launchWebUrl(
                `https://open.spotify.com/playlist/${options.playlist_id}`
            );
        }
        return musicUtil.launchWebUrl("https://open.spotify.com/browse");
    }
}
