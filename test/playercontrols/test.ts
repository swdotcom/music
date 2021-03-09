const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import {
    PlayerName,
} from "../../lib/models";
import { TestUtil } from "../util";
import { MusicUtil } from "../../lib/util";

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
            refreshToken: data.myRefreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.myAccessToken,
        });
        await CodyMusic.launchPlayer(PlayerName.SpotifyDesktop);
        musicUtil.sleep(1500);
    });

    beforeEach(() => {
        //
    });

    it("Mute volume", async () => {
        await CodyMusic.mute(PlayerName.SpotifyWeb);
    });

    it("Unmute volume", async () => {
        await CodyMusic.unMute(PlayerName.SpotifyWeb);
    });
});
