# @software/music

Control Spotify and iTunes on Mac OSX with NodeJS.

## Installation

```
$ npm install @software/music
```

## Running unit tests

```
$ npm test
```

## API

### playTrack(uri)

Play a track with Music URI `uri`.

Specify either Spotify or iTunes, it's case-insensitive.

```javascript
const music = require("@software/music");

// play a specific spotify track
music
    .playTrack("Spotify", "spotify:track:2YarjDYjBJuH63dUIh9OWv")
    .then(result => {
        // track is playing
    });

// play an iTunes track number
music.playTrack("iTunes", 1).then(result => {
    // track is playing
});

// handling errors
music.playTrack("iTunes", 1000000000).then(result => {
    // result will not be null and will contain an attribute called "error"
    const err = result.error || null;
    if (err) {
        console.log(`Unable to play track, error: ${err}`);
    }
});
```

### play("Spotify")

Resume playing current track.

### pause("Spotify")

Pause playing track.

### playPause("Spotify")

Toggle play.

### next("Spotify")

Play next track.

### previous("Spotify")

Play previous track.

### volumeUp("Spotify")

Turn volume up.

### volumeDown("Spotify")

Turn volume down.

### setVolume("Spotify", volume)

Sets the volume.

```javascript
music.setVolume("Spotify", 42).then(() => {
    music.getState(state => {
        console.log(state.volume);
    });
});
```

### muteVolume("Spotify")

Reduces audio to 0, saving the previous volume.

### unmuteVolume("Spotify")

Returns audio to original volume.

### isRunning("Spotify")

Check if the music player is running.

```javascript
music.isRunning("Spotify").then(isRunning => {
    console.log(isRunning); // true || false
});
```

### isRepeating("Spotify")

Is repeating on or off?

```js
music.isRepeating("Spotify").then(isRepeating => {
    console.log(isRepeating); // true || false
});
```

### setShufflingOn("Spotify")

Is shuffling on or off?

```js
music.isShuffling("Spotify").then(isShuffling => {
    console.log(isShuffling); // true || false
});
```

## Contributors

-   [Cody](https://github.com/xavluiz)

## License
