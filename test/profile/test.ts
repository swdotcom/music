const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { UserProfile, SpotifyUser } from "../../lib/profile";
import { TestUtil } from "../util";

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
        console.log("data: ", data);
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
});
