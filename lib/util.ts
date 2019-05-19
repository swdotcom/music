const cp = require("child_process");

export const SPOTIFY_NAME = "Spotify";
export const ITUNES_NAME = "iTunes";

export function isLinux() {
    return isWindows() || isMac() ? false : true;
}

// process.platform return the following...
//   -> 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
export function isWindows() {
    return process.platform.indexOf("win32") !== -1;
}

export function isMac() {
    return process.platform.indexOf("darwin") !== -1;
}

export function isEmptyObj(obj: any) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function isResponseOk(resp: any) {
    if (resp && resp.statusText === "OK") {
        return true;
    }
    return false;
}

export function isBooleanString(val: string) {
    if (
        (val && val.toLowerCase() === "true") ||
        val.toLowerCase() === "false"
    ) {
        return true;
    }
    return false;
}

export async function execCmd(cmd: string, projectDir: any = null) {
    let result: any = null;
    try {
        let opts =
            projectDir !== undefined && projectDir !== null
                ? { cwd: projectDir }
                : {};
        result = await execPromise(cmd, opts);
    } catch (e) {
        result = { error: e.message };
    }
    return result;
}

async function execPromise(command: string, opts: {}) {
    return new Promise((resolve, reject) => {
        cp.exec(command, opts, (error: any, stdout: string, stderr: any) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

// Sleep for the designated milliseconds.
// It should not be used in lib but only in the test.
// It has a max of 5 seconds as this is resource intensive
export function sleep(delayInMillis: number) {
    delayInMillis = Math.min(delayInMillis, 5000);
    var start = new Date().getTime();
    while (new Date().getTime() < start + delayInMillis);
}

export function getPlayerName(player: string) {
    if (!player || player.trim().length === 0) {
        player = "Spotify";
        return player;
    }
    player = player.trim().toLowerCase();
    if (player === "itunes") {
        return ITUNES_NAME;
    }
    return SPOTIFY_NAME;
}

export function formatString(source: string, params: any) {
    let formatted = source;
    if (params && params.length > 0) {
        for (let i = 0; i < params.length; i++) {
            let regexp = new RegExp("\\{" + i + "\\}", "gi");
            formatted = formatted.replace(regexp, params[i]);
        }
    }
    return formatted;
}

export function extractAristFromSpotifyTrack(track: any) {
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

export async function launchWebUrl(url: string): Promise<any> {
    let open = "open";
    let args = [url];
    if (isWindows()) {
        open = "cmd";
        // adds the following args to the beginning of the array
        args.unshift("/c", "start", '""');
    } else if (!isMac()) {
        open = "xdg-open";
    }

    args.unshift(open);
    const cmd = args.join(" ");

    execCmd(cmd);
}
