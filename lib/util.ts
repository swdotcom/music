import { exec } from "child_process";

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
        exec(command, opts, (error: any, stdout: string, stderr: any) => {
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
        for (var i = 0; i < params.length; i++) {
            var regexp = new RegExp("\\{" + i + "\\}", "gi");
            formatted = formatted.replace(regexp, params[i]);
        }
    }
    return formatted;
}
