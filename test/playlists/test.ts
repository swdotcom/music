const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";

const testUtil = new TestUtil();

/**
 * Don't add "async" into the it condition.
 * i.e. xit("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("spotify playlist tests", () => {
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

    after("clean up spotify playlist testing", done => {
        done();
    });

    it("create a spotify playlist", done => {
        CodyMusic.createPlaylist("cody-favs", false /*isPublic*/).then(
            result => {
                expect(result.data.id).to.not.equal("");
                const playlist_id = result.data.id;
                CodyMusic.deletePlaylist(playlist_id).then(result => {
                    expect(result.status).to.equal(200);
                    done();
                });
            }
        );
    });
});
