import { MusicController } from "./lib/controller";
import { isBooleanString, SPOTIFY_NAME, ITUNES_NAME } from "./lib/util";

const musicCtr = new MusicController();

export function isSpotifyRunning() {
    return isRunning(SPOTIFY_NAME);
}

export function isItunesRunning() {
    return isRunning(ITUNES_NAME);
}

export async function isRunning(player: string) {
    return await musicCtr.isMusicPlayerActive(player);
}

export function stopSpotifyIfRunning() {
    return musicCtr.stopPlayer(SPOTIFY_NAME);
}

export function stopItunesIfRunning() {
    return musicCtr.stopPlayer(ITUNES_NAME);
}

export function startSpotifyIfNotRunning() {
    return musicCtr.startPlayer(SPOTIFY_NAME);
}

export function startItunesIfNotRunning() {
    return musicCtr.startPlayer(ITUNES_NAME);
}

/**
 * - Spotify does not return a "genre"
 * - duration is in milliseconds
 * @param player
 * @returns {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
 */
export async function getState(player: string) {
    const state = await musicCtr.run(player, "state");
    if (state) {
        return JSON.parse(state);
    }
    return null;
}

/**
 *
 * @param player
 * @param params (e.g. ["spotify:track:0R8P9KfGJCDULmlEoBagcO", "spotify:album:6ZG5lRT77aJ3btmArcykra"]
 */
export function playTrackInContext(player: string, params: any[]) {
    return musicCtr.playTrackInContext(player, params);
}

//
// Sinngle line scripts that only require the player (Spotify or iTunes)
//

export function play(player: string) {
    return musicCtr.run(player, "play");
}

export function playTrack(player: string, trackId: string) {
    return musicCtr.playTrack(player, trackId);
}

export function pause(player: string) {
    return musicCtr.run(player, "pause");
}

export function playPause(player: string) {
    return musicCtr.run(player, "playPause");
}

export function next(player: string) {
    return musicCtr.run(player, "next");
}

export function previous(player: string) {
    return musicCtr.run(player, "previous");
}

export function repeatOn(player: string) {
    return musicCtr.run(player, "repeatOn");
}

export function repeatOff(player: string) {
    return musicCtr.run(player, "repeatOff");
}

export function setShufflingOn(player: string) {
    return musicCtr.run(player, "setShuffling", ["true"]);
}

export function setShufflingOff(player: string) {
    return musicCtr.run(player, "setShuffling", ["false"]);
}

export async function isShuffling(player: string) {
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
export async function isRepeating(player: string) {
    let val = await musicCtr.run(player, "isRepeating");
    if (isBooleanString(val)) {
        return JSON.parse(val);
    }
    return val;
}

export function setVolume(player: string, volume: number) {
    return musicCtr.setVolume(player, volume);
}

export function volumeUp(player: string, volume: number) {
    return musicCtr.run(player, "volumeUp");
}

export function volumeDown(player: string, volume: number) {
    return musicCtr.run(player, "volumeDown");
}

export function mute(player: string) {
    return musicCtr.run(player, "mute");
}

export function unMute(player: string) {
    return musicCtr.run(player, "unMute");
}

export function playlistNames(player: string) {
    return musicCtr.run(player, "playlistNames");
}
