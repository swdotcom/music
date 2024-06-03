const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("recently playing tracks tests", () => {
    before(async () => {
      new TestUtil().initializeSpotifyConfig();
    });

    beforeEach(() => {
        //
    });

    it("Delete track", async () => {
        const playlistId = "02CeibmnGve78e9nNlSnR9";
        const trackId = "0nMvEL9CNSdeBwV3TgUGSi";
        const result = await CodyMusic.removeTracksFromPlaylist(playlistId, [
            trackId,
        ]);
    });
});
