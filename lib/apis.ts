"use strict";

import { MusicController } from "./controller";
import {
    PlayerName,
    Track,
    PlayerDevice,
    SpotifyAudioFeature,
    PlayerType,
    PlaylistItem,
    CodyResponse,
    PlaylistTrackInfo,
    PaginationItem
} from "./models";
import { MusicPlayerState } from "./playerstate";
import { AudioStat } from "./audiostat";
import { MusicStore } from "./store";
import { MusicUtil } from "./util";
import { Playlist } from "./playlist";

// get the instances
const musicCtr = MusicController.getInstance();
const musicPlayerCtr = MusicPlayerState.getInstance();
const musicStore = MusicStore.getInstance();
const musicUtil = new MusicUtil();
const audioStat = AudioStat.getInstance();
const playlist = Playlist.getInstance();

/**
 * Set Credentials (currently only supports Spotify)
 * Accepted credentials: clientId, clientSecret, refreshToken, accessToken
 * @param credentials
 */
export function setCredentials(credentials: any) {
    musicStore.setCredentials(credentials);
}

/**
 * Get the accessToken provided via through the setCredentials api
 * @returns {string} the access token string
 */
export function getAccessToken() {
    return musicStore.credentialByKey("accessToken");
}

/**
 * Checks if the Spotify desktop or web player is running or not
 * @returns {Promise<boolean>}
 */
export async function isSpotifyRunning() {
    let running = await isPlayerRunning(PlayerName.SpotifyDesktop);
    if (!running) {
        // check the web
        running = await musicPlayerCtr.isSpotifyWebRunning();
    }
    return running;
}

/**
 * Checks if the iTunes desktop player is running or not
 * @returns {Promise<boolean>}
 */
export function isItunesRunning() {
    return isPlayerRunning(PlayerName.ItunesDesktop);
}

/**
 * Checks if one of the specified players is running
 * @param player {spotify|spotify-web|itunes}
 * @returns {Promise<boolean>}
 */
export async function isPlayerRunning(player: PlayerName) {
    if (player === PlayerName.SpotifyWeb) {
        return await musicPlayerCtr.isSpotifyWebRunning();
    } else {
        return await musicCtr.isMusicPlayerActive(player);
    }
}

/**
 * Returns whether there's an active track,
 * (spotify web, spotify desktop, or itunes desktop)
 * @returns {Promise<boolean>}
 */
export async function hasActiveTrack(): Promise<boolean> {
    const track: Track = await getRunningTrack();
    if (track && track.id) {
        return true;
    }
    return false;
}

/**
 * Returns the currently running track.
 * Spotify web, desktop, or itunes desktop.
 * It will return an empty Track object if it's unable to
 * find a running track.
 * @returns {Promise<Track>}
 **/
export async function getRunningTrack(): Promise<Track> {
    const spotifyDevices = await getSpotifyDevices();
    let track = null;

    if (spotifyDevices.length > 0) {
        track = await getTrack(PlayerName.SpotifyWeb);
        if (!track || !track.id) {
            const spotifyDesktopRunning = await isPlayerRunning(
                PlayerName.SpotifyDesktop
            );
            if (spotifyDesktopRunning) {
                track = await getTrack(PlayerName.SpotifyDesktop);
            }
        }
    }
    if (!track || !track.id) {
        const itunesDesktopRunning = await isPlayerRunning(
            PlayerName.ItunesDesktop
        );

        if (itunesDesktopRunning) {
            track = await getTrack(PlayerName.ItunesDesktop);
            if (track && !track.id) {
                // get the 1st track
                track = await musicCtr.run(
                    PlayerName.ItunesDesktop,
                    "firstTrackState"
                );
                if (track) {
                    try {
                        track = JSON.parse(track);
                        if (track) {
                            track["playerType"] = PlayerType.MacItunesDesktop;
                        }
                    } catch (e) {}
                }
            }
        }
    }

    if (!track) {
        track = new Track();
    }

    return track;
}

/**
 * Returns the track of a given player {spotify|spotify-web|itunes}
 * - Spotify does not return a "genre"
 * - duration is in milliseconds
 * @param player {spotify|spotif-web|itunes}
 * @returns {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
 */
export async function getTrack(player: PlayerName): Promise<Track> {
    let track;
    if (player === PlayerName.SpotifyWeb) {
        // fetch the web track
        track = await musicPlayerCtr.getSpotifyWebCurrentTrack();
    } else {
        // fetch the track from the specified player name
        track = await musicCtr.run(player, "state");
        if (track) {
            try {
                track = JSON.parse(track);
            } catch (e) {}
        }
    }

    if (!track || musicUtil.isEmptyObj(track)) {
        track = new Track();
    } else if (track && !track["playerType"]) {
        if (player === PlayerName.SpotifyWeb) {
            track["playerType"] = PlayerType.WebSpotify;
        } else if (player === PlayerName.SpotifyDesktop) {
            track["playerType"] = PlayerType.MacSpotifyDesktop;
        } else {
            track["playerType"] = PlayerType.MacItunesDesktop;
        }
    }

    return track;
}

