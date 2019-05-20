"use strict";

import { MusicController } from "./lib/controller";
import { PlayerName, TrackState, PlayerDevice } from "./lib/models";
import { MusicPlayerState } from "./lib/playerstate";
import { MusicStore } from "./lib/store";
import { MusicUtil } from "./lib/util";
import { deprecate } from "util";

// get the instances
const musicCtr = MusicController.getInstance();
const musicPlayerCtr = MusicPlayerState.getInstance();
const musicStore = MusicStore.getInstance();
const musicUtil = new MusicUtil();

/** review name
 * Set Credentials (currently only supports Spotify)
 * Accepted credentials: clientId, clientSecret, refreshToken, accessToken
 * @param credentials
 */
export function setCredentials(credentials: any) {
    musicStore.setCredentials(credentials);
}

/** review name
 * Get the accessToken provided via through the setCredentials api
 * @returns {string } the access token string
 */
export function getAccessToken() {
    return musicStore.credentialByKey("accessToken");
}

/** review name
 * Checks if the Spotify desktop is running or not
 * @returns {Promise<boolean> }
 */
export function isSpotifyRunning() {
    return isRunning(PlayerName.SpotifyDesktop);
}

/** review name
 * Checks if the iTunes desktop is running or not
 * @returns {Promise<boolean> }
 */
export function isItunesRunning() {
    return isRunning(PlayerName.ItunesDesktop);
}

/** review name
 * Checks if one of the specified players is running
 * @param player {spotify|spotify-web|itunes }
 * @returns {Promise<boolean> }
 */
export async function isRunning(player: PlayerName) {
    if (player === PlayerName.SpotifyWeb) {
        return await musicPlayerCtr.isSpotifyWebRunning();
    } else {
        return await musicCtr.isMusicPlayerActive(player);
    }
}

/** review name
 * Kills the Spotify desktop if it's running
 */
export function stopSpotifyIfRunning() {
    return musicCtr.stopPlayer(PlayerName.SpotifyDesktop);
}

/** review name
 * Kills the iTunes desktop if it's running
 */
export function stopItunesIfRunning() {
    return musicCtr.stopPlayer(PlayerName.ItunesDesktop);
}

/** review name
 * Launches the Spotify desktop if it's not running
 */
export function startSpotifyIfNotRunning() {
    return musicCtr.startPlayer(PlayerName.SpotifyDesktop);
}

/** review name
 * Launches the iTunes desktop if it's not running
 */
export function startItunesIfNotRunning() {
    return musicCtr.startPlayer(PlayerName.ItunesDesktop);
}

/** review name
 * Returns the player state and track of a given player {spotify|spotify-web|itunes }
 * - Spotify does not return a "genre"
 * - duration is in milliseconds
 * @param player
 * @returns {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state }
 */
export async function getState(player: PlayerName): Promise<TrackState> {
    if (player === PlayerName.SpotifyWeb) {
        return await musicPlayerCtr.getSpotifyWebCurrentTrack();
    }
    const state = await musicCtr.run(player, "state");
    if (state) {
        return JSON.parse(state);
    }
    return new TrackState();
}

/** review name
 * Returns the currently running track info (player and track).
 * This only supports returning the state for itunes and spotify desktop
 * on Mac and spotify desktop on windows.
 * Deprecated - use "getState(player:PlayerName)" instead
 */
export async function getCurrentlyRunningTrackState(): Promise<TrackState> {
    return await musicPlayerCtr.getCurrentlyRunningTrackState();
}

/** review name
 * Returns the tracks that are found by the given playlist name
 * @param player {spotify|spotify-web|itunes }
 * @param playListName
 */
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

/** review name
 * Plays a specific track on the Spotify or iTunes desktop
 * @param player
 * @param params (e.g. ["spotify:track:0R8P9KfGJCDULmlEoBagcO", "spotify:album:6ZG5lRT77aJ3btmArcykra"]
 */
export function playTrackInContext(player: PlayerName, params: any[]) {
    return musicCtr.playTrackInContext(player, params);
}

/** review name
 * Initiate and play the specified Spotify device
 * @param device_id {string }
 * @param play {boolean }
 */
export function playSpotifyDevice(device_id: string, play: boolean = true) {
    return musicCtr.playSpotifyDevice(device_id, play);
}

/** review name
 * Initiate the play command for a specific player
 * @param player {spotify|spotify-web|itunes }
 * @param options
 */
export function play(player: PlayerName, options: any) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPlay(options);
    } else {
        return musicCtr.run(player, "play");
    }
}

/** review name
 * Initiate the play command for a given trackId for a specific player
 * @param player {spotify|spotify-web|itunes }
 * @param trackId {string }
 */
export function playTrack(player: PlayerName, trackId: string) {
    return musicCtr.playTrack(player, trackId);
}

/** review name
 * Initiate the pause command for a given player
 * @param player {spotify|spotify-web|itunes }
 * @param options
 */
