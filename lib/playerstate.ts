import {
    execCmd,
    isMac,
    isWindows,
    isEmptyObj,
    isResponseOk,
    extractAristFromSpotifyTrack,
    launchWebUrl
} from "./util";
import { MusicController } from "./controller";
import { MusicStore } from "./store";
import { MusicClient } from "./client";

const musicCtr = MusicController.getInstance();
const musicStore = MusicStore.getInstance();
const musicClient = MusicClient.getInstance();

export enum TrackType {
    MacItunesDesktop = 1,
    MacSpotifyDesktop = 2,
    WindowsSpotifyDesktop = 3,
    WebSpotify = 4,
    NotAssigned = 5,
    Advertisement = 6
}

export class TrackState {
    /**
     * type of the player
     */
    type: TrackType = TrackType.NotAssigned;
    /**
     * The track data
     */
    track: Track = new Track();
}

// {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
export class Track {
    artist: string = "";
    album: string = "";
    genre: string = "";
    disc_number: number = 0;
    duration: number = 0;
    duration_ms: number = 0;
    played_count: number = 0;
    track_number: number = 0;
    popularity: number = 0;
    id: string = "";
    uri: string = "";
    name: string = "";
    state: string = "";
    explicit: boolean = false;
    // href:"https://api.spotify.com/v1/playlists/0mwG8hCL4scWi8Nkt7jyoV/tracks"
    href: string = "";
    // "spotify", "itunes"
    type: string = "";
}

export class PlayerDevice {
    id: string = "";
    is_active: string = "";
    is_restricted: boolean = false;
    name: string = "";
    type: string = "";
    volume_percent: number = 0;
}

export class PlayerContext {
    timestamp: number = 0;
    device: PlayerDevice = new PlayerDevice();
    progress_ms: string = "";
    is_playing: boolean = false;
    currently_playing_type: string = "";
    actions: any = null;
    item: any = null;
    shuffle_state: boolean = false;
    repeat_state: string = "";
    context: any = null;
}

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

    async getCurrentlyRunningTrackState(): Promise<TrackState> {
        let trackState: TrackState = new TrackState();
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
        let result = await execCmd(
            MusicController.WINDOWS_SPOTIFY_TRACK_FIND
        ).catch(e => {
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
        if (isMac()) {
            isRunning = await musicCtr.isMusicPlayerActive("Spotify");
        } else if (isWindows()) {
            isRunning = await this.isWindowsSpotifyRunning();
        }
        // currently do not support linux desktop for spotify
        return isRunning;
    }

    async isItunesDesktopRunning() {
        let isRunning = false;
        if (isMac()) {
            isRunning = await musicCtr.isMusicPlayerActive("iTunes");
        }
        // currently do not supoport windows or linux desktop for itunes
        return isRunning;
    }

    async isSpotifyWebRunning(): Promise<boolean> {
        let accessToken = musicStore.spotifyAccessToken;
        if (accessToken) {
            let spotifyDevices: PlayerDevice[] = await this.spotifyWebUsersDevices();
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
    async spotifyWebUsersDevices() {
        let devices: PlayerDevice[] = [];

        let api = "/v1/me/player/devices";
        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }
        if (response && response.data && response.data.devices) {
            devices = response.data.devices;
        }
        return devices;
    }

    async getDesktopTrackState(): Promise<TrackState> {
        let trackState: TrackState = new TrackState();
        let playingTrack: Track = new Track();
        let pausedTrack: Track = new Track();
        let pausedType: TrackType = TrackType.NotAssigned;
        if (isMac()) {
            const spotifyRunning = await musicCtr.isMusicPlayerActive(
                "Spotify"
            );
            // spotify first
            if (spotifyRunning) {
                const state = await musicCtr.run("Spotify", "state");
                if (state) {
                    playingTrack = JSON.parse(state);
                }

                if (playingTrack) {
                    playingTrack.type = "spotify";
                }
                if (playingTrack && playingTrack.state === "playing") {
                    trackState = {
                        type: TrackType.MacSpotifyDesktop,
                        track: playingTrack
                    };
                } else if (playingTrack) {
                    // save this one if itunes isn't running
                    pausedTrack = playingTrack;
                    pausedType = TrackType.MacSpotifyDesktop;
                }
            }

            // next itunes
            const itunesRunning = await musicCtr.isMusicPlayerActive("iTunes");
            if (itunesRunning) {
                const state = await musicCtr.run("iTunes", "state");
                if (state) {
                    playingTrack = JSON.parse(state);
                }

                if (playingTrack) {
                    playingTrack.type = "itunes";
                }
                if (playingTrack && playingTrack.state === "playing") {
                    trackState = {
                        type: TrackType.MacItunesDesktop,
                        track: playingTrack
                    };
                } else if (!pausedTrack && playingTrack) {
                    pausedTrack = playingTrack;
                    pausedType = TrackType.MacItunesDesktop;
                }
            }

            if (pausedTrack) {
                trackState = { type: pausedType, track: pausedTrack };
            }
        } else if (isWindows()) {
            // supports only spotify for now
            const winSpotifyRunning = await this.isWindowsSpotifyRunning();
            if (winSpotifyRunning) {
                playingTrack = await this.getWindowsSpotifyTrackInfo();
                if (playingTrack) {
                    playingTrack.type = "spotify";
                    trackState = {
                        type: TrackType.MacSpotifyDesktop,
                        track: playingTrack
                    };
                }
            }
        }

        // make sure it's not an advertisement
        if (trackState && !isEmptyObj(trackState.track)) {
            // "artist":"","album":"","id":"spotify:ad:000000012c603a6600000020316a17a1"
            if (
                trackState.type === TrackType.MacSpotifyDesktop &&
                trackState.track.id.includes("spotify:ad:")
            ) {
                // it's a spotify ad
                trackState.type = TrackType.Advertisement;
            } else if (!trackState.track.artist && !trackState.track.album) {
                // not enough info to send
                trackState.type = TrackType.NotAssigned;
            }
        }

        // include common attributes
        if (
            trackState &&
            !isEmptyObj(trackState.track) &&
            trackState.track.duration
        ) {
            // create the attributes
            trackState.track["duration_ms"] = trackState.track.duration;
        }

        return trackState;
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
        let songInfo = await execCmd(
            MusicController.WINDOWS_SPOTIFY_TRACK_FIND
        ).catch(e => {
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
            isResponseOk(resp) &&
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

    async getSpotifyWebCurrentTrack(): Promise<TrackState> {
        let trackState: TrackState = new TrackState();

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
            extractAristFromSpotifyTrack(track);

            trackState.track = track;
            trackState.type = TrackType.WebSpotify;

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
            extractAristFromSpotifyTrack(response.data.item);
            playerContext = response.data;
        }
        return playerContext;
    }

    launchSpotifyWebPlayer() {
        return launchWebUrl("https://open.spotify.com/browse/featured");
    }
}