/**
 * Returns the tracks that are found for itunes
 * @param player {itunes}
 * @param playListName
 */
export async function getTracksByPlaylistName(
    player: PlayerName,
    playListName: string
): Promise<Track[]> {
    let playlistItems: Track[] = [];
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
        try {
            let jsonList;
            if (result.indexOf("[TRACK_END],") !== -1) {
                jsonList = result.split("[TRACK_END],");
            } else {
                jsonList = result.split("[TRACK_END]");
            }
            if (jsonList && jsonList.length > 0) {
                for (let i = 0; i < jsonList.length; i++) {
                    let jsonStr = jsonList[i].trim();
                    if (jsonStr.toLowerCase() !== "ok") {
                        try {
                            jsonResult[i] = JSON.parse(jsonStr);
                        } catch (err) {
                            // it might be the success response "ok"
                        }
                    }
                }
            }
        } catch (err) {
            //
        }
    }
    if (jsonResult) {
        // go through the keys and create an array
        // of PlaylistItem
        playlistItems = Object.keys(jsonResult).map((key: string) => {
            let trackItem = jsonResult[key];
            let track: Track = new Track();
            track.name = trackItem.name;
            track.type = "track";
            track.id = trackItem.id;
            track.artist = trackItem.artist;
            track.album = trackItem.album;
            track.played_count = trackItem.played_count;
            track.duration = trackItem.duration;
            track.playerType = PlayerType.MacItunesDesktop;
            return track;
        });
    }
    return playlistItems;
}

/**
 * Returns the tracks that are found by the given playlist name
 * - currently spofity-web support only
 * @param player {spotify-web}
 * @param playlist_id (optional)
 * @param qsOptions (optional) {offset, limit}
 */
export async function getPlaylistTracks(
    player: PlayerName,
    playlist_id: string,
    qsOptions: any = {}
): Promise<CodyResponse> {
    if (player === PlayerName.SpotifyWeb) {
        return playlist.getPlaylistTracks(playlist_id, qsOptions);
    }

    // itunes or spotify desktop
    const tracks: Track[] = await getTracksByPlaylistName(player, playlist_id);
    let codyResp: CodyResponse = new CodyResponse();
    let pageItem: PaginationItem = new PaginationItem();
    pageItem.offset = 0;
    pageItem.next = "";
    pageItem.previous = "";
    pageItem.limit = -1;
    pageItem.total = tracks.length;
    pageItem.items = tracks;
    codyResp.data = pageItem;
    return codyResp;
}

/**
 * Plays a specific track on the Spotify or iTunes desktop
 * @param player
 * @param params
 * spotify example  ["spotify:track:0R8P9KfGJCDULmlEoBagcO", "spotify:album:6ZG5lRT77aJ3btmArcykra"]
 *   -- provice the trackID then the album or playlist ID
 * itunes example   ["Let Me Down Slowly", "MostRecents"]
 *   -- provide the track name then the playlist name
 */
export function playTrackInContext(player: PlayerName, params: any[]) {
    return musicCtr.playTrackInContext(player, params);
}

/**
 * Initiate and play the specified Spotify device
 * @param device_id {string}
 * @param play {boolean}
 */
export function playSpotifyDevice(device_id: string) {
    return musicCtr.playSpotifyDevice(device_id);
}

/**
 * Initiate the play command for a specific player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
export function play(player: PlayerName, options: any = {}) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPlay(options);
    } else {
        return musicCtr.run(player, "play");
    }
}

/**
 * Initiate the play command for a given trackId for a specific player
 * @param player {spotify|spotify-web|itunes}
 * @param trackId {any (string|number)}
 */
export function playTrack(player: PlayerName, trackId: any) {
    return playTrackInContext(player, [trackId]);
}

/**
 * Initiate the pause command for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
export function pause(player: PlayerName, options: any = {}) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPause(options);
    } else {
        return musicCtr.run(player, "pause");
    }
}

/**
 * Initiate the play/pause command for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
export function playPause(player: PlayerName) {
    return musicCtr.run(player, "playPause");
}

/**
 * Initiate the next command for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
export function next(player: PlayerName, options: any = {}) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebNext(options);
    } else {
        return musicCtr.run(player, "next");
    }
}

/**
 * Initiate the previous command for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
export function previous(player: PlayerName, options: any = {}) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPrevious(options);
    } else {
        return musicCtr.run(player, "previous");
    }
}

/**
 * Turn on/off repeat for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
export function setRepeat(player: PlayerName, repeat: boolean) {
    let repeatParam = repeat ? "repeatOn" : "repeatOff";
    return musicCtr.run(player, repeatParam);
}

/**
 * Turn on/off shuffling for a given player
 * @param player {spotify|spotify-web|itunes}
 */
