# cody-music

Control Mac desktop Spotify and iTunes, or Spotify devices via your access and refresh token.

Also provides various Spotify and iTunes search, audio features, and playlist APIs. More coming soon.

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
import * as music from "cody-music";
```

OR

```javascript
const music = require("cody-music");
```

## API

### playTrack(uri)

Play a track with Music URI `uri`.

Specify either "Spotify" or "iTunes" (case-insensitive).

```javascript
// get the track info using get state
await music.getPlayerState("iTunes").then(state => {
    // - "genre" will be empty from Spotify
    // - duration is in milliseconds
    // {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
    console.log(state);
});

// play a specific spotify track
await music
    .playTrack("Spotify", "spotify:track:2YarjDYjBJuH63dUIh9OWv")
    .then(result => {
        // track is playing
    });

// play an iTunes track number
await music.playTrack("iTunes", 1).then(result => {
    // track is playing
});

// handling errors
await music.playTrack("iTunes", 1000000000).then(result => {
    // result will contain the "error" attribute with the error message
    if (result.error) {
        console.log(`Unable to play track, error: ${result.error}`);
    }
});
```

Full set of APIs

```js
/**
 * Set Credentials (currently only supports Spotify)
 * Accepted credentials: clientId, clientSecret, refreshToken, accessToken
 * @param credentials
 */
setCredentials(credentials: any)

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
 * Returns the player state and track of a given player {spotify|spotify-web|itunes}
 * - Spotify does not return a "genre"
 * - duration is in milliseconds
 * @param player {spotify|spotif-web|itunes}
 * @returns {artist, album, genre, disc_number, duration, played_count, track_number, id, name, state}
 */
getPlayerState(player: PlayerName): Promise<TrackState>

/**
 * Returns the currently running track info (player and track).
 * This only supports returning the state for itunes and spotify desktop
 * on Mac and spotify desktop on windows.
 * Deprecated - use "getState(player:PlayerName)" instead
 */
getCurrentlyRunningTrackState(): Promise<TrackState>

/**
 * Returns the tracks that are found by the given playlist name
 * @param player {spotify|spotify-web|itunes}
 * @param playListName {}
 */
getTracksByPlaylistName(player: PlayerName,playListName: string)

/**
 * Plays a specific track on the Spotify or iTunes desktop
 * @param player
 * @param params (e.g. ["spotify:track:0R8P9KfGJCDULmlEoBagcO", "spotify:album:6ZG5lRT77aJ3btmArcykra"]
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
play(player: PlayerName, options: any)

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
pause(player: PlayerName, options: any)

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
next(player: PlayerName, options: any)

/**
 * Initiate the previous command for a given player
 * @param player {spotify|spotify-web|itunes}
 * @param options
 */
previous(player: PlayerName, options: any)

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
 * Get the full list of the playlist names for a given player
 * @param player {spotify|spotify-web|itunes}
 */
getPlaylistNames(player: PlayerName)

/**
 * Launches a player device
 * @param playerName {spotify|spotify-web|itunes}
 * @param options
 */
launchPlayer(playerName: PlayerName, options: any)

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

//
// Deprecated functions
//

// deprecated, please use "getPlayerState"
getState(player: PlayerName): Promise<TrackState>

// deprecated, please use "launchPlayer('spotify')"
startSpotifyIfNotRunning()

// deprecated, please use "launchPlayer('itunes')"
startItunesIfNotRunning()

// deprecated, please use "isSpotifyRunning" or "isItunesRunning"
isRunning(player: PlayerName): Promise<boolean>

// deprecated, pluse use "setRepat(player, repeat)"
repeatOn(player: PlayerName)

// deprecated, pluse use "setRepat(player, repeat)"
repeatOff(player: PlayerName)

// deprecated, pluse use "unmute(player)"
unMute(player: PlayerName)
```

## Contributors

-   [Cody](https://github.com/codyxio)

## License
