import { MusicUtil } from "./util";
import { MusicClient } from "./client";
import { PlayerName } from "./models";

const musicClient = MusicClient.getInstance();
const musicUtil = new MusicUtil();

export class MusicController {
    static readonly WINDOWS_SPOTIFY_TRACK_FIND: string =
        'tasklist /fi "imagename eq Spotify.exe" /fo list /v | find " - "';

    private scriptsPath: string = __dirname + "/scripts/";
    private lastVolumeLevel: any = null;

    // applscript music commands and scripts
    private scripts: any = {
        state: {
            file: "get_state.{0}.applescript",
            requiresArgv: false
        },
        volumeUp: {
            file: "volume_up.{0}.applescript",
            requiresArgv: false
        },
        volumeDown: {
            file: "volume_down.{0}.applescript",
            requiresArgv: false
        },
        playTrackInContext:
            'tell application "{0}" to play track "{1}" in context "{2}"',
        play: 'tell application "{0}" to play',
        playFromLibrary: 'tell application "{0}" to play of playlist "{1}"',
        playSongFromLibrary:
            'tell application "{0}" to play track "{1}" of playlist "{2}"',
        playTrack: 'tell application "{0}" to play track {1}',
        pause: 'tell application "{0}" to pause',
        playPause: 'tell application "{0}" to playpause',
        next: 'tell application "{0}" to play (next track)',
        previous: 'tell application "{0}" to play (previous track)',
        repeatOn: 'tell application "{0}" to set {1} to {2}',
        repeatOff: 'tell application "{0}" to set {1} to {2}',
        isRepeating: 'tell application "{0}" to return {1}',
        setVolume: 'tell application "{0}" to set sound volume to {1}',
        mute: 'tell application "{0}" to set sound volume to 0',
        unMute: 'tell application "{0}" to set sound volume to {1}',
        setShuffling: 'tell application "{0}" to set {1} to {2}',
        isShuffling: 'tell application "{0}" to {1}',
        playlistNames: {
            file: "get_playlist_names.{0}.applescript"
        },
        playTrackOfPlaylist: {
            file: "play_track_of_playlist.{0}.applescript"
        },
        playlistTracksOfPlaylist: {
            file: "get_playlist_songs.{0}.applescript",
            requiresArgv: true
        },
        setItunesLoved:
            'tell application "{0}" to set loved of current track to {1}'
    };

    private static instance: MusicController;
    private constructor() {
        //
    }
    static getInstance() {
        if (!MusicController.instance) {
            MusicController.instance = new MusicController();
        }
        return MusicController.instance;
    }

    async isMusicPlayerActive(player: PlayerName) {
        player = musicUtil.getPlayerName(player);
        const command = `pgrep -x ${player}`;
        // this returns the PID of the requested player
        const result = await musicUtil.execCmd(command);
        if (result && !result.error) {
            return true;
        }
        return false;
    }

    async stopPlayer(player: PlayerName) {
        /**
         * ps -ef | grep "Spotify.app" | grep -v grep | awk '{print $2}' | xargs kill
         * ps -ef | grep "iTunes.app" | grep -v grep | awk '{print $2}' | xargs kill
         */
        let appName = "Spotify.app";
        if (player === PlayerName.ItunesDesktop) {
            appName = "iTunes.app";
        }
        const command = `ps -ef | grep "${appName}" | grep -v grep | awk '{print $2}' | xargs kill`;
        let result = await musicUtil.execCmd(command);
        if (result === null || result === undefined) {
            result = "ok";
        }
        return result;
    }

    async startPlayer(player: string) {
        player = musicUtil.getPlayerName(player);
        const command = `open -a ${player}`;
        let result = await musicUtil.execCmd(command);
        if (result === null || result === undefined) {
            result = "ok";
        }
        return result;
    }

