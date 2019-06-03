# cody-music

New updates include:

-   Interally setting "itunesAccessGranted"
    to true if the user has granted access to iTunes.

-   This is accessible via the api:

    -   isItunesAccessGranted()

-   Support to specify which players are enabled for lookup

-   Improved playlist model definition to provide a tree view structure

-   Set or update Spotify access or other settings using the CodyConfig with the following api:

    -   setConfig(codyConfig)

-   You can send all or partial settings updates

## Player control support

-   Mac Spotify and iTunes desktop
-   Spotify Web

## Spotify web API support

-   Audio features
-   Playlists
    (create, delete, fetch playlist tracks, replace playlist tracks)
-   Genre search
-   Spotify devices
-   Access token refresh retry

## iTunes API support

-   Genre search

More coming soon

## Installation

```
$ npm install cody-music
```

## Running unit tests

```
$ npm test
```

Load the module

```javascript
import {
    getRunningTrack,
    Track,
    PlayerType,
    TrackStatus,
    setCredentials } from "cody-music";

...

// update the CodyMusic spotify credentials and other settings
setConfig({
    spotifyAccessToken: <spotify_access_token>,
    spotifyRefreshToken: <spotify_refresh_token>;
    spotifyClientSecret: <spotify_client_secret>;
    spotifyClientId: <spotify_client_id>;
    enableItunesDesktop: <enable_itunes_desktop_track_lookup>;
    enableSpotifyDesktop: <enable_spotify_desktop_track_lookup>;
    enableSpotifyApi: <enable_spotify_api>;
});

const track:Track = await getRunningTrack();

if (track.state === TrackStatus.Playing) {
    // track is playing
}

if (track.playerType === PlayerType.WebSpotify) {
    // track running has been identified as your spotify web player
}

```

OR

```javascript
import * as CodyMusic from "cody-music";
```

OR

```javascript
const CodyMusic = require("cody-music");
```

## API

### playTrack(uri)

Play a track with Music URI `uri`.

Specify either "Spotify" or "iTunes" (case-insensitive).

```javascript
// get the track info using get state
await CodyMusic.getRunningTrack().then((track: Track) => {
    // - "genre" will be empty from Spotify
    // - duration is in milliseconds
    // {artist, album, genre, disc_number, duration, played_count, track_number, id, loved, name, state, volume}
});

// play a specific spotify track
await CodyMusic.playTrack(
    "spotify",
    "spotify:track:2YarjDYjBJuH63dUIh9OWv"
).then(result => {
    // track is playing
});

// play an iTunes track number
await CodyMusic.playTrack("itunes", 1).then(result => {
    // track is playing
});

// handling errors
await CodyMusic.playTrack("spotify", 1000000000).then(result => {
    // result will contain the "error" attribute with the error message
    if (result.error) {
        console.log(`Unable to play track, error: ${result.error}`);
    }
});
await CodyMusic.getRunningTrack().then(result => {
    // result will be the best effort track that is playing.
    // i.e. if you have your itunes app running, it would show you that track
});
```

Full set of APIs

