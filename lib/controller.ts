import { execCmd } from "./util";
const util = require("util");

export class MusicController {
    private scriptsPath: string = __dirname + "/scripts/";
    private lastVolumeLevel: any = null;

    // applscript music commands and scripts
    private scripts: any = {
        state: {
            file: "get_state.%s.applescript"
        },
        volumeUp: {
            file: "volume_up.%s.applescript"
        },
        volumeDown: {
            file: "volume_down.%s.applescript"
        },
        playTrackInContext:
            'tell application "%s" to play track "%s" in context "%s"',
        play: 'tell application "%s" to play',
        pause: 'tell application "%s" to pause',
        playPause: 'tell application "%s" to playpause',
        next: 'tell application "%s" to %s track',
        previous: 'tell application "%s" to %s track',
        repeatOn: 'tell application "%s" to set %s to %s',
        repeatOff: 'tell application "%s" to set %s to %s',
        isRepeating: 'tell application "%s" to return %s',
        setVolume: 'tell application "%s" to set sound volume to %s',
        mute: 'tell application "%s" to set sound volume to 0',
        unMute: 'tell application "%s" to set sound volume to %'
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
            console.log("script to use: ", script);
            command = `osascript -e \'${script}\'`;
        }
        const result = await execCmd(command);
        // console.log("exec command result: ", result);
        return result;
    }

    async run(player: string, scriptName: string) {
        let params = null;
        if (player === "Spotify") {
            if (scriptName === "repeatOn") {
                params = ["repeating", "true"];
            } else if (scriptName === "repeatOff") {
                params = ["repeating", "false"];
            } else if (scriptName === "isRepeating") {
                params = ["repeating"];
            } else if (scriptName === "next") {
                params = ["next"];
            } else if (scriptName === "previous") {
                params = ["previous"];
            }
        } else if (player === "iTunes") {
            if (scriptName === "repeatOn") {
                params = ["song repeat", "on"];
            } else if (scriptName === "repeatOff") {
                params = ["song repeat", "off"];
            } else if (scriptName === "isRepeating") {
                params = ["song repeat"];
            } else if (scriptName === "next") {
                params = ["play next"];
            } else if (scriptName === "previous") {
                params = ["play previous"];
            }
        }

        if (scriptName === "mute") {
            // get the current volume state
            let stateResult = await this.execScript(player, "state");
            let json = JSON.parse(stateResult);
            this.lastVolumeLevel = json.volume;
        } else if (scriptName === "unMute") {
            params = [this.lastVolumeLevel];
        }
        return this.execScript(player, scriptName, params);
    }

    setVolume(player: string, volume: number) {
        this.lastVolumeLevel = volume;
        return this.execScript(player, "setVolume", [volume]);
    }

    playTrackInContext(player: string, params: any[]) {
        return this.execScript(player, "playTrackInContext", params);
    }
}
