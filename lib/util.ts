import { MusicStore } from "./store";
import {
    PlayerName,
    Track,
    TrackStatus,
    PlayerType,
    CodyResponse
} from "./models";

const cp = require("child_process");

const musicStore = MusicStore.getInstance();

export class MusicUtil {
    credentialByKey(key: string): any {
        return musicStore.credentialByKey(key);
    }

    isLinux() {
        return this.isWindows() || this.isMac() ? false : true;
    }

    // process.platform return the following...
    //   -> 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
    isWindows() {
        return process.platform.indexOf("win32") !== -1;
    }

    isMac() {
        return process.platform.indexOf("darwin") !== -1;
    }

    isEmptyObj(obj: any) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    isResponseOk(resp: any) {
        if (resp && resp.status === 200) {
            return true;
        }
        return false;
    }

    isItemsResponseOk(codyResp: CodyResponse) {
        if (
            codyResp &&
            codyResp.status === 200 &&
            codyResp.data &&
            codyResp.data.items
        ) {
            return true;
        }
        return false;
    }

    isResponseOkWithData(resp: any) {
        if (resp && resp.status === 200 && resp.data) {
            return true;
        }
        return false;
    }

    isBooleanString(val: string) {
        if (
            (val && val.toLowerCase() === "true") ||
            val.toLowerCase() === "false"
        ) {
            return true;
        }
        return false;
    }

    async execCmd(cmd: string, projectDir: any = null) {
        let result: any = null;
        try {
            let opts =
                projectDir !== undefined && projectDir !== null
                    ? { cwd: projectDir }
                    : {};
            result = await this.execPromise(cmd, opts);
        } catch (e) {
            result = { error: e.message };
        }
        return result;
    }

    async execPromise(command: string, opts: {}) {
        return new Promise((resolve, reject) => {
            cp.exec(
                command,
                opts,
                (error: any, stdout: string, stderr: any) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(stdout.trim());
                }
            );
        });
    }

    // Sleep for the designated milliseconds.
    // It should not be used in lib but only in the test.
    // It has a max of 5 seconds as this is resource intensive
    sleep(delayInMillis: number) {
        delayInMillis = Math.min(delayInMillis, 5000);
        var start = new Date().getTime();
        while (new Date().getTime() < start + delayInMillis);
    }

    getPlayerName(player: string) {
        if (!player || player.trim().length === 0) {
            return PlayerName.SpotifyDesktop;
        }
        player = player.trim().toLowerCase();
        if (player === "itunes") {
            return PlayerName.ItunesDesktop;
        } else if (player === "spotify-web") {
            return PlayerName.SpotifyWeb;
        }
        return PlayerName.SpotifyDesktop;
    }

    formatString(source: string, params: any) {
        let formatted = source;
        if (params && params.length > 0) {
            for (let i = 0; i < params.length; i++) {
                let regexp = new RegExp("\\{" + i + "\\}", "gi");
                formatted = formatted.replace(regexp, params[i]);
            }
        }
        return formatted;
    }

    isTrackRunning(track: Track) {
        if (!track || !track.id) {
            return false;
        }
        if (
            track.state === TrackStatus.Paused ||
            track.state === TrackStatus.Playing
        ) {
            return true;
        }
        return false;
    }

    isTrackPlaying(track: Track) {
        if (!track || !track.id) {
            return false;
        }
        if (track.state === TrackStatus.Playing) {
            return true;
        }
        return false;
    }

    createPlaylistUriFromPlaylistId(playlist_id: string) {
        if (!playlist_id.includes("spotify:playlist:")) {
            playlist_id = `spotify:playlist:${playlist_id}`;
        }
        return playlist_id;
    }

    createTrackIdsFromUris(uris: string[]) {
        let trackIds = [];
        for (let i = 0; i < uris.length; i++) {
            trackIds.push(this.createSpotifyIdFromUri(uris[i]));
        }

        return trackIds;
    }

    createUriFromTrackId(track_id: string) {
        if (track_id && !track_id.includes("spotify:track:")) {
            track_id = `spotify:track:${track_id}`;
        }

        return track_id;
    }

    createUrisFromTrackIds(track_ids: string[], useUriObj: boolean = false) {
        let tracks = [];

        for (let i = 0; i < track_ids.length; i++) {
            let uri = track_ids[i];
            if (!uri || uri.length === 0) {
                continue;
            }
            uri = this.createUriFromTrackId(uri);

            if (useUriObj) {
                const urlObj = {
                    uri
                };
                tracks.push(urlObj);
            } else {
                tracks.push(uri);
            }
        }

        return tracks;
    }

    createSpotifyUserUriFromId(id: string) {
        if (id && !id.includes("spotify:user:")) {
            id = `spotify:user:${id}`;
        }
        return id;
    }

    createSpotifyIdFromUri(uri: string) {
        if (uri && uri.indexOf("spotify:") === 0) {
            return uri.substring(uri.lastIndexOf(":") + 1);
        }
        return uri;
    }

    extractAristFromSpotifyTrack(track: any) {
        if (!track) {
            return;
        }

        if (track["artists"]) {
            const len = track["artists"].length;
            let artistNames = [];
            let artists = [];
            for (let y = 0; y < len; y++) {
                const artist = track["artists"][y];
                artistNames.push(artist.name);
                artists.push({
                    name: artist.name,
                    uri: artist.uri,
                    id: artist.id
                });
            }
            delete track.artists;
            track.artists = artists;
            track["artist"] = artistNames.join(", ");
            track["artist_names"] = artistNames;
        }
    }

    launchWebUrl(url: string): Promise<any> {
        let open = "open";
        let args = [url];
        if (this.isWindows()) {
            open = "cmd";
            // adds the following args to the beginning of the array
            args.unshift("/c", "start", '""');
        } else if (!this.isMac()) {
            open = "xdg-open";
        }

        args.unshift(open);
        const cmd = args.join(" ");

        return this.execCmd(cmd);
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
            this.extractAristFromSpotifyTrack(spotifyTrack);

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

    buildQueryString(obj: any, encodeVals: boolean = true) {
        let params = [];
        if (obj) {
            let keys = Object.keys(obj);
            if (keys) {
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    let val = obj[key];
                    if (val && val !== undefined) {
                        if (encodeVals) {
                            let encodedVal = encodeURIComponent(val);
                            params.push(`${key}=${encodedVal}`);
                        } else {
                            params.push(`${key}=${val}`);
                        }
                    }
                }
            }
        }
        if (params.length > 0) {
            return "?" + params.join("&");
        } else {
            return "";
        }
    }
}