export function pause(player: PlayerName, options: any) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPause(options);
    } else {
        return musicCtr.run(player, "pause");
    }
}

/** review name
 * Initiate the play/pause command for a given player
 * @param player {spotify|spotify-web|itunes }
 * @param options
 */
export function playPause(player: PlayerName) {
    return musicCtr.run(player, "playPause");
}

/** review name
 * Initiate the next command for a given player
 * @param player {spotify|spotify-web|itunes }
 * @param options
 */
export function next(player: PlayerName, options: any) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebNext(options);
    } else {
        return musicCtr.run(player, "next");
    }
}

/** review name
 * Initiate the previous command for a given player
 * @param player {spotify|spotify-web|itunes }
 * @param options
 */
export function previous(player: PlayerName, options: any) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPrevious(options);
    } else {
        return musicCtr.run(player, "previous");
    }
}

/** review name
 * Turn on repeat for a given player
 * @param player {spotify|spotify-web|itunes }
 * @param options
 */
export function repeatOn(player: PlayerName) {
    return musicCtr.run(player, "repeatOn");
}

/** review name
 * Turn off repeat for a given player
 * @param player {spotify|spotify-web|itunes }
 */
export function repeatOff(player: PlayerName) {
    return musicCtr.run(player, "repeatOff");
}

/** review name
 * Turn on shuffline for a given player
 * @param player {spotify|spotify-web|itunes }
 */
export function setShufflingOn(player: PlayerName) {
    return musicCtr.run(player, "setShuffling", ["true"]);
}

/** review name
 * Turn off shuffling for a given player
 * @param player {spotify|spotify-web|itunes }
 */
export function setShufflingOff(player: PlayerName) {
    return musicCtr.run(player, "setShuffling", ["false"]);
}

/** review name
 * Return whether shuffling is on or not
 * @param player {spotify|spotify-web|itunes }
 */
export async function isShuffling(player: PlayerName) {
    const val = await musicCtr.run(player, "isShuffling");
    if (musicUtil.isBooleanString(val)) {
        return JSON.parse(val);
    }
    return val;
}

/** review name
 * Returns whether the player is on repeat or not
 * - spotify returns true or false, and itunes returns "off", "one", "all"
 * @param player {spotify|spotify-web|itunes }
 */
export async function isRepeating(player: PlayerName) {
    let val = await musicCtr.run(player, "isRepeating");
    if (musicUtil.isBooleanString(val)) {
        return JSON.parse(val);
    }
    return val;
}

/** review name
 * Update the players volume
 * @param player {spotify|spotify-web|itunes }
 * @param volume {0-100 }
 */
export function setVolume(player: PlayerName, volume: number) {
    return musicCtr.setVolume(player, volume);
}

/** review name
 * Increments the players volume by a number
 * @param player {spotify|spotify-web|itunes }
 * @param volume {0-100 }
 */
export function volumeUp(player: PlayerName, volume: number) {
    return musicCtr.run(player, "volumeUp");
}

/** review name
 * Decrements the players volume by a number
 * @param player {spotify|spotify-web|itunes }
 * @param volume {0-100 }
 */
export function volumeDown(player: PlayerName, volume: number) {
    return musicCtr.run(player, "volumeDown");
}
/** review name
 * Mutes the players volume
 * @param player {spotify|spotify-web|itunes }
 */
export function mute(player: PlayerName) {
    return musicCtr.run(player, "mute");
}

/** review name
 * Unmutes the players volume
 * @param player {spotify|spotify-web|itunes }
 */
export function unMute(player: PlayerName) {
    return musicCtr.run(player, "unMute");
}

/** review name
 * Unmutes the players volume
 * @param player {spotify|spotify-web|itunes }
 */
export function setItunesLoved(loved: boolean) {
    return musicCtr.setItunesLoved(loved);
}

/** review name
 * Get the full list of the playlist names for a given player
 * @param player {spotify|spotify-web|itunes }
 */
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

/** review name
 * Launches a player device
 * @param playerName {spotify|spotify-web|itunes }
 * @param options
 */
export function launchPlayer(playerName: PlayerName, options: any) {
    if (playerName === PlayerName.SpotifyWeb) {
        return musicPlayerCtr.launchWebPlayer(options);
    } else {
        return musicCtr.startPlayer(playerName);
    }
}

/** review name
 * Returns available Spotify devices
 * @returns {Promise<PlayerDevice[]> }
 */
export function getSpotifyDevices(): Promise<PlayerDevice[]> {
    return musicPlayerCtr.getSpotifyDevices();
}

/** review name
 * Returns the genre for a provided arguments
 * @param artist {string } is required
 * @param songName {string } is optional
 */
export async function getGenre(
    artist: string,
    songName: string = ""
): Promise<string> {
    return musicCtr.getGenre(artist, songName);
}

/** review name
 * Returns the spotify genre for a provided arguments
 * @param artist {string } is required
 */
export async function getSpotifyGenre(artist: string): Promise<string> {
    return musicCtr.getGenreFromSpotify(artist);
}
