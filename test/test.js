const expect = require("chai").expect;
const index = require("../dist/index.js");
const util = require("../dist/lib/util.js");

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("software music tests", () => {
    beforeEach(done => {
        done();
    });

    after(done => {
        // make sure both players have been killed
        index.stopSpotifyIfRunning().then(() => {
            index.stopItunesIfRunning().then(() => {
                done();
            });
        });
    });

    it("Should Show An Error", done => {
        // play a bad track number
        index.playTrack("iTunes", 1000000000).then(result => {
            expect(result.error).to.not.equal(null);
            index.stopItunesIfRunning().then(() => {
                done();
            });
        });
    });

    it("Should Show Spotify Is Not Running", done => {
        index.isSpotifyRunning().then(result => {
            expect(result).to.equal(false);
            done();
        });
    });

    it("Should Show Itunes Is Not Running", done => {
        index.isItunesRunning().then(result => {
            expect(result).to.equal(false);
            done();
        });
    });

    // example result
    // {"artist": "Coldplay","album": "Parachutes","genre": "",
    // "disc_number": 1,"duration": 273426,"played_count": 0,"track_number": 6,
    // "id": "spotify:track:0R8P9KfGJCDULmlEoBagcO","name": "Trouble","state":"playing"}
    it("Get Spotify Track Info", done => {
        index.startSpotifyIfNotRunning().then(async () => {
            util.sleep(2000);
            await index.setVolume("Spotify", 5);
            let params = [
                "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                "spotify:album:6ZG5lRT77aJ3btmArcykra"
            ];

            await index.playTrackInContext("Spotify", params);
            util.sleep(1000);
            let result = await index.getState("Spotify");
            expect(result.artist).to.equal("Coldplay");
            expect(result.name).to.equal("Trouble");
            done();
        });
    });

    // example result
    // {"artist": "Loud Forest","album": "Out of Sight - Single",
    // "genre":"Alternative","disc_number": 1,"duration": 212.042007446289,
    // "played_count": 120,"track_number": 1,"id": "5601","name": "Out of Sight","state":"playing"}
    it("Get iTunes Track Info", done => {
        index.startItunesIfNotRunning().then(async () => {
            util.sleep(1000);
            await index.setVolume("iTunes", 5);
            await index.play("iTunes");
            util.sleep(1000);
            let result = await index.getState("iTunes");
            expect(result.artist).to.not.equal(null);
            // since we were successful, pause it.
            // this isn't part of the test, just turning off music.
            await index.pause("iTunes");
            done();
        });
    });

    it("Tell Spotify To Perform Next, Repeat, Previous, Pause, Shuffle, Volume Change", done => {
        index.startSpotifyIfNotRunning().then(async () => {
            util.sleep(1000);
            let params = [
                "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                "spotify:album:6ZG5lRT77aJ3btmArcykra"
            ];

            await index.playTrackInContext("Spotify", params);
            util.sleep(1000);

            let result = await index.getState("Spotify");
            // make sure it's playing
            expect(result.state).to.equal("playing");
            expect(result.name).to.equal("Trouble");

            // go to the previous song
            await index.previous("Spotify");
            // check
            result = await index.getState("Spotify");
            expect(result.name).to.equal("Yellow");
            // pause it
            await index.pause("Spotify");
            // check
            result = await index.getState("Spotify");
            expect(result.state).to.equal("paused");
            // go to next
            await index.next("Spotify");
            // check
            result = await index.getState("Spotify");
            expect(result.name).to.equal("Trouble");
            // turn repeat on
            await index.repeatOn("Spotify");
            // check
            result = await index.isRepeating("Spotify");
            expect(result).to.equal(true);
            // turn repeat off
            await index.repeatOff("Spotify");
            // check
            result = await index.isRepeating("Spotify");
            expect(result).to.equal(false);
            // up the volume
            await index.volumeUp("Spotify");
            // check
            result = await index.getState("Spotify");
            const volume = result.volume;
            expect(volume).to.be.greaterThan(5);

            // mute and unmute tests
            await index.mute("Spotify");
            result = await index.getState("Spotify");
            expect(result.volume).to.equal(0);

            await index.unMute("Spotify");
            result = await index.getState("Spotify");
            expect(result.volume).to.be.within(volume - 1, volume + 1);

            // play track
            await index.playTrack(
                "Spotify",
                "spotify:track:2YarjDYjBJuH63dUIh9OWv"
            );
            result = await index.getState("Spotify");
            expect(result.artist).to.equal("Wolfgang Amadeus Mozart");

            // shuffle test
            await index.setShufflingOn("Spotify");
            result = await index.isShuffling("Spotify");
            expect(result).to.equal(true);

            done();
        });
    });

    it("Tell Itunes To Perform Next, Repeat, Previous, Pause, Shuffle, Volume Change", done => {
        index.startSpotifyIfNotRunning().then(async () => {
            util.sleep(1000);
            await index.play("iTunes");
            util.sleep(1000);

            let result = await index.getState("iTunes");
            // make sure it's playing
            expect(result.state).to.equal("playing");
            let songName = result.name;

            // go to the next song
            await index.next("iTunes");
            // check
            result = await index.getState("Spotify");
            expect(result.name).to.not.equal(songName);
            songName = result.name;
            // pause it
            await index.pause("iTunes");
            // check
            result = await index.getState("iTunes");
            expect(result.state).to.equal("paused");
            // go to previous
            await index.previous("iTunes");
            // check
            result = await index.getState("iTunes");
            expect(result.name).to.not.equal(songName);
            songName = result.name;
            // turn repeat on
            await index.repeatOn("iTunes");
            result = await index.getState("iTunes");
            // check
            result = await index.isRepeating("iTunes");
            expect(result).to.equal("one");
            // turn repeat off
            await index.repeatOff("iTunes");
            // check
            result = await index.isRepeating("iTunes");
            expect(result).to.equal("off");
            // up the volume
            await index.volumeUp("iTunes");
            // check
            result = await index.getState("iTunes");
            const volume = result.volume;
            expect(volume).to.be.greaterThan(5);

            // mute and unmute tests
            await index.mute("iTunes");
            result = await index.getState("iTunes");
            expect(result.volume).to.equal(0);

            await index.unMute("iTunes");
            result = await index.getState("iTunes");
            expect(result.volume).to.equal(volume);

            // play track
            await index.playTrack("iTunes", 1);
            result = await index.getState("iTunes");
            console.log("iTunes play track song: ", result.name);

            // shuffle test
            await index.setShufflingOn("iTunes");
            result = await index.isShuffling("iTunes");
            expect(result).to.equal(true);

            done();
        });
    });
});
