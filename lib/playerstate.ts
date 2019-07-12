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
    Artist
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

    async getSpotifyTrackById(
        id: string,
        includeArtistData: boolean = false
    ): Promise<Track> {
        id = musicUtil.createSpotifyIdFromUri(id);
        let track: Track;
        let api = `/v1/tracks/${id}`;

        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (response && response.data) {
            track = this.copySpotifyTrackToCodyTrack(response.data);

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
                }
            }
        } else {
            track = new Track();
        }

        return track;
    }

    async getSpotifyArtistById(id: string): Promise<Artist> {
        let artist: Artist;

        id = musicUtil.createSpotifyIdFromUri(id);
        let api = `/v1/artists/${id}`;

        let response = await musicClient.spotifyApiGet(api);

        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        if (response && response.data) {
            const artistData = response.data;
            // delete external_urls
            delete artistData.external_urls;
            artist = artistData;
        } else {
            artist = new Artist();
        }

        return artist;
    }

    async getSpotifyWebCurrentTrack(): Promise<Track> {
        let track: Track;

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
            track = this.copySpotifyTrackToCodyTrack(response.data.item);
        } else {
            track = new Track();
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

    async getSpotifyRecentlyPlayedTracks(limit: number): Promise<Track[]> {
        let api = "/v1/me/player/recently-played";
        if (limit) {
            api += `?limit=${limit}`;
        }
        let response = await musicClient.spotifyApiGet(api);
        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiGet(api);
        }

        let tracks: Track[] = [];
        if (response && response.data && response.data.items) {
            for (let i = 0; i < response.data.items.length; i++) {
                let spotifyTrack = response.data.items[i].track;
                const track: Track = this.copySpotifyTrackToCodyTrack(
                    spotifyTrack
                );
                tracks.push(track);
            }
        }

        return tracks;
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
            response.data.item["playerType"] = PlayerType.WebSpotify;
            musicUtil.extractAristFromSpotifyTrack(response.data.item);
            playerContext = response.data;
        }
        return playerContext;
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
        return musicUtil.launchWebUrl("https://open.spotify.com/browse");
    }

    copySpotifyTrackToCodyTrack(spotifyTrack: any): Track {
        let track: Track;
        if (spotifyTrack) {
            // delete some attributes that are currently not needed
            if (spotifyTrack.album) {
                delete spotifyTrack.album.available_markets;
                delete spotifyTrack.album.external_urls;
            }
            if (spotifyTrack.available_markets) {
                delete spotifyTrack.available_markets;
            }

            if (spotifyTrack.external_urls) {
                delete spotifyTrack.external_urls;
            }

            if (spotifyTrack.external_ids) {
                delete spotifyTrack.external_ids;
            }

            // pull out the artist info into a more readable set of attributes
            musicUtil.extractAristFromSpotifyTrack(spotifyTrack);

            track = spotifyTrack;

            if (spotifyTrack.duration_ms) {
                track.duration = spotifyTrack.duration_ms;
            }
        } else {
            track = new Track();
        }

        track.type = "spotify";
        track.playerType = PlayerType.WebSpotify;

        return track;
    }
}