export function setShuffle(player: PlayerName, shuffle: boolean) {
    let shuffleParam = shuffle ? ["true"] : ["false"];
    return musicCtr.run(player, "setShuffling", shuffleParam);
}

/**
 * Return whether shuffling is on or not
 * @param player {spotify|spotify-web|itunes}
 */
export async function isShuffling(player: PlayerName) {
    const val = await musicCtr.run(player, "isShuffling");
    if (musicUtil.isBooleanString(val)) {
        return JSON.parse(val);
    }
    return val;
}

/**
 * Returns whether the player is on repeat or not
 * - spotify returns true or false, and itunes returns "off", "one", "all"
 * @param player {spotify|spotify-web|itunes}
 */
export async function isRepeating(player: PlayerName) {
    let val = await musicCtr.run(player, "isRepeating");
    if (musicUtil.isBooleanString(val)) {
        return JSON.parse(val);
    }
    return val;
}

/**
 * Update the players volume
 * @param player {spotify|spotify-web|itunes}
 * @param volume {0-100}
 */
export function setVolume(player: PlayerName, volume: number) {
    return musicCtr.setVolume(player, volume);
}

/**
 * Increments the players volume by a number
 * @param player {spotify|spotify-web|itunes}
 */
export function volumeUp(player: PlayerName) {
    return musicCtr.run(player, "volumeUp");
}

/**
 * Decrements the players volume by a number
 * @param player {spotify|spotify-web|itunes}
 */
export function volumeDown(player: PlayerName) {
    return musicCtr.run(player, "volumeDown");
}
/**
 * Mutes the players volume
 * @param player {spotify|spotify-web|itunes}
 */
export function mute(player: PlayerName) {
    return musicCtr.run(player, "mute");
}

/**
 * Unmutes the players volume
 * @param player {spotify|spotify-web|itunes}
 */
export function unmute(player: PlayerName) {
    return musicCtr.run(player, "unMute");
}

/**
 * Unmutes the players volume
 * @param player {spotify|spotify-web|itunes}
 */
export function setItunesLoved(loved: boolean) {
    return musicCtr.setItunesLoved(loved);
}

/**
 * Returns the playlists for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param (optional) {limit, offset}
 */
export async function getPlaylists(
    player: PlayerName,
    qsOptions: any = {}
): Promise<PlaylistItem[]> {
    let playlists: PlaylistItem[] = [];
    if (player === PlayerName.SpotifyWeb) {
        playlists = await playlist.getPlaylists(qsOptions);
    } else {
        let result = await musicCtr.run(player, "playlistTrackCounts");
        if (result) {
            try {
                if (result.indexOf("[TRACK_END],") !== -1) {
                    result = result.split("[TRACK_END],");
                } else {
                    result = result.split("[TRACK_END]");
                }
                if (result && result.length > 0) {
                    for (let i = 0; i < result.length; i++) {
                        let resultItem = result[i];
                        if (resultItem && resultItem.trim().length > 0) {
                            try {
                                // {name, count}
                                let item = JSON.parse(resultItem.trim());
                                let playlistItem: PlaylistItem = new PlaylistItem();
                                playlistItem.public = true;
                                playlistItem.name = item.name;
                                playlistItem.id = item.name;
                                playlistItem.tracks.total = item.count;
                                playlists.push(playlistItem);
                            } catch (err) {
                                //
                            }
                        }
                    }
                }
            } catch (err) {
                //
            }
        }
    }

    return playlists;
}

/**
 * Get the full list of the playlist names for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param qsOptions (optional) {limit, offset}
 */
export async function getPlaylistNames(
    player: PlayerName,
    qsOptions: any = {}
): Promise<string[]> {
    if (player === PlayerName.SpotifyWeb) {
        return playlist.getPlaylistNames(qsOptions);
    }
    // result will string of playlist names separated by a comma
    let result = await musicCtr.run(player, "playlistNames");
    // trim the names just in case
    if (result) {
        result = result.split(",");
        // now trim
        result = result.map((name: string) => {
            return name.trim();
        });
    }

    return result;
}

/**
 * Launches a player device
 * @param playerName {spotify|spotify-web|itunes}
 * @param options (spotify-web only) {playlist_id | album_id | track_id }
 */
