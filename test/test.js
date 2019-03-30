const expect = require("chai").expect;
const index = require("../dist/index.js");

describe("get active music player function test", () => {
    it("should return not running for spotify", async () => {
        await index.stopSpotifyIfRunning();
        const result = await index.isSpotifyRunning();
        expect(result).to.equal(false);
    });
    it("should return not running for itunes", async () => {
        await index.stopItunesIfRunning();
        const result = await index.isItunesRunning();
        expect(result).to.equal(false);
    });
});
