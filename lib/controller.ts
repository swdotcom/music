import { execCmd } from "./util";
const applescript = require("applescript");
const util = require("util");
const fs = require("fs");

export class MusicController {
    private scriptsPath: string = __dirname + "/scripts/";

    private scripts: any = {
        state: {
            file: "get_state.%s.applescript"
        },
        play: 'tell application "%s" to play',
        playPause: 'tell application "%s" to playpause',
        pause: 'tell application "%s" to pause',
        playTrackInContext:
            'tell application "%s" to play track "%s" in context "%s"'
    };

    async isMusicPlayerActive(player: string) {
        const command = `pgrep -x ${player}`;
        const result = await execCmd(command);
        if (result) {
            return { status: "ok", value: true };
        }
        return { status: "ok", value: true };
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
        // let script = this.getScript(player, scriptName);
        let script = this.scripts[scriptName];

        if (!params) {
            // set player to the params
            params = [player];
        } else {
            // push the player to the front of the params array
            params.unshift(player);
        }

        let command = "";
        if (script.file) {
            // apply the params (which should only have the player name)
            const scriptFile = util.format.apply(
                util,
                [script.file].concat(params)
            );
            let file = `${this.scriptsPath}${scriptFile}`;
            command = `osascript ${file}`;
            // script = fs.readFileSync(file).toString();
        } else {
            // apply the params to the script
            script = util.format.apply(util, [script].concat(params));
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
