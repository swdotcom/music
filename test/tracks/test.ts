import { MusicUtil } from "../../lib/util";
const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { MusicController } from "../../lib/controller";
import { PlayerName } from "../../lib/models";

const musicUtil = new MusicUtil();
const musicCtr = MusicController.getInstance();

/**
 * Don't add "async" into the it condition.
 * i.e. xit("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("music track tests", () => {
    before(done => {
        const accessToken = "123abc";
        CodyMusic.setCredentials({
            refreshToken:
                "AQCSjp8_taBNv46KFtHsRpU9IcppjCDyGBWN4pATLLXqBPa4Wjk38CY703-WnG4xk7zVbU7niLKQrsYi_zkGnFIy2HuZv-RyiU9fwkE-uw3HUI-vqWBxZoEbdZEIcM1zIqPs3w",
            clientSecret: "2b40b4975b2743189c87f4712c0cd59e",
            clientId: "eb67e22ba1c6474aad8ec8067480d9dc",
            accessToken: accessToken
        });

        musicCtr.quitApp(PlayerName.SpotifyDesktop).then(() => {
            musicCtr.quitApp(PlayerName.ItunesDesktop).then(() => {
                CodyMusic.getSpotifyDevices().then(async (response: any) => {
                    if (response && response.length > 0) {
                        // get the 1st device id
                        const device_id = response[0].id;
                        const options = {
                            device_id
                        };
                        response = await CodyMusic.pause(
                            CodyMusic.PlayerName.SpotifyWeb,
                            options
                        );
                        done();
                    } else {
                        done();
                    }
                });
            });
        });
    });

    after("clean up track testing", done => {
        musicCtr.quitApp(PlayerName.SpotifyDesktop).then(() => {
            musicCtr.quitApp(PlayerName.ItunesDesktop).then(() => {
                CodyMusic.getSpotifyDevices().then(async (response: any) => {
                    if (response && response.length > 0) {
                        // get the 1st device id
                        const device_id = response[0].id;
                        const options = {
                            device_id
                        };
                        response = await CodyMusic.pause(
                            CodyMusic.PlayerName.SpotifyWeb,
                            options
                        );
                        done();
                    } else {
                        done();
                    }
                });
            });
        });
    });

    it("get best currently running track", done => {
        CodyMusic.launchPlayer(CodyMusic.PlayerName.ItunesDesktop).then(
            async () => {
                // play any song
                await CodyMusic.play(CodyMusic.PlayerName.ItunesDesktop);
                musicUtil.sleep(1500);
                CodyMusic.getRunningTrack().then((response: any) => {
                    expect(response.id).to.not.equal("");
                    done();
                });
            }
        );
    });
});
