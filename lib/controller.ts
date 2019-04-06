import { execCmd } from "./util";
const util = require("util");
const fs = require("fs");

export class MusicController {
    private scriptsPath: string = __dirname + "/scripts/";

    // applscript music commands and scripts
    private scripts: any = {
        state: {
            file: "get_state.%s.applescript"
        },
        playTrackInContext:
            'tell application "%s" to play track "%s" in context "%s"',
        play: 'tell application "%s" to play',
        pause: 'tell application "%s" to pause',
        playPause: 'tell application "%s" to playpause',
        next: 'tell application "%s" to next track',
        previous: 'tell application "%s" to previous track'
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
        // get the script file if the attribut has one
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
            // apply the params to the one line script
            script = util.format.apply(util, [script].concat(params));
            command = `osascript -e \'${script}\'`;
        }
        const result = await execCmd(command);
        // console.log("exec command result: ", result);
        return result;
    }

    run(player: string, scriptName: string) {
        return this.execScript(player, scriptName);
    }

    playTrackInContext(player: string, params: any[]) {
        return this.execScript(player, "playTrackInContext", params);
    }
}
