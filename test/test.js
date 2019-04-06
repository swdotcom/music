const expect = require("chai").expect;
const index = require("../dist/index.js");
const util = require("../dist/lib/util.js");

describe("software music tests", () => {
    beforeEach(done => {
        done();
    });

    after(done => {
        index.stopItunesIfRunning().then(result => {
            index.stopSpotifyIfRunning().then(result => {
                done();
            });
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

    it("Tell Spotify To Perform Next, Repeat, Previous, Pause, Shuffle", done => {
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
            expect(result.volume).to.be.greaterThan(5);
            done();
        });
    });
});
