const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { Track } from "../../lib/models";
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
        let configFile = __dirname + "/../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.accessToken,
        });
    });

    beforeEach(() => {
        //
    });

    it("Get tracks after time", async () => {
        const limit = 10;
        const momentDate = moment().utc();
        const after = momentDate.valueOf();
        const tracks: Track[] = await CodyMusic.getSpotifyRecentlyPlayedAfter(
            limit,
            after
        );
        expect(tracks.length).to.equal(0);
    });

    it("Get tracks before time", async () => {
        const limit = 10;
        const momentDate = moment().utc();
        const before = momentDate.valueOf();
        const tracks: Track[] = await CodyMusic.getSpotifyRecentlyPlayedBefore(
            limit,
            before
        );
        expect(tracks.length).to.not.equal(0);
    });
});
