const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { UserProfile, SpotifyUser } from "../../lib/profile";
import { TestUtil } from "../util";
import { PlayerName } from "../../lib/models";

const userProfile = UserProfile.getInstance();
const testUtil = new TestUtil();

/**
 * Don't add "async" into the it condition.
 * i.e. xit("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("spotify profile tests", () => {
    before(done => {
        let configFile = __dirname + "/../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.accessToken
        });

        done();
    });

    after("clean up spotify profile testing", done => {
        done();
    });

    it("fetch the spotify user profile", done => {
        userProfile.getUserProfile().then((result: SpotifyUser) => {
            expect(result.id).to.not.equal("");
            done();
        });
    });

    it("fetch recently played tracks", done => {
        CodyMusic.getSpotifyRecentlyPlayedTracks(1).then(result => {
            expect(result.length).to.not.equal(0);
            done();
        });
    });
});
