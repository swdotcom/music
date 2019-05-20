"use strict";

import { MusicController } from "./lib/controller";
import { PlayerName, PlayerType } from "./lib/models";
import { MusicPlayerState } from "./lib/playerstate";
import { MusicStore } from "./lib/store";
import { MusicUtil } from "./lib/util";

const musicCtr = MusicController.getInstance();
const musicPlayerCtr = MusicPlayerState.getInstance();
const musicStore = MusicStore.getInstance();
const musicUtil = new MusicUtil();

export function setCredentials(credentials: any) {
    musicStore.setCredentials(credentials);
}

export function getAccessToken() {
    return musicStore.credentialByKey("accessToken");
}

export function isSpotifyRunning() {
    return isRunning(PlayerName.SpotifyDesktop);
}

export function isItunesRunning() {
    return isRunning(PlayerName.ItunesDesktop);
}

export async function isRunning(player: PlayerName) {
    return await musicCtr.isMusicPlayerActive(player);
}

export function stopSpotifyIfRunning() {
    return musicCtr.stopPlayer(PlayerName.SpotifyDesktop);
}

export function stopItunesIfRunning() {
    return musicCtr.stopPlayer(PlayerName.ItunesDesktop);
}

export function startSpotifyIfNotRunning() {
    return musicCtr.startPlayer(PlayerName.SpotifyDesktop);
}

export function startItunesIfNotRunning() {
    return musicCtr.startPlayer(PlayerName.ItunesDesktop);
}

/**
 * - Spotify does not return a "genre"
 * - duration is in milliseconds
 * @param player
 * @returns {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
 */
export async function getState(player: PlayerName) {
    if (player === PlayerName.SpotifyWeb) {
        return await musicPlayerCtr.getSpotifyWebCurrentTrack();
    }
    const state = await musicCtr.run(player, "state");
    if (state) {
        return JSON.parse(state);
    }
    return null;
}

export async function getTracksByPlaylistName(
    player: PlayerName,
    playListName: string
) {
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
export function playTrackInContext(player: PlayerName, params: any[]) {
    return musicCtr.playTrackInContext(player, params);
}

export function playSpotifyDevice(device_id: string, play: boolean = true) {
    return musicCtr.playSpotifyDevice(device_id, play);
}

//
// Sinngle line scripts that only require the player (Spotify or iTunes)
//

export function play(player: PlayerName, options: any) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPlay(options);
    } else {
        return musicCtr.run(player, "play");
    }
}

export function playTrack(player: PlayerName, trackId: string) {
    return musicCtr.playTrack(player, trackId);
}

export function pause(player: PlayerName, options: any) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPause(options);
    } else {
        return musicCtr.run(player, "pause");
    }
}

export function playPause(player: PlayerName) {
    return musicCtr.run(player, "playPause");
}

export function next(player: PlayerName, options: any) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebNext(options);
    } else {
        return musicCtr.run(player, "next");
    }
}

export function previous(player: PlayerName, options: any) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPrevious(options);
    } else {
        return musicCtr.run(player, "previous");
    }
}

export function repeatOn(player: PlayerName) {
    return musicCtr.run(player, "repeatOn");
}

export function repeatOff(player: PlayerName) {
    return musicCtr.run(player, "repeatOff");
}

export function setShufflingOn(player: PlayerName) {
    return musicCtr.run(player, "setShuffling", ["true"]);
}

export function setShufflingOff(player: PlayerName) {
    return musicCtr.run(player, "setShuffling", ["false"]);
}

export async function isShuffling(player: PlayerName) {
    const val = await musicCtr.run(player, "isShuffling");
    if (musicUtil.isBooleanString(val)) {
        return JSON.parse(val);
    }
    return val;
}

/**
 * - spotify returns true or false, and itunes returns "off", "one", "all"
 * @param player
 */
export async function isRepeating(player: PlayerName) {
    let val = await musicCtr.run(player, "isRepeating");
    if (musicUtil.isBooleanString(val)) {
        return JSON.parse(val);
    }
    return val;
}

export function setVolume(player: PlayerName, volume: number) {
    return musicCtr.setVolume(player, volume);
}

export function volumeUp(player: PlayerName, volume: number) {
    return musicCtr.run(player, "volumeUp");
}

export function volumeDown(player: PlayerName, volume: number) {
    return musicCtr.run(player, "volumeDown");
}

export function mute(player: PlayerName) {
    return musicCtr.run(player, "mute");
}

export function unMute(player: PlayerName) {
    return musicCtr.run(player, "unMute");
}

export function setItunesLoved(loved: boolean) {
    return musicCtr.setItunesLoved(loved);
}

export async function playlistNames(player: PlayerName) {
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

export function launchPlayer(playerName: PlayerName, options: any) {
    if (playerName === PlayerName.SpotifyWeb) {
        return musicPlayerCtr.launchWebPlayer(options);
    } else {
        return musicCtr.startPlayer(playerName);
    }
}

export function getSpotifyWebDevices() {
    return musicPlayerCtr.spotifyWebUsersDevices();
}
