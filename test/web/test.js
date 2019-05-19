/**
 * private _spotifyRefreshToken: string =
        "AQCSjp8_taBNv46KFtHsRpU9IcppjCDyGBWN4pATLLXqBPa4Wjk38CY703-WnG4xk7zVbU7niLKQrsYi_zkGnFIy2HuZv-RyiU9fwkE-uw3HUI-vqWBxZoEbdZEIcM1zIqPs3w";
    private _apiHeaders: any = {};
    private _connectServerAuth: string = "";
    private _spotifyClientSecret: string = "2b40b4975b2743189c87f4712c0cd59e";
    private _spotifyClientId: string = "eb67e22ba1c6474aad8ec8067480d9dc";
 */
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
    xit("Check the spotify web player devices", done => {
        CodyMusic.getSpotifyWebDevices(result => {
            console.log("devices: ", result);
            done();
        }).catch(error => {
            console.log("error: ", error);
            done();
        });
    });
});
