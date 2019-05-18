import { MusicController } from "./controller";
import { isBooleanString, SPOTIFY_NAME, ITUNES_NAME } from "./util";

const musicCtr = new MusicController();

export class CodyMusic {
    isSpotifyRunning() {
        return this.isRunning(SPOTIFY_NAME);
    }

    isItunesRunning() {
        return this.isRunning(ITUNES_NAME);
    }

    async isRunning(player: string) {
        return await musicCtr.isMusicPlayerActive(player);
    }

    stopSpotifyIfRunning() {
        return musicCtr.stopPlayer(SPOTIFY_NAME);
    }

    stopItunesIfRunning() {
        return musicCtr.stopPlayer(ITUNES_NAME);
    }

    startSpotifyIfNotRunning() {
        return musicCtr.startPlayer(SPOTIFY_NAME);
    }

    startItunesIfNotRunning() {
        return musicCtr.startPlayer(ITUNES_NAME);
    }

    /**
     * - Spotify does not return a "genre"
     * - duration is in milliseconds
     * @param player
     * @returns {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
     */
    async getState(player: string) {
        const state = await musicCtr.run(player, "state");
        if (state) {
            return JSON.parse(state);
        }
        return null;
    }

    async getTracksByPlaylistName(player: string, playListName: string) {
        const params = null;
        const argv = [playListName];
        const result = await musicCtr.run(
            player,
            "playlistTracksOfPlaylist",
            params,
            argv
        );

        let jsonResult: any = {};
        if (result) {
            let jsonList = result.split("[TRACK_END],");
            if (jsonList && jsonList.length > 0) {
                for (let i = 0; i < jsonList.length; i++) {
                    let jsonStr = jsonList[i].trim();
                    jsonResult[i] = JSON.parse(jsonStr);
                }
            }
        }
        return jsonResult;
    }

    /**
     *
     * @param player
     * @param params (e.g. ["spotify:track:0R8P9KfGJCDULmlEoBagcO", "spotify:album:6ZG5lRT77aJ3btmArcykra"]
     */
    playTrackInContext(player: string, params: any[]) {
        return musicCtr.playTrackInContext(player, params);
    }

    //
    // Sinngle line scripts that only require the player (Spotify or iTunes)
    //

    play(player: string) {
        return musicCtr.run(player, "play");
    }

    playTrack(player: string, trackId: string) {
        return musicCtr.playTrack(player, trackId);
    }

    pause(player: string) {
        return musicCtr.run(player, "pause");
    }

    playPause(player: string) {
        return musicCtr.run(player, "playPause");
    }

    next(player: string) {
        return musicCtr.run(player, "next");
    }

    previous(player: string) {
        return musicCtr.run(player, "previous");
    }

    repeatOn(player: string) {
        return musicCtr.run(player, "repeatOn");
    }

    repeatOff(player: string) {
        return musicCtr.run(player, "repeatOff");
    }

    setShufflingOn(player: string) {
        return musicCtr.run(player, "setShuffling", ["true"]);
    }

    setShufflingOff(player: string) {
        return musicCtr.run(player, "setShuffling", ["false"]);
    }

    async isShuffling(player: string) {
        const val = await musicCtr.run(player, "isShuffling");
        if (isBooleanString(val)) {
            return JSON.parse(val);
        }
        return val;
    }

    /**
     * - spotify returns true or false, and itunes returns "off", "one", "all"
     * @param player
     */
    async isRepeating(player: string) {
        let val = await musicCtr.run(player, "isRepeating");
        if (isBooleanString(val)) {
            return JSON.parse(val);
        }
        return val;
    }

    setVolume(player: string, volume: number) {
        return musicCtr.setVolume(player, volume);
    }

    volumeUp(player: string, volume: number) {
        return musicCtr.run(player, "volumeUp");
    }

    volumeDown(player: string, volume: number) {
        return musicCtr.run(player, "volumeDown");
    }

    mute(player: string) {
        return musicCtr.run(player, "mute");
    }

    unMute(player: string) {
        return musicCtr.run(player, "unMute");
    }

    setItunesLoved(loved: boolean) {
        return musicCtr.setItunesLoved(loved);
    }

    async playlistNames(player: string) {
        let result = await musicCtr.run(player, "playlistNames");
        // turn this into a string list
        if (result) {
            result = result.split(",");
            // now trim
            result = result.map((name: string) => {
                return name.trim();
            });
        }

        return result;
    }
}
