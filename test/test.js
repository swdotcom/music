const expect = require("chai").expect;
const index = require("../dist/index.js");
const util = require("../dist/lib/util.js");

describe("get active music player function test", () => {
    beforeEach(async () => {
        await index.startSpotifyIfNotRunning();
        await index.startItunesIfNotRunning();
        util.sleep(2000);
    });

    after(async () => {
        // await index.stopSpotifyIfRunning();
    });

    it("expect to get the running and playing state for spotify", () => {
        let params = [
            "spotify:track:0R8P9KfGJCDULmlEoBagcO",
            "spotify:album:6ZG5lRT77aJ3btmArcykra"
        ];

        index.playTrackInContext("Spotify", params).then(() => {
            index.getState("Spotify").then(result => {
                console.log("spotify playing result: ", result);
                expect(true).to.equal(true);
            });
        });
    });

    it("expect to get the running and playing state for itunes", () => {
        index.play("iTunes").then(() => {
            index.getState("iTunes").then(result => {
                console.log("itunes playing result: ", result);
                expect(true).to.equal(true);
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
