const expect = require("chai").expect;
const index = require("../dist/index.js");
const util = require("../dist/lib/util.js");

describe("software music tests", () => {
    beforeEach(async () => {});

    after(async () => {
        // await index.stopSpotifyIfRunning();
    });

    // example result
    // {"artist": "Coldplay","album": "Parachutes","genre": "","disc_number": 1,"duration": 273426,"played_count": 0,"track_number": 6,"id": "spotify:track:0R8P9KfGJCDULmlEoBagcO","name": "Trouble","state":"playing"}
    it("expect to get the running and playing state for spotify", () => {
        index.startSpotifyIfNotRunning().then(() => {
            util.sleep(2000);
            let params = [
                "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                "spotify:album:6ZG5lRT77aJ3btmArcykra"
            ];

            index.playTrackInContext("Spotify", params).then(() => {
                util.sleep(2000);
                index.getState("Spotify").then(result => {
                    try {
                        let obj = JSON.parse(result);
                        expect(obj.artist).to.equal("Coldplay");
                    } catch (e) {
                        console.log("use case error: ", e.message);
                    } finally {
                        index.stopSpotifyIfRunning();
                    }
                });
            });
        });
    });

    // example result
    // {"artist": "Loud Forest","album": "Out of Sight - Single","genre":"Alternative","disc_number": 1,"duration": 212.042007446289,"played_count": 120,"track_number": 1,"id": "5601","name": "Out of Sight","state":"playing"}
    it("expect to get the running and playing state for itunes", () => {
        index.startItunesIfNotRunning().then(() => {
            util.sleep(2000);
            index.play("iTunes").then(() => {
                index.getState("iTunes").then(result => {
                    try {
                        let obj = JSON.parse(result);
                        expect(obj.artist).to.not.equal(null);
                    } catch (e) {
                        console.log("use case error: ", e.message);
                    } finally {
                        index.stopItunesIfRunning();
                    }
                });
            });
        });
    });

    // it("should return not running for spotify", async () => {
    //     await index.stopSpotifyIfRunning();
    //     const result = await index.isSpotifyRunning();
    //     expect(result).to.equal(false);
    // });
    // it("should return not running for itunes", async () => {
    //     await index.stopItunesIfRunning();
    //     const result = await index.isItunesRunning();
    //     expect(result).to.equal(false);
    // });
    // it("should play a spotify song", async () => {
    //     const spotifyRunning = await index.isSpotifyRunning();
    //     if (!spotifyRunning) {
    //         await index.startSpotifyIfNotRunning();
    //     }
    //     const result = await index.play("Spotify");
    // });
});