    async execScript(
        player: string,
        scriptName: string,
        params: any = null,
        argv: any = null
    ) {
        player = musicUtil.getPlayerName(player);
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
            const scriptFile = musicUtil.formatString(script.file, params);
            let file = `${this.scriptsPath}${scriptFile}`;
            if (argv) {
                // make sure they have quotes around the argv
                argv = argv.map((val: any) => {
                    return `"${val}"`;
                });
                const argvOptions = argv.join(" ");
                command = `osascript ${file} ${argvOptions}`;
            } else {
                command = `osascript ${file}`;
            }
            // script = fs.readFileSync(file).toString();
        } else {
            if (scriptName === "play" && player.toLowerCase() === "itunes") {
                script = this.scripts.playFromLibrary;
                params.push("Library");
            }
            // apply the params to the one line script
            script = musicUtil.formatString(script, params);
            command = `osascript -e \'${script}\'`;
        }
        let result = await musicUtil.execCmd(command);
        if (result === null || result === undefined) {
            result = "ok";
        }
        return result;
    }

    playTrack(player: string, trackId: string) {
        let params = null;
        if (player === "Spotify") {
            params = [`"${trackId}"`];
        } else {
            params = [`${trackId}`];
        }
        return this.execScript(player, "playTrack", params).then(result => {
            if (result === null || result === undefined) {
                result = "ok";
            }
            return result;
        });
    }

    async run(
        player: PlayerName,
        scriptName: string,
        params: any = null,
        argv: any = null
    ) {
        player = musicUtil.getPlayerName(player);
        if (player === PlayerName.SpotifyDesktop) {
            if (scriptName === "repeatOn") {
                params = ["repeating", "true"];
            } else if (scriptName === "repeatOff") {
                params = ["repeating", "false"];
            } else if (scriptName === "isRepeating") {
                params = ["repeating"];
            } else if (scriptName === "setShuffling") {
                // this will already have params
                params.unshift("shuffling");
            } else if (scriptName === "isShuffling") {
                params = ["return shuffling"];
            }
        } else if (player === PlayerName.ItunesDesktop) {
            if (scriptName === "repeatOn") {
                // repeat one for itunes
                params = ["song repeat", "one"];
            } else if (scriptName === "repeatOff") {
                // repeat off for itunes
                params = ["song repeat", "off"];
            } else if (scriptName === "isRepeating") {
                // get the song repeat value
                params = ["song repeat"];
            } else if (scriptName === "setShuffling") {
                params.unshift("shuffle enabled");
            } else if (scriptName === "isShuffling") {
                params = ["get shuffle enabled"];
            }
        }

        if (scriptName === "mute") {
            // get the current volume state
            let stateResult = await this.execScript(player, "state");
            let json = JSON.parse(stateResult);
            this.lastVolumeLevel = json.volume;
        } else if (scriptName === "unMute") {
            params = [this.lastVolumeLevel];
        } else if (scriptName === "next" || scriptName === "previous") {
            // make sure it's not on repeat
            if (player === PlayerName.SpotifyDesktop) {
                await this.execScript(player, "state", ["repeating", "false"]);
            } else {
                await this.execScript(player, "state", ["song repeat", "off"]);
            }
        }
        return this.execScript(player, scriptName, params, argv).then(
            result => {
                if (result === null || result === undefined) {
                    result = "ok";
                }
                return result;
            }
        );
    }

    setVolume(player: string, volume: number) {
        this.lastVolumeLevel = volume;
        return this.execScript(player, "setVolume", [volume]).then(result => {
            if (result === null || result === undefined) {
                result = "ok";
            }
            return result;
        });
    }

    setItunesLoved(loved: boolean) {
        return this.execScript(PlayerName.ItunesDesktop, "setItunesLoved", [
            loved
        ]).then(result => {
            if (result === null || result === undefined) {
                result = "ok";
            }
            return result;
        });
    }

    playTrackInContext(player: string, params: any[]) {
        return this.execScript(player, "playTrackInContext", params).then(
            result => {
                if (result === null || result === undefined) {
                    result = "ok";
                }
                return result;
            }
        );
    }

    public async playSpotifyDevice(device_id: string) {
        const payload = {
            device_ids: [device_id],
            play: true
        };
        return musicClient.spotifyApiPut("v1/me/player", {}, payload);
    }

    public async spotifyWebPlay(options: any) {
        const qsOptions = options.device_id
            ? { device_id: options.device_id }
            : {};
        const payload = options.track_ids ? { uris: options.track_ids } : {};
        return musicClient.spotifyApiPut(
            "/v1/me/player/play",
            qsOptions,
            payload
        );
    }

    public async spotifyWebPause(options: any) {
        const qsOptions = options.device_id
            ? { device_id: options.device_id }
            : {};
        const payload = options.track_ids ? { uris: options.track_ids } : {};
        return musicClient.spotifyApiPut(
            "/v1/me/player/pause",
            qsOptions,
            payload
        );
    }

    public async spotifyWebPrevious(options: any) {
        const qsOptions = options.device_id
            ? { device_id: options.device_id }
            : {};
        const payload = options.track_ids ? { uris: options.track_ids } : {};
        return musicClient.spotifyApiPost(
            "/v1/me/player/previous",
            qsOptions,
            payload
        );
    }

    public async spotifyWebNext(options: any) {
        const qsOptions = options.device_id
            ? { device_id: options.device_id }
            : {};
        const payload = options.track_ids ? { uris: options.track_ids } : {};
        return musicClient.spotifyApiPost(
            "/v1/me/player/next",
            qsOptions,
            payload
        );
    }

    public async getGenre(
        artist: string,
        songName: string = ""
    ): Promise<string> {
        let genre = await musicClient.getGenreFromItunes(artist, songName);
        if (!genre || genre === "") {
            genre = await this.getGenreFromSpotify(artist);
        }
        return genre;
    }

    public async getGenreFromSpotify(artist: string): Promise<string> {
        let response = await musicClient.getGenreFromSpotify(artist);
        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.getGenreFromSpotify(artist);
        }

        return response.data;
    }

    /**
     * Kills the Spotify desktop player if it's running
     * @param player {spotify|spotify-web|itunes}
     */
    public quitApp(player: PlayerName) {
        if (player === PlayerName.ItunesDesktop) {
            return this.stopPlayer(PlayerName.ItunesDesktop);
        } else {
            return this.stopPlayer(PlayerName.SpotifyDesktop);
        }
    }

    /**
     * Launches the desktop player
     * @param player {spotify|spotify-web|itunes}
     */
    public launchApp(player: PlayerName) {
        if (player === PlayerName.ItunesDesktop) {
            return this.startPlayer(PlayerName.ItunesDesktop);
        }
        return this.startPlayer(PlayerName.SpotifyDesktop);
    }
}
