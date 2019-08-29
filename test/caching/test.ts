import * as CodyMusic from "../../index";
import { CacheUtil } from "../../lib/cache";
import { MusicController } from "../../lib/controller";
import { TestUtil } from "../util";
const expect = require("chai").expect;

const musicCtr = MusicController.getInstance();
const testUtil = new TestUtil();
const cacheUtil = CacheUtil.getInstance();

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("api caching tests", () => {
    before(done => {
        musicCtr
            .quitApp(CodyMusic.PlayerName.SpotifyDesktop)
            .then((result: any) => {
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
    });

    it("Fetch devices multiple times but only use the api once", done => {
        CodyMusic.getSpotifyDevices().then(async (response: any) => {
            await CodyMusic.getSpotifyDevices();
            await CodyMusic.getSpotifyDevices();
            await CodyMusic.getSpotifyDevices();
            done();
        });
    });

    it("Expire cache", done => {
        CodyMusic.getSpotifyDevices().then(async (response: any) => {
            cacheUtil.setItem("key1", "myval", 1);
            let val = cacheUtil.getItem("key1");
            expect(val).to.equal("myval");
            cacheUtil.deleteItem("key1");
            val = cacheUtil.getItem("key1");
            expect(val).to.equal(null);
            done();
        });
    });
});
