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
    CodyConfig,
    PaginationItem,
    PlayerContext,
    TrackStatus,
    SpotifyAuthState,
} from "./models";
import { MusicPlayerState } from "./playerstate";
import { AudioStat } from "./audiostat";
import { MusicStore } from "./store";
import { MusicUtil } from "./util";
import { Playlist } from "./playlist";
import { UserProfile, SpotifyUser } from "./profile";

// get the instances
const musicCtr = MusicController.getInstance();
const musicPlayerCtr = MusicPlayerState.getInstance();
const musicStore = MusicStore.getInstance();
const musicUtil = new MusicUtil();
const audioStat = AudioStat.getInstance();
const playlist = Playlist.getInstance();
const userProfile = UserProfile.getInstance();

/**
 * Initialize/set music credentials and settings
 * @param config <CodyConfig>
 */
export function setConfig(config: CodyConfig) {
    musicStore.setConfig(config);
}

/**
 * Valid types are: album, artist, playlist, and track
 * keywords: send the keywords to search against.
 * Use specific filter name if you want to search against certain
 * fields.
 * Example searchTracks("track:what a time artist:tom")
 *
 * @param string
 * @param limit (min of 1 and a max of 50)
 */
export function searchTracks(keywords: string, limit: number = 50) {
    return playlist.search("track", keywords, limit);
}

/**
 * Valid types are: album, artist, playlist, and track
 * keywords: send the keywords to search against.
 * Use specific filter name if you want to search against certain
 * fields.
 * Example searchTracks("track:what a time artist:tom")
 *
 * @param string
 * @param limit (min of 1 and a max of 50)
 */
export function searchArtists(keywords: string, limit: number = 50) {
    return playlist.search("artist", keywords, limit);
}

/**
 * Returns true if the user has granted Mac OS access for iTunes control
 */
export function isItunesAccessGranted() {
    return musicStore.itunesAccessGranted;
}

/**
 * Returns false if cody music has been configured to to disable it
 * or if it's the OS is not Mac,
 * otherwise it's set to true by default
 */
export function isItunesDesktopEnabled() {
    return musicStore.itunesDesktopEnabled;
}

/**
 * Returns false if cody music has been configured to to disable it
 * or if it's the OS is not Mac,
 * otherwise it's set to true by default
 */
export function isItunesDesktopSongTrackingEnabled() {
    return musicStore.itunesDesktopTrackingEnabled;
}

/**
 * Get the Spotify accessToken provided via through the setConfig api
 * @returns {string} the spotify access token string
 */
export function getSpotifyAccessToken() {
    return musicStore.credentialByKey("spotifyAccessToken");
}

/**
 * Returns false if cody music has been configured to to disable it,
 * otherwise it's set to true by default
 */