```js
/**
 * Initialize/set music credentials and settings
 * @param config <CodyConfig>
 */
setConfig(config: CodyConfig)

/**
 * Get the accessToken provided via through the setCredentials api
 * @returns {string} the access token string
 */
getAccessToken()

/**
 * Checks if the Spotify desktop or web player is running or not
 * @returns {Promise<boolean>}
 */
isSpotifyRunning(): Promise<boolean>

/**
 * Checks if the iTunes desktop player is running or not
 * @returns {Promise<boolean>}
 */
isItunesRunning(): Promise<boolean>

/**
 * Checks if one of the specified players is running
 * @param player {spotify|spotify-web|itunes}
 * @returns {Promise<boolean>}
 */
isPlayerRunning(player: PlayerName): Promise<boolean>

/**
 * Returns whether there's an active track,
 * (spotify web, spotify desktop, or itunes desktop)
 * @returns {Promise<boolean>}
 */
hasActiveTrack(): Promise<boolean>

/**
 * Returns the player state and track of a given player {spotify|spotify-web|itunes}
 * - Spotify does not return a "genre"
 * - duration is in milliseconds
 * @param player {spotify|spotif-web|itunes}
 * @returns {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
 */
getTrack(player: PlayerName): Promise<Track>

/**
 * Returns the currently running track.
 * Spotify web, desktop, or itunes desktop.
 **/
getRunningTrack(): Promise<Track>

/**
 * Returns the tracks that are found by the given playlist name
 * @param player {spotify|spotify-web|itunes}
 * @param playListName
 */
getTracksByPlaylistName(player: PlayerName,
    playListName: string): Promise<PlaylistItem[]>

/**
 * Returns the tracks that are found by the given playlist name
 * CodyResponse.data will contain <PaginationItem>
 *  - PaginationItem contains
 *    {tracks:Track[], offset, next, previous, limit, total}
 * @param player {spotify|spotify-web|itunes}
 * @param playlist_id
 * @param qsOptions (optional) {offset, limit}
 */
getPlaylistTracks(player: PlayerName,
    playlist_id: string,
    qsOptions: any = {}): Promise<CodyResponse>

/**
 * Plays a specific track on the Spotify or iTunes desktop
 * @param player
 * @param params
 *    * spotify example  ["spotify:track:0R8P9KfGJCDULmlEoBagcO", "spotify:album:6ZG5lRT77aJ3btmArcykra"]
 *      -- provice the trackID then the album or playlist ID
 *    * itunes example   ["Let Me Down Slowly", "MostRecents"]
 *      -- provide the track name then the playlist name
 */
playTrackInContext(player: PlayerName, params: any[])

/**
 * Initiate and play the specified Spotify device
 * @param device_id {string}
 * @param play {boolean}
 */
playSpotifyDevice(device_id: string)

/**
 * Initiate the play command for a specific player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
play(player: PlayerName, options: any = {})

/**
 * Initiate the play command for a given trackId for a specific player
 * @param player {spotify|spotify-web|itunes}
 * @param trackId {string}
 */
playTrack(player: PlayerName, trackId: string)

/**
 * Initiate the pause command for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
pause(player: PlayerName, options: any = {})

/**
 * Initiate the play/pause command for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
playPause(player: PlayerName)

/**
 * Initiate the next command for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
next(player: PlayerName, options: any = {})

/**
 * Initiate the previous command for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
previous(player: PlayerName, options: any = {})

/**
 * Turn on/off repeat for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
setRepeat(player: PlayerName, repeat: boolean)

/**
 * Turn on/off shuffling for a given player
 * @param player {spotify|spotify-web|itunes}
 */
setShuffle(player: PlayerName, shuffle: boolean)

/**
 * Return whether shuffling is on or not
 * @param player {spotify|spotify-web|itunes}
 */
isShuffling(player: PlayerName)

/**
 * Returns whether the player is on repeat or not
 * - spotify returns true or false, and itunes returns "off", "one", "all"
 * @param player {spotify|spotify-web|itunes}
 */
isRepeating(player: PlayerName)

/**
 * Update the players volume
 * @param player {spotify|spotify-web|itunes}
 * @param volume {0-100}
 */
setVolume(player: PlayerName, volume: number)

/**
 * Increments the players volume by a number
 * @param player {spotify|spotify-web|itunes}
 * @param volume {0-100}
 */
volumeUp(player: PlayerName, volume: number)

/**
 * Decrements the players volume by a number
 * @param player {spotify|spotify-web|itunes}
 * @param volume {0-100}
 */
volumeDown(player: PlayerName, volume: number)

/**
 * Mutes the players volume
 * @param player {spotify|spotify-web|itunes}
 */
mute(player: PlayerName)

/**
 * Unmutes the players volume
 * @param player {spotify|spotify-web|itunes}
 */
unmute(player: PlayerName)

/**
 * Unmutes the players volume
 * @param player {spotify|spotify-web|itunes}
 */
setItunesLoved(loved: boolean)

/**
 * Returns the playlists for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param (optional) {limit, offset}
 */
getPlaylists(
    player: PlayerName,
    qsOptions: any = {}
): Promise<PlaylistItem[]>

/**
 * Get the full list of the playlist names for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param (optional) {limit, offset}
 */
getPlaylistNames(player: PlayerName, qsOptions: any = {}):Promise<string[]>

/**
 * Launches a player device
 * @param playerName {spotify|spotify-web|itunes}
 * @param options (spotify-web only) {playlist_id | album_id | track_id }
 */
launchPlayer(playerName: PlayerName, options: any = {})

/**
 * Returns available Spotify devices
 * @returns {Promise<PlayerDevice[]>}
 */
getSpotifyDevices(): Promise<PlayerDevice[]>

/**
 * Returns the genre for a provided arguments
 * @param artist {string} is required
 * @param songName {string} is optional
 */
getGenre(artist: string, songName: string = ""): Promise<string>

/**
 * Returns the spotify genre for a provided arguments
 * @param artist {string} is required
 */
getSpotifyGenre(artist: string): Promise<string>

/**
 * Returns the audio features of the given track IDs
 * @param ids these are the track ids (sans spotify:track)
 */
getSpotifyAudioFeatures(ids: string[]): Promise<SpotifyAudioFeature[]>

/**
 * Create a playlist for a Spotify user. (The playlist will be empty until you add tracks.)
 * @param name the name of the playlist you want to create
 * @param isPublic if the playlist will be public or private
 * @param description (Optioal) displayed in Spotify Clients and in the Web API
 */
createPlaylist(name: string, isPublic: boolean, description: string = "")

/**
 * Deletes a playlist given a specified playlist ID.
 * @param playlist_id
 **/
deletePlaylist(playlist_id: string)

/**
 * Replace tracks of a given playlist. This will wipe out
 * the current set of tracks and add the tracks specified.
 * @param playlist_id
 * @param track_ids
 */
replacePlaylistTracks(
    playlist_id: string,
    track_ids: string[]
)

/**
 * Add tracks to a given Spotify playlist.
 * @param playlist_id the Spotify ID for the playlist
 * @param tracks Tracks should be the uri (i.e. "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
 * but if it's only the id (i.e. "4iV5W9uYEdYUVa79Axb7Rh") this will add
 * the uri part "spotify:track:"
 * @param position The position to insert the tracks, a zero-based index.
 */
addTracksToPlaylist(
    playlist_id: string,
    tracks: string[],
    position: number = 0
)

/**
 * Remove tracks from a given Spotify playlist.
 * @param playlist_id the Spotify ID for the playlist
 * @param tracks Tracks should be the uri (i.e. "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
 * but if it's only the id (i.e. "4iV5W9uYEdYUVa79Axb7Rh") this will add
 * the uri part "spotify:track:"
 */
removeTracksFromPlaylist(
    playlist_id: string,
    tracks: string[]
)

/**
 * Returns whether or not the spotify access token has been provided.
 * @returns <boolean>
 */
requiresSpotifyAccessInfo(): boolean
```

Deprecated APIs

```js
// deprecated, please use "getRunningTrack()"
getCurrentlyRunningTrackState(): Promise<Track>

// deprecated, please use "getTrack"
getPlayerState(player: PlayerName): Promise<Track>

// deprecated, please use "getTrack"
getState(player: PlayerName): Promise<Track>

// deprecated, please use "launchPlayer('spotify')"
startSpotifyIfNotRunning()

// deprecated, please use "launchPlayer('itunes')"
startItunesIfNotRunning()

// deprecated, please use "isSpotifyRunning" or "isItunesRunning"
isRunning(player: PlayerName): Promise<boolean>

// deprecated, please use "setRepat(player, repeat)"
repeatOn(player: PlayerName)

// deprecated, please use "setRepat(player, repeat)"
repeatOff(player: PlayerName)

// deprecated, please use "unmute(player)"
unMute(player: PlayerName)

// Deprecated, please use "setConfig(config: CodyConfig)"
setCredentials(credentials: any)
```

## Contributors

-   [Cody](https://github.com/codyxio)

## License
