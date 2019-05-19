import { MusicStore } from "./store";
import { PlayerName } from "./models";

const cp = require("child_process");

const musicStore = MusicStore.getInstance();

export const SPOTIFY_NAME = "Spotify";
export const ITUNES_NAME = "iTunes";

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
        if (resp && resp.statusText === "OK") {
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

    extractAristFromSpotifyTrack(track: any) {
        if (!track) {
            return;
        }

        if (track["artists"]) {
            const len = track["artists"].length;
            let artistNames = [];
            for (let y = 0; y < len; y++) {
                const artist = track["artists"][y];
                artistNames.push(artist.name);
            }
            track["artist"] = artistNames.join(", ");
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
}