export function isSpotifyDesktopEnabled() {
    return musicStore.spotifyDesktopEnabled;
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
        let state = await musicCtr.run(player, "checkPlayerRunningState");
        try {
            return JSON.parse(state);
        } catch (err) {
            return false;
        }
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
 * Returns the recommended tracks.
 * @param trackIds (optional) track IDs or URIs (5 max)
 * @param limit (optional) will default to 40 if not specified
 * @param market (optional) will default to none if not specified
 * @param min_popularity (optional) will default to a min or 20
 * @param target_popularity (optional) will default to 90
 * @param seed_genres (optional) the supported spotify genres (5 max)
 * @param seed_genres (optional) artist IDs or URIs (5 max)
 * @param features (optional) supports the tunable track attributes using min_*, max_*, and target_*
 *   i.e. {max_valence: 0.3, target_valence: 0.1}
 */
export async function getRecommendationsForTracks(
    trackIds: string[] = [],
    limit: number = 40,
    market: string = "",
    min_popularity: number = 20,
    target_popularity: number = 100,
    seed_genres: string[] = [],
    seed_artists: string[] = [],
    features: any = {}
): Promise<Track[]> {
    return musicPlayerCtr.getRecommendationsForTracks(
        trackIds,
        limit,
        market,
        min_popularity,
        target_popularity,
        seed_genres,
        seed_artists,
        features
    );
}

/**
 * Returns the currently running track.
 * Spotify web, desktop, or itunes desktop.
 * If it finds a spotify device but it's not playing, and mac iTunes is not playing
 * or paused, then it will return the Spotify track.
 * It will return an empty Track object if it's unable to
 * find a running track.
 * @returns {Promise<Track>}
 **/
export async function getRunningTrack(): Promise<Track> {
    let spotifyWebTrack = null;

    // spotify web try
    // 1st try spotify web
    if (musicStore.spotifyApiEnabled) {
        spotifyWebTrack = await getTrack(PlayerName.SpotifyWeb);
        // check if the spotify track is running (playing or paused)
        let spotifyWebTrackRunning = musicUtil.isTrackRunning(spotifyWebTrack);

        // if it's playing then return it
        if (
            spotifyWebTrackRunning &&
            spotifyWebTrack.state === TrackStatus.Playing
        ) {
            // spotify web track is running. it's the highest priority track
            return spotifyWebTrack;
        }
    }

    let spotifyDesktopTrack = null;
    // spotify desktop try
    if (musicStore.spotifyDesktopEnabled) {
        // next try spotify desktop
        const spotifyDesktopRunning = await isPlayerRunning(
            PlayerName.SpotifyDesktop
        );
        if (spotifyDesktopRunning) {
            spotifyDesktopTrack = await getTrack(PlayerName.SpotifyDesktop);
            const isSpotifyDesktopRunning = musicUtil.isTrackRunning(
                spotifyDesktopTrack
            );
            if (
                isSpotifyDesktopRunning &&
                spotifyDesktopTrack.state === TrackStatus.Playing
            ) {
                spotifyDesktopTrack["playerType"] =
                    PlayerType.MacSpotifyDesktop;
                return spotifyDesktopTrack;
            }
        }
    }

    let itunesDesktopTrack = null;
    // itunes desktop try
    if (
        musicStore.itunesDesktopTrackingEnabled &&
        musicStore.itunesAccessGranted
    ) {
        // still no track or it's paused, try itunes desktop
        const itunesDesktopRunning = await isPlayerRunning(
            PlayerName.ItunesDesktop
        );

        if (itunesDesktopRunning) {
            itunesDesktopTrack = await getTrack(PlayerName.ItunesDesktop);
            if (itunesDesktopTrack && !itunesDesktopTrack.id) {
                // get the 1st track
                itunesDesktopTrack = await musicCtr.run(
                    PlayerName.ItunesDesktop,
                    "firstTrackState"
                );
                if (
                    typeof itunesDesktopTrack === "string" &&
                    itunesDesktopTrack.includes("GRANT_ERROR")
                ) {
                    const errorStr = itunesDesktopTrack;
                    itunesDesktopTrack = new Track();
                    itunesDesktopTrack.error = errorStr;
                } else if (itunesDesktopTrack) {
                    try {
                        itunesDesktopTrack = JSON.parse(itunesDesktopTrack);
                        if (itunesDesktopTrack) {
                            itunesDesktopTrack["playerType"] =
                                PlayerType.MacItunesDesktop;
                        }
                    } catch (e) {
                        //
                    }
                }
            }

            // if itunes is not running, return the spotify web track we've gathered
            const isItunesTrackRunning = musicUtil.isTrackRunning(
                itunesDesktopTrack
            );

            if (
                isItunesTrackRunning &&
                itunesDesktopTrack.state === TrackStatus.Playing
            ) {
                // itunes track is playing, return it
                return itunesDesktopTrack;
            }
        }
    }

    // nothing is playing, check if any are paused in the following order
    // 1) spotify web
    // 2) spotify desktop
    // 3) itunes desktop
    if (spotifyWebTrack && spotifyWebTrack.state == TrackStatus.Paused) {
        return spotifyWebTrack;
    } else if (
        spotifyDesktopTrack &&
        spotifyDesktopTrack.state === TrackStatus.Paused
    ) {
        return spotifyDesktopTrack;
    } else if (
        itunesDesktopTrack &&
        itunesDesktopTrack.state === TrackStatus.Paused
    ) {
        return itunesDesktopTrack;
    }

    return new Track();
}

/**
 * Fetch the recently played spotify tracks
 * @param limit - The maximum number of items to return. Default: 50. Minimum: 1. Maximum: 50
 */
export async function getSpotifyRecentlyPlayedTracks(
    limit: number = 50
): Promise<Track[]> {
    return musicPlayerCtr.getSpotifyRecentlyPlayedTracks(limit);
}

/**
 * Fetch the recently played spotify tracks
 * @param limit - The maximum number of items to return. Default: 50. Minimum: 1. Maximum: 50
 * @param before - Returns all items before (but not including) this cursor position
 */
export async function getSpotifyRecentlyPlayedBefore(
    limit: number = 50,
    before: number = 0
): Promise<Track[]> {
    return musicPlayerCtr.getSpotifyRecentlyPlayedTracksBefore(limit, before);
}

/**
 * Fetch the recently played spotify tracks
 * @param limit - The maximum number of items to return. Default: 50. Minimum: 1. Maximum: 50
 * @param after - Returns all items before (but not including) this cursor position
 */
export async function getSpotifyRecentlyPlayedAfter(
    limit: number = 50,
    after: number = 0
): Promise<Track[]> {
    return musicPlayerCtr.getSpotifyRecentlyPlayedTracksAfter(limit, after);
}

/**
 * Fetch the spotify player context
 * Info about the device, is playing state, etc.
 */
export async function getSpotifyPlayerContext(): Promise<PlayerContext> {
    return musicPlayerCtr.getSpotifyPlayerContext(true);
}

/**
 * Returns a track by the given spotify track id
 * @param id
 * @param includeFullArtistData (optional - if true it will return full artist info)
 * @package includeAudioFeaturesData (optional)
 * @param includeGenre (optional)
 */
export async function getSpotifyTrackById(
    id: string,
    includeFullArtistData: boolean = false,
    includeAudioFeaturesData: boolean = false,
    includeGenre: boolean = false
): Promise<Track> {
    return musicPlayerCtr.getSpotifyTrackById(
        id,
        includeFullArtistData,
        includeAudioFeaturesData,
        includeGenre
    );
}

/**
 * Returns tracks by the given spotify track ids
 * @param ids
 * @param includeFullArtistData (optional - if true it will return full artist info)
 * @package includeAudioFeaturesData (optional)
 * @param includeGenre (optional)
 */
export async function getSpotifyTracks(
    ids: string[],
    includeFullArtistData: boolean = false,
    includeAudioFeaturesData: boolean = false,
    includeGenre: boolean = false
): Promise<Track[]> {
    return musicPlayerCtr.getSpotifyTracks(
        ids,
        includeFullArtistData,
        includeAudioFeaturesData,
        includeGenre
    );
}

/**
 * Returns the track of a given player {spotify|spotify-web|itunes}
 * - Spotify does not return a "genre"
 * - duration is in milliseconds
 * @param player {spotify|spotif-web|itunes}
 * @returns {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
 */
export async function getTrack(player: PlayerName): Promise<Track> {
    let track: any;
    if (player === PlayerName.SpotifyWeb) {
        // fetch the web track
        track = await musicPlayerCtr.getSpotifyWebCurrentTrack();
    } else {
        // get the string representation of the track.
        // fetch the track from the specified player name.
        // first check to see if the app is running before checking
        const running = await isPlayerRunning(player);
        if (running) {
            track = await musicCtr.run(player, "state");
            if (track) {
                try {
                    track = JSON.parse(track);
                    if (track) {
                        if (player === PlayerName.ItunesDesktop) {
                            track.playerType = PlayerType.MacItunesDesktop;
                        } else {
                            track.playerType = PlayerType.MacSpotifyDesktop;
                        }
                    }
                } catch (e) {}
            }
        }
    }

    if (!track) {
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
    /**
     * result will have ...
     * '38':
        { artist: 'ZAYN',
            album: 'Dusk Till Dawn (feat. Sia) [Radio Edit] - Single',
            duration: 239000,
            played_count: 260,
            name: 'Dusk Till Dawn (feat. Sia) [Radio Edit]',
            id: '6680' },
     */
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
 * Currently only returns Spotify Web tracks not associated with a playlist.
 * @param player
 * @param qsOptions
 */
export async function getSpotifyLikedSongs(
    qsOptions: any = {}
): Promise<Track[]> {
    return getSavedTracks(PlayerName.SpotifyWeb, qsOptions);
}

/**
 * Currently only returns Spotify Web tracks not associated with a playlist.
 * @param player
 * @param qsOptions
 */
export async function getSavedTracks(
    player: PlayerName,
    qsOptions: any = {}
): Promise<Track[]> {
    let tracks: Track[] = [];
    if (player === PlayerName.SpotifyWeb) {
        tracks = await playlist.getSavedTracks(qsOptions);
    }
    return tracks;
}

/**
 * Returns a playlist by ID
 * @param playlist_id ID is preferred, but we'll transform a URI to an ID
 */
export async function getSpotifyPlaylist(
    playlist_id: string
): Promise<PlaylistItem> {
    return playlist.getSpotifyPlaylist(playlist_id);
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
 * Plays a playlist at the beginning if the starting track id is not provided.
 * @param playlistId either the ID or URI of the playlist
 * @param startingTrackId either the ID or URI of the track
 * @param deviceId
 */
export function playSpotifyPlaylist(
    playlistId: string,
    startingTrackId: string = "",
    deviceId: string = ""
) {
    return musicCtr.spotifyWebPlayPlaylist(
        playlistId,
        startingTrackId,
        deviceId
    );
}

/**
 * Plays a specific track on the Spotify or iTunes desktop
 * @param player
 * @param params
 * spotify example  ["spotify:track:0R8P9KfGJCDULmlEoBagcO", "spotify:album:6ZG5lRT77aJ3btmArcykra"]
 *   -- provide the trackID then the album or playlist ID
 *   -- they can either be in either URI or ID format
 * itunes example   ["Let Me Down Slowly", "MostRecents"]
 *   -- provide the track name then the playlist name
 */
export function playTrackInContext(player: PlayerName, params: any[]) {
    return musicCtr.playTrackInContext(player, params);
}

/**
 * Mac iTunes only
 * This will allow you to play a playlist starting at a specific playlist track number.
 */
export function playItunesTrackNumberInPlaylist(
    playlistName: string,
    trackNumber: number
) {
    const emptyParams: any = [];
    const scriptArgs: any = [playlistName, trackNumber];
    return musicCtr.run(
        PlayerName.ItunesDesktop,
        "playTrackNumberInPlaylist",
        emptyParams,
        scriptArgs
    );
}

/**
 * Quits/closes the mac Spotify or iTunes player
 * @param player
 */
export function quitMacPlayer(player: PlayerName) {
    return musicCtr.quitApp(player);
}

/**
 * This is only meant for Mac iTunes or Mac Spotify desktop
 * @param player
 * @param params
 */
export async function playTrackInLibrary(player: PlayerName, params: any[]) {
    return await musicCtr.run(player, "playSongFromLibrary", params);
}

/**
 * Initiate and play the specified Spotify device
 * @param device_id {string}
 */
export function playSpotifyDevice(device_id: string) {
    return musicCtr.playPauseSpotifyDevice(device_id, true);
}

/**
 * Initiate and play the specified Spotify device
 * @param device_id {string}
 * @param play {boolean} true to play and false to keep current play state
 */
export function transferSpotifyDevice(device_id: string, play: boolean) {
    return musicCtr.playPauseSpotifyDevice(device_id, play);
}

/**
 * Fetch the user's profile
 */
export function getUserProfile(): Promise<SpotifyUser> {
    return userProfile.getUserProfile();
}

/**
 * Helper API to return whether or not the user is logged in to their spotify account or not.
 * It's not fool proof as it only determines if there are any devices found or not.
 * {oauthActivated, loggedIn}
 */
export function spotifyAuthState(): Promise<SpotifyAuthState> {
    return userProfile.spotifyAuthState();
}

/**
 * Initiate the play command for a specific player
 * @param player {spotify|spotify-web|itunes}
 * @param options { uris, device_id }
 * example
 * -- the uris can be in either URI or ID format
 * {device_id: <spotify_device_id>, uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"], context_uri: <playlist_uri, album_uri>}
 */
export function play(player: PlayerName, options: any = {}) {
    if (player === PlayerName.SpotifyWeb) {
        return musicCtr.spotifyWebPlay(options);
    } else {
        return musicCtr.run(player, "play");
    }
}

/**
 * Play a specific spotify track by trackId (it can be the URI or the ID)
 * @param trackId
 * @param deviceId (optional)
 */
export function playSpotifyTrack(trackId: string, deviceId: string = "") {
    return musicCtr.spotifyWebPlayTrack(trackId, deviceId);
}

/**
 * Initiate the play command for a given trackId for a specific player
 * @param player {spotify|spotify-web|itunes}
 * @param trackId {any (string|number)}
 */
export function playTrack(PlayerName: PlayerName, trackId: any) {
    return musicCtr.run(PlayerName, "playTrack", [trackId]);
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
 * Repeats a playlist
 * @param player
 * @param deviceId
 */
export function setRepeatPlaylist(player: PlayerName, deviceId: string = "") {
    if (player === PlayerName.SpotifyWeb) {
        return musicPlayerCtr.setPlaylistRepeat(deviceId);
    } else {
        return musicCtr.run(player, "repeatOn");
    }
}

/**
 * Repeats a track
 * @param player
 * @param deviceId
 */
export function setRepeatTrack(player: PlayerName, deviceId: string = "") {
    if (player === PlayerName.SpotifyWeb) {
        return musicPlayerCtr.setTrackRepeat(deviceId);
    } else {
        return musicCtr.run(player, "repeatOn");
    }
}

/**
 * Turn repeat off
 * @param player
 * @param deviceId
 */
export function setRepeatOff(player: PlayerName, deviceId: string = "") {
    if (player === PlayerName.SpotifyWeb) {
        return musicPlayerCtr.setRepeatOff(deviceId);
    } else {
        return musicCtr.run(player, "repeatOff");
    }
}

/**
 * Turn on/off repeat for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
export function setRepeat(
    player: PlayerName,
    repeat: boolean,
    deviceId: string = ""
) {
    if (
        player === PlayerName.SpotifyWeb ||
        (player === PlayerName.SpotifyDesktop && musicUtil.isWindows())
    ) {
        return musicPlayerCtr.updateRepeatMode(repeat, deviceId);
    } else {
        let repeatParam = repeat ? "repeatOn" : "repeatOff";
        return musicCtr.run(player, repeatParam);
    }
}

/**
 * Turn on/off shuffling for a given player
 * @param player {spotify|spotify-web|itunes}
 */
export function setShuffle(
    player: PlayerName,
    shuffle: boolean,
    deviceId: string = ""
) {
    if (player === PlayerName.SpotifyWeb) {
        // use spotify web api
        return musicPlayerCtr.setShuffle(shuffle, deviceId);
    } else {
        let shuffleParam = shuffle ? ["true"] : ["false"];
        return musicCtr.run(player, "setShuffling", shuffleParam);
    }
}

/**
 * Return whether shuffling is on or not
 * @param player {spotify|spotify-web|itunes}
 */
export async function isShuffling(player: PlayerName) {
    if (player === PlayerName.SpotifyWeb) {
        // use the web api
    }
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
export function mute(player: PlayerName, device_id: string = "") {
    if (player === PlayerName.SpotifyWeb) {
        return musicPlayerCtr.setMute(true, device_id);
    }
    return musicCtr.run(player, "mute");
}

/**
 * Unmutes the players volume
 * @param player {spotify|spotify-web|itunes}
 */
export function unmute(player: PlayerName, device_id: string = "") {
    if (player === PlayerName.SpotifyWeb) {
        return musicPlayerCtr.setMute(false, device_id);
    }
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
 * Save tracks to your liked playlist
 * @param trackIds (i.e. ["4iV5W9uYEdYUVa79Axb7Rh", "1301WleyT98MSxVHPZCA6M"])
 */
export function saveToSpotifyLiked(trackIds: string[]): Promise<CodyResponse> {
    return playlist.saveToSpotifyLiked(trackIds);
}

/**
 * Remove tracks from your liked playlist
 * @param trackIds (i.e. ["4iV5W9uYEdYUVa79Axb7Rh", "1301WleyT98MSxVHPZCA6M"])
 */
export function removeFromSpotifyLiked(
    trackIds: string[]
): Promise<CodyResponse> {
    return playlist.removeFromSpotifyLiked(trackIds);
}

/**
 * Returns the playlists for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param (optional) {limit, offset, all}
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
                                playlistItem.type = "playlist";
                                playlistItem.public = true;
                                playlistItem.name = item.name;
                                playlistItem.id = item.name;
                                playlistItem.tracks.total = item.count;
                                if (player === PlayerName.ItunesDesktop) {
                                    playlistItem.playerType =
                                        PlayerType.MacItunesDesktop;
                                } else {
                                    playlistItem.playerType =
                                        PlayerType.MacSpotifyDesktop;
                                }
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
        return musicCtr.startPlayer(playerName, options);
    }
}

/**
 * Plays a Spotify track within a playlist.
 * It will also launch Spotify if it is not already available by checking the device Ids.
 * @param trackId (optional) If it's not supplied then the playlistId must be provided
 * @param playlistId (optional) If it's not supplied then the trackId must be provided
 * @param playerName (optional) SpotifyWeb or SpotifyDesktop
 */
export function launchAndPlaySpotifyTrack(
    trackId: string = "",
    playlistId: string = "",
    playerName: PlayerName = PlayerName.SpotifyWeb
) {
    return musicPlayerCtr.launchAndPlaySpotifyTrack(
        trackId,
        playlistId,
        playerName
    );
}

/**
 * Plays a Spotify Mac Desktop track within a playlist.
 * It will also launch Spotify if it is not already available by checking the device Ids.
 * @param trackId (optional) If it's not supplied then the playlistId must be provided
 * @param playlistId (optional) If it's not supplied then the trackId must be provided
 */
export function playSpotifyMacDesktopTrack(
    trackId: string = "",
    playlistId: string = ""
) {
    musicCtr.playSpotifyDesktopTrack(trackId, playlistId);
}

/**
 * Returns available Spotify devices
 * @returns {Promise<PlayerDevice[]>}
 */
export function getSpotifyDevices(): Promise<PlayerDevice[]> {
    return musicPlayerCtr.getSpotifyDevices(true);
}

/**
 * Returns the genre for a provided arguments
 * @param artist {string} is required
 * @param songName {string} is optional
 * @param spotifyArtistId {string} is optional
 */
export function getGenre(
    artist: string,
    songName: string = "",
    spotifyArtistId: string = ""
): Promise<string> {
    return musicCtr.getGenre(artist, songName, spotifyArtistId);
}

/**
 * Returns the spotify genre for a provided arguments
 * @param artist {string} is required
 * @param spotifyArtistId {string} is optional
 */
export function getSpotifyGenre(artist: string): Promise<string> {
    return musicCtr.getGenreFromSpotify(artist);
}

/**
 * Returns the spotify genre for a provided arguments
 * @param spotifyArtistId {string} is required
 */
export function getSpotifyGenreByArtistId(
    spotifyArtistId: string
): Promise<string> {
    return musicCtr.getGenreFromSpotify("" /*artist name*/, spotifyArtistId);
}

/**
 * Returns the highest frequency single genre from the provided list
 * @param genreList
 */
export function getHighestFrequencySpotifyGenre(genreList: string[]): string {
    return musicCtr.getHighestFrequencySpotifyGenre(genreList);
}

/**
 * Returns the recent top tracks Spotify for a user.
 */
export function getTopSpotifyTracks(): Promise<Track[]> {
    return playlist.getTopSpotifyTracks();
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
): Promise<CodyResponse> {
    return playlist.createPlaylist(name, isPublic, description);
}

/**
 * Deletes a playlist of a given playlist ID.
 * @param playlist_id (uri or id)
 */
export function deletePlaylist(playlist_id: string): Promise<CodyResponse> {
    return playlist.deletePlaylist(playlist_id);
}

/**
 * Follow a playlist of a given playlist ID.
 * @param playlist_id (uri or id)
 */
export function followPlaylist(playlist_id: string): Promise<CodyResponse> {
    return playlist.followPlaylist(playlist_id);
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
 * Returns whether or not the spotify access token has been provided.
 * @returns <boolean>
 */
export function requiresSpotifyAccessInfo(): boolean {
    return !musicStore.hasSpotifyAccessToken() ? true : false;
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

/**
 * Deprecated - please use "setConfig(config: CodyConfig)"
 * Set Credentials (currently only supports Spotify)
 * Accepted credentials: clientId, clientSecret, refreshToken, accessToken
 * @param credentials
 */
export function setCredentials(credentials: any) {
    musicStore.setCredentials(credentials);
}

/**
 * Deprecated - please use "getSpotifyAccessToken()"
 * Get the accessToken provided via through the setCredentials api
 * @returns {string} the access token string
 */
export function getAccessToken() {
    return musicStore.credentialByKey("spotifyAccessToken");
}
