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

### playTrack(uri, callback)

Play a track with Spotify URI `uri`.

```javascript
const music = require("@software/music");

music.playTrack("Spotify", "spotify:track:3AhXZa8sUQht0UEdBJgpGc", () => {
    // track is playing
});
```

## Contributors

-   [Cody](https://github.com/xavluiz)

## License
