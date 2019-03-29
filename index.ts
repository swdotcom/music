const { exec } = require("child_process");

export async function isMusicPlayerActive(player: string) {
    const command = `ps cax | grep -i ${player} | awk '{print $5}'`;
    const result = await getCommandResult(command);
    if (result && result.toLowerCase() === player.toLowerCase()) {
        return true;
    }
    return false;
}

export async function isAnythingRunning() {
    const itunesActive = await isMusicPlayerActive("iTunes");
    const spotifyActive = await isMusicPlayerActive("Spotify");

    console.log("itunesActive, spotifyActive: ", itunesActive, spotifyActive);

    return false;
}

export async function getCommandResult(cmd: string) {
    let result: string = "";
    let content: string = "";
    if (isWindows()) {
        content = await execCmd(`cmd /c ${cmd}`, null);
    } else {
        // use the windows commmand
        content = await execCmd(`${cmd}`, null);
    }
    if (!content) {
        return result;
    }
    let contentList = content
        .replace(/\r\n/g, "\r")
        .replace(/\n/g, "\r")
        .split(/\r/);
    if (contentList && contentList.length > 0) {
        for (let i = 0; i < contentList.length; i++) {
            let line = contentList[i];
            if (line && line.trim().length > 0) {
                result = line.trim();
                break;
            }
        }
    }
    return result;
}

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

async function execCmd(cmd: string, projectDir: any) {
    let result: any = null;
    try {
        let opts =
            projectDir !== undefined && projectDir !== null
                ? { cwd: projectDir }
                : {};
        result = await execPromise(cmd, opts);
    } catch (e) {
        result = null;
    }
    return result;
}

function execPromise(command: string, opts: {}) {
    return new Promise(function(resolve, reject) {
        exec(command, opts, (error: any, stdout: string, stderr: any) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(stdout.trim());
        });
    });
}