export function launchPlayer(playerName: PlayerName, options: any = {}) {
    if (playerName === PlayerName.SpotifyWeb) {
        return musicPlayerCtr.launchWebPlayer(options);
    } else {
        return musicCtr.startPlayer(playerName);
    }
}

/**
 * Returns available Spotify devices
 * @returns {Promise<PlayerDevice[]>}
 */
export function getSpotifyDevices(): Promise<PlayerDevice[]> {
    return musicPlayerCtr.getSpotifyDevices();
}

/**
 * Returns the genre for a provided arguments
 * @param artist {string} is required
 * @param songName {string} is optional
 */
export function getGenre(
    artist: string,
    songName: string = ""
): Promise<string> {
    return musicCtr.getGenre(artist, songName);
}

/**
 * Returns the spotify genre for a provided arguments
 * @param artist {string} is required
 */
export function getSpotifyGenre(artist: string): Promise<string> {
    return musicCtr.getGenreFromSpotify(artist);
}

/**
 * Returns the audio features of the given track IDs
 * @param ids these are the track ids (sans spotify:track)
 */
export function getSpotifyAudioFeatures(
    ids: string[]
): Promise<SpotifyAudioFeature[]> {
    return audioStat.getSpotifyAudioFeatures(ids);
}

/**
 * Create a playlist for a Spotify user. (The playlist will be empty until you add tracks.)
 * @param name the name of the playlist you want to create
 * @param isPublic if the playlist will be public or private
 * @param description (Optioal) displayed in Spotify Clients and in the Web API
 */
export function createPlaylist(
    name: string,
    isPublic: boolean,
    description: string = ""
) {
    return playlist.createPlaylist(name, isPublic, description);
}

/**
 * Deletes a playlist of a given playlist ID.
 * @param playlist_id
 */
export function deletePlaylist(playlist_id: string) {
    return playlist.deletePlaylist(playlist_id);
}

/**
 * Replace tracks of a given playlist. This will wipe out
 * the current set of tracks and add the tracks specified.
 * @param playlist_id
 * @param track_ids
 */
export function replacePlaylistTracks(
    playlist_id: string,
    track_ids: string[]
) {
    return playlist.replacePlaylistTracks(playlist_id, track_ids);
}

/**
 * Add tracks to a given Spotify playlist.
 * @param playlist_id the Spotify ID for the playlist
 * @param tracks Tracks should be the uri (i.e. "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
 * but if it's only the id (i.e. "4iV5W9uYEdYUVa79Axb7Rh") this will add
 * the uri part "spotify:track:"
 * @param position The position to insert the tracks, a zero-based index.
 */
export function addTracksToPlaylist(
    playlist_id: string,
    tracks: string[],
    position: number = 0
) {
    return playlist.addTracksToPlaylist(playlist_id, tracks, position);
}

/**
 * Remove tracks from a given Spotify playlist.
 * @param playlist_id the Spotify ID for the playlist
 * @param tracks Tracks should be the uri (i.e. "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
 * but if it's only the id (i.e. "4iV5W9uYEdYUVa79Axb7Rh") this will add
 * the uri part "spotify:track:"
 */
export function removeTracksFromPlaylist(
    playlist_id: string,
    tracks: string[]
) {
    return playlist.removeTracksFromPlaylist(playlist_id, tracks);
}

/**
 * Deprecated - use "getTrack(player)"
 */
export function getPlayerState(player: PlayerName): Promise<Track> {
    return getTrack(player);
}

/**
 * Deprecated - use "getRunningTrack()" instead
 */
export function getCurrentlyRunningTrackState(): Promise<Track> {
    return getRunningTrack();
}

/**
 * Deprecated - please use "getPlayerState"
 */
export function getState(player: PlayerName): Promise<Track> {
    return getTrack(player);
}

/**
 * Deprecated - please use "launchPlayer('spotify')"
 **/
export function startSpotifyIfNotRunning() {
    return musicCtr.launchApp(PlayerName.SpotifyDesktop);
}

/**
 * Deprecated - please use "launchPlayer('itunes')"
 */
export function startItunesIfNotRunning() {
    return musicCtr.launchApp(PlayerName.ItunesDesktop);
}

/**
 * Deprecated - please use "isSpotifyRunning" or "isItunesRunning"
 */
export function isRunning(player: PlayerName): Promise<boolean> {
    return isPlayerRunning(player);
}

/**
 * Deprecated - please use "setRepat(player, repeat)"
 */
export function repeatOn(player: PlayerName) {
    return setRepeat(player, true);
}

/**
 * Deprecated - please use "setRepat(player, repeat)"
 */
export function repeatOff(player: PlayerName) {
    return setRepeat(player, false);
}

/**
 * Deprecated - please use "unmute(player)"
 */
export function unMute(player: PlayerName) {
    return unmute(player);
}
