const expect = require("chai").expect;
const CodyMusic = require("../../dist/index.js");
const util = require("../../dist/lib/util.js");

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("web player music tests", () => {
    beforeEach(done => {
        const accessToken = "123abc";
        CodyMusic.setCredentials({
            refreshToken:
                "AQCSjp8_taBNv46KFtHsRpU9IcppjCDyGBWN4pATLLXqBPa4Wjk38CY703-WnG4xk7zVbU7niLKQrsYi_zkGnFIy2HuZv-RyiU9fwkE-uw3HUI-vqWBxZoEbdZEIcM1zIqPs3w",
            clientSecret: "2b40b4975b2743189c87f4712c0cd59e",
            clientId: "eb67e22ba1c6474aad8ec8067480d9dc",
            accessToken: accessToken
        });

        let setAccessToken = CodyMusic.getAccessToken("accessToken");

        expect(setAccessToken).to.equal(accessToken);

        done();
    });

    it("Check the spotify web player devices", done => {
        CodyMusic.launchSpotifyWebPlayer()
            .then(() => {
                util.sleep(3000);
                CodyMusic.getSpotifyWebDevices().then(response => {
                    console.log("response: ", response);
                    done();
                });
            })
            .catch(err => {
                console.log("error: ", err);
            });
    });

    it("Play/pause web player track", done => {
        CodyMusic.play("spotify-web").then(result => {
            console.log("web play result: ", result);
            done();
        });
    });
});
