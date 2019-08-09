import { MusicUtil } from "./util";
import { MusicClient } from "./client";
import { PlayerName } from "./models";
import { MusicStore } from "./store";
import { CacheUtil } from "./cache";

const musicClient = MusicClient.getInstance();
const musicUtil = new MusicUtil();
const cacheUtil = CacheUtil.getInstance();

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
        checkPlayerRunningState: {
            file: "check_state.{0}.applescript",
            requiresArgv: false
        },
        firstTrackState: {
            file: "get_first_track_state.{0}.applescript",
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
            'tell application "{0}" to play track "{1}" {2} "{3}"',
        playTrackNumberInPlaylist: {
            file: "play_track_number_in_playlist.{0}.applescript",
            requiresArgv: true
        },
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
            'tell application "{0}" to set loved of current track to {1}',
        playlistTrackCounts: {
            file: "get_playlist_count.{0}.applescript",
            requiresArgv: false
        }
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

        if (!musicUtil.isMac()) {
            return false;
        }

        let appName = "Spotify.app";
        if (player === PlayerName.ItunesDesktop) {
            appName = "iTunes.app";
        }
        let command = `ps -ef | grep "${appName}" | grep -v grep`;
        if (player === PlayerName.ItunesDesktop) {
            // make sure it's not the cache extension process
            command = `${command} | grep -i "visualizer"`;
        }

        command = `${command} | awk '{print $2}'`;

        // this returns the PID of the requested player
        const result = await musicUtil.execCmd(command);
        if (result && !result.error) {
            return true;
        }
        return false;
    }

    async stopPlayer(player: PlayerName) {
        if (!musicUtil.isMac()) {
            return "";
        }

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
        if (result === null || result === undefined || result === "") {
            result = "ok";
        }
        return result;
    }

    async startPlayer(player: string, options: any = {}) {
        if (!musicUtil.isMac()) {
            return "";
        }

        player = musicUtil.getPlayerName(player);
        let quietly = true;
        if (
            options &&
            options.quietly !== undefined &&
            options.quietly !== null
        ) {
            quietly = options.quietly;
        }

        const command = quietly ? `open -a ${player} -gj` : `open -a ${player}`;
        let result = await musicUtil.execCmd(command);
        if (result === null || result === undefined || result === "") {
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
        } else {
            if (scriptName === "play" && player.toLowerCase() === "itunes") {
                // if itunes is not currently running, default to play from the
                // user's default playlist
                let itunesTrack = await this.run(
                    PlayerName.ItunesDesktop,
                    "state"
                );

                if (itunesTrack) {
                    // make it an object
                    try {
                        itunesTrack = JSON.parse(itunesTrack);
                        if (!itunesTrack || !itunesTrack.id) {
                            // play from the user's default playlist
                            script = this.scripts.playFromLibrary;
                            params.push("Library");
                        }
                    } catch (err) {
                        // play from the user's default playlist
                        script = this.scripts.playFromLibrary;
                        params.push("Library");
                    }
                }
            } else if (scriptName === "playTrackInContext") {
                if (player === PlayerName.ItunesDesktop) {
                    params.splice(2, 0, "of playlist");
                } else {
                    params.splice(2, 0, "in context");
                }
            }

            // apply the params to the one line script
            script = musicUtil.formatString(script, params);
            command = `osascript -e \'${script}\'`;
        }

        let result = await musicUtil.execCmd(command);
        if (result === null || result === undefined || result === "") {
            result = "ok";
        }
        return result;
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
            async result => {
                if (
                    result &&
                    result.error &&
                    result.error.toLowerCase().includes("not authorized")
                ) {
                    // reset the apple events to show the request access again
                    // await musicUtil.execCmd("tccutil reset AppleEvents");
                    // result = await this.execScript(
                    //     player,
                    //     scriptName,
                    //     params,
                    //     argv
                    // );
                    return "[GRANT_ERROR] Desktop Player Access Not Authorized";
                }
                if (result === null || result === undefined || result === "") {
                    if (player === PlayerName.ItunesDesktop) {
                        MusicStore.getInstance().itunesAccessGranted = true;
                    }
                    result = "ok";
                }
                return result;
            }
        );
    }

    setVolume(player: string, volume: number) {
        this.lastVolumeLevel = volume;
        return this.execScript(player, "setVolume", [volume]).then(result => {
            if (result === null || result === undefined || result === "") {
                result = "ok";
            }
            return result;
        });
    }

    setItunesLoved(loved: boolean) {
        return this.execScript(PlayerName.ItunesDesktop, "setItunesLoved", [
            loved
        ])
            .then(result => {
                if (result === null || result === undefined || result === "") {
                    result = "ok";
                }
                return result;
            })
            .catch(err => {
                return false;
            });
    }

    playTrackInContext(player: string, params: any[]) {
        return this.execScript(player, "playTrackInContext", params).then(
            result => {
                if (result === null || result === undefined || result === "") {
                    result = "ok";
                }
                return result;
            }
        );
    }

    public async playPauseSpotifyDevice(device_id: string, play: boolean) {
        const payload = {
            device_ids: [device_id],
            play
        };
        return musicClient.spotifyApiPut("/v1/me/player", {}, payload);
    }

    public async spotifyWebPlayPlaylist(
        playlistId: string,
        startingTrackId: string = "",
        deviceId: string = ""
    ) {
        const qsOptions = deviceId ? { device_id: deviceId } : {};
        playlistId = musicUtil.createPlaylistUriFromPlaylistId(playlistId);
        const trackUris = musicUtil.createUrisFromTrackIds([startingTrackId]);
        // play playlist needs body params...
        // {"context_uri":"spotify:playlist:<id>"}

        let payload: any = {};

        // playlistId is required
        payload["context_uri"] = playlistId;

        if (trackUris && trackUris.length > 0) {
            payload["offset"] = {
                uri: trackUris[0]
            };
        }

        const api = "/v1/me/player/play";
        let response = await musicClient.spotifyApiPut(api, qsOptions, payload);

        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiPut(api, qsOptions, payload);
        }
        return response;
    }

    public async spotifyWebPlayTrack(trackId: string, deviceId: string = "") {
        /**
         * to play a track without the play list id
         * curl -X "PUT" "https://api.spotify.com/v1/me/player/play?device_id=4f38ae14f61b3a2e4ed97d537a5cb3d09cf34ea1"
         * --data "{\"uris\":[\"spotify:track:2j5hsQvApottzvTn4pFJWF\"]}"
         */

        const trackUris = musicUtil.createUrisFromTrackIds([trackId]);
        const qsOptions = deviceId ? { device_id: deviceId } : {};
        const payload = {
            uris: trackUris
        };
        const api = "/v1/me/player/play";
        let response = await musicClient.spotifyApiPut(api, qsOptions, payload);

        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiPut(api, qsOptions, payload);
        }
        return response;
    }

    public async spotifyWebPlay(options: any) {
        const qsOptions = options.device_id
            ? { device_id: options.device_id }
            : {};
        let payload: any = {};
        if (options.uris) {
            payload["uris"] = options.uris;
        } else if (options.track_ids) {
            payload["uris"] = musicUtil.createUrisFromTrackIds(
                options.track_ids
            );
        }

        if (options.offset) {
            payload["offset"] = options.offset;
        }

        if (options.context_uri) {
            payload["context_uri"] = options.context_uri;
        }

        if (payload.context_uri && payload.uris) {
            if (payload.offset) {
                payload["offset"] = {
                    ...payload.offset,
                    uri: payload.uris[0]
                };
            } else {
                payload["offset"] = {
                    uri: payload.uris[0]
                };
            }
            delete payload.uris;
        }

        const api = "/v1/me/player/play";
        let response = await musicClient.spotifyApiPut(api, qsOptions, payload);

        // check if the token needs to be refreshed
        if (response.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            response = await musicClient.spotifyApiPut(api, qsOptions, payload);
        }
        return response;
    }

    public async spotifyWebPause(options: any) {
        const qsOptions = options.device_id
            ? { device_id: options.device_id }
            : {};
        let payload: any = {};
        if (options.uris) {
            payload["uris"] = options.uris;
        } else if (options.track_ids) {
            payload["uris"] = musicUtil.createUrisFromTrackIds(
                options.track_ids
            );
        }

        const api = "/v1/me/player/pause";
        let codyResp = await musicClient.spotifyApiPut(api, qsOptions, payload);

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPut(api, qsOptions, payload);
        }

        return codyResp;
    }

    public async spotifyWebPrevious(options: any) {
        const qsOptions = options.device_id
            ? { device_id: options.device_id }
            : {};
        let payload: any = {};
        if (options.uris) {
            payload["uris"] = options.uris;
        } else if (options.track_ids) {
            payload["uris"] = musicUtil.createUrisFromTrackIds(
                options.track_ids
            );
        }

        const api = "/v1/me/player/previous";
        let codyResp = await musicClient.spotifyApiPost(
            api,
            qsOptions,
            payload
        );

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPost(
                api,
                qsOptions,
                payload
            );
        }

        return codyResp;
    }

    public async spotifyWebNext(options: any) {
        const qsOptions = options.device_id
            ? { device_id: options.device_id }
            : {};
        let payload: any = {};
        if (options.uris) {
            payload["uris"] = options.uris;
        } else if (options.track_ids) {
            payload["uris"] = musicUtil.createUrisFromTrackIds(
                options.track_ids
            );
        }

        const api = "/v1/me/player/next";
        let codyResp = await musicClient.spotifyApiPost(
            api,
            qsOptions,
            payload
        );

        // check if the token needs to be refreshed
        if (codyResp.statusText === "EXPIRED") {
            // refresh the token
            await musicClient.refreshSpotifyToken();
            // try again
            codyResp = await musicClient.spotifyApiPost(
                api,
                qsOptions,
                payload
            );
        }

        return codyResp;
    }

    public async getGenre(
        artist: string,
        songName: string = ""
    ): Promise<string> {
        let genre = cacheUtil.getItem(`genre_${artist}_${songName}`);
        if (genre) {
            return genre;
        }
        genre = await musicClient.getGenreFromItunes(artist, songName);
        if (!genre || genre === "") {
            genre = await this.getGenreFromSpotify(artist);
        }
        if (genre) {
            // 48 hour cache
            cacheUtil.setItem(
                `genre_${artist}_${songName}`,
                genre,
                60 * 60 * 24 * 2
            );
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
