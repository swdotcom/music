const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { CodyResponse } from "../../lib/models";
import { TestUtil } from "../util";
import { getTime } from "date-fns";

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("recently playing tracks tests", () => {
    before(() => {
      new TestUtil().initializeSpotifyConfig();
    });

    beforeEach(() => {
        //
    });

    it("Get tracks after time", async () => {
        const limit = 10;
        const after = getTime(new Date());
        const resp: CodyResponse = await CodyMusic.getSpotifyRecentlyPlayedAfter(
            limit,
            after
        );
        expect(resp.data.tracks.length).to.equal(0);
    });

    it("Get tracks before time without limit", async () => {
        const limit = -1;
        const before = getTime(new Date());
        const resp: CodyResponse = await CodyMusic.getSpotifyRecentlyPlayedBefore(
            limit,
            before
        );
        expect(resp.data.tracks.length).to.not.equal(0);
    });

    it("Get tracks with limit", async () => {
        const limit = 2;
        const before = getTime(new Date());
        const resp: CodyResponse = await CodyMusic.getSpotifyRecentlyPlayedBefore(
            limit,
            before
        );
        expect(resp.data.tracks.length).to.equal(2);
    });
});
