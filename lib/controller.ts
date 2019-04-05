import { execCmd } from "./util";
const applescript = require("applescript");
const util = require("util");
const fs = require("fs");

export class MusicController {
    private scriptsPath: string = __dirname + "/scripts/";

    private itunes_scripts: any = {
        state: {
            file: "get_state.itunes.applescript"
        },
        play: 'tell application "iTunes" to play',
        playPause: 'tell application "iTunes" to playpause',
        pause: 'tell application "iTunes" to pause',
        playTrackInContext:
            'tell application "iTunes" to play track "%s" of name "%s"'
    };

    private spotify_scripts: any = {
        // state:
        //     'tell application "Spotify" to get {artist, album, id, index, name, time} of the current track',
        state: {
            file: "get_state.spotify.applescript"
        },
        play: 'tell application "Spotify" to play',
        playPause: 'tell application "Spotify" to playpause',
        pause: 'tell application "Spotify" to pause',
        playTrackInContext:
            'tell application "Spotify" to play track "%s" in context "%s"'
    };

    async isMusicPlayerActive(player: string) {
        const command = `pgrep -x ${player}`;
        const result = await execCmd(command);
        if (result) {
            return { status: "ok", value: true };
        }
        return { status: "ok", value: true };
    }

    getScript(player: string, script: string) {
        if (player.toLowerCase() === "spotify") {
            return this.spotify_scripts[script];
        } else {
            return this.itunes_scripts[script];
        }
    }

    async stopPlayer(player: string) {
        const command = `pgrep -x ${player} | xargs kill -9`;
        return await execCmd(command);
    }

    async startPlayer(player: string) {
        const command = `open -a ${player}`;
        const result = await execCmd(command);
        return result;
    }

    async execScript(player: string, scriptName: string, params: any = null) {
        let script = this.getScript(player, scriptName);

        let command = "";
        if (script.file) {
            let file = `${this.scriptsPath}${script.file}`;
            command = `osascript ${file}`;
            // script = fs.readFileSync(file).toString();
        } else {
            if (params) {
                // apply them to the script
                script = util.format.apply(util, [script].concat(params));
            }
            command = `osascript -e \'${script}\'`;
        }
        const result = await execCmd(command);
        return result;
    }

    applescriptCallback(err: any, value: any) {
        if (err) {
            console.log("error: ", err);
            // Something went wrong!
            return { status: "error", value: err.message };
        } else if (value) {
            console.log("result: ", value);
            return { status: "ok", value };
        }
        return { status: "ok", value: "" };
    }

    async play(player: string) {
        return await this.execScript(player, "play");
    }

    async pause(player: string) {
        return await this.execScript(player, "pause");
    }

    async playPause(player: string) {
        return await this.execScript(player, "playPause");
    }

    async playTrackInContext(player: string, params: any[]) {
        return await this.execScript(player, "playTrackInContext", params);
    }

    async getState(player: string) {
        let result = await this.execScript(player, "state");
        return result;
    }
}
