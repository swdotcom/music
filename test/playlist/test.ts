const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import {
    Track,
    CodyResponse,
    PlayerContext,
    PlayerName,
} from "../../lib/models";
import { TestUtil } from "../util";
import { MusicUtil } from "../../lib/util";

const moment = require("moment-timezone");
const musicUtil = new MusicUtil();

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
    before(async () => {
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

    it("Delete track", async () => {
        const playlistId = "02CeibmnGve78e9nNlSnR9";
        const trackId = "0nMvEL9CNSdeBwV3TgUGSi";
        const result = await CodyMusic.removeTracksFromPlaylist(playlistId, [
            trackId,
        ]);
        // if (result.error) {
        // delete track result:  {
        //     error: {
        //       status: 403,
        //       message: "You cannot remove tracks from a playlist you don't own."
        //     }
        //   }
        // console.log("delete track result: ", result.error.response.data);
        //}
    });
});
