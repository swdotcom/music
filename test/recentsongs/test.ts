const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { CodyResponse } from "../../lib/models";
import { TestUtil } from "../util";

const moment = require("moment-timezone");

const testUtil = new TestUtil();

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
        let configFile = __dirname + "/../../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.myRefreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.myAccessToken,
        });
    });

    beforeEach(() => {
        //
    });

    it("Get tracks after time", async () => {
        const limit = 10;
        const momentDate = moment().utc();
        const after = momentDate.valueOf();
        const resp: CodyResponse = await CodyMusic.getSpotifyRecentlyPlayedAfter(
            limit,
            after
        );
        expect(resp.data.tracks.length).to.equal(0);
    });

    it("Get tracks before time without limit", async () => {
        const limit = -1;
        const momentDate = moment().utc();
        const before = momentDate.valueOf();
        const resp: CodyResponse = await CodyMusic.getSpotifyRecentlyPlayedBefore(
            limit,
            before
        );
        expect(resp.data.tracks.length).to.not.equal(0);
    });

    it("Get tracks with limit", async () => {
        const limit = 2;
        const momentDate = moment().utc();
        const before = momentDate.valueOf();
        const resp: CodyResponse = await CodyMusic.getSpotifyRecentlyPlayedBefore(
            limit,
            before
        );
        expect(resp.data.tracks.length).to.equal(2);
    });
});
