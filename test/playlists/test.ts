import { MusicUtil } from "../../lib/util";
const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { MusicController } from "../../lib/controller";
import { UserProfile, SpotifyUser } from "../../lib/profile";

const musicUtil = new MusicUtil();
const userProfile = UserProfile.getInstance();
const musicCtr = MusicController.getInstance();

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
        const accessToken = "123abc";
        CodyMusic.setCredentials({
            refreshToken:
                "AQCSjp8_taBNv46KFtHsRpU9IcppjCDyGBWN4pATLLXqBPa4Wjk38CY703-WnG4xk7zVbU7niLKQrsYi_zkGnFIy2HuZv-RyiU9fwkE-uw3HUI-vqWBxZoEbdZEIcM1zIqPs3w",
            clientSecret: "2b40b4975b2743189c87f4712c0cd59e",
            clientId: "eb67e22ba1c6474aad8ec8067480d9dc",
            accessToken: accessToken
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
