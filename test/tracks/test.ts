import { MusicUtil } from "../../lib/util";
const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { MusicController } from "../../lib/controller";
import { PlayerName, Track } from "../../lib/models";
import { TestUtil } from "../util";

const musicUtil = new MusicUtil();
const musicCtr = MusicController.getInstance();
const testUtil = new TestUtil();

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
        let configFile = __dirname + "/../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.accessToken
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

    xit("get best currently running track", done => {
        CodyMusic.launchPlayer(CodyMusic.PlayerName.ItunesDesktop).then(
            async () => {
                musicUtil.sleep(2500);
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

    xit("checks if it has an active track", done => {
        CodyMusic.hasActiveTrack().then((result: any) => {
            expect(result).to.equal(true);
            done();
        });
    });

    it("play specific track", async () => {
        await CodyMusic.launchPlayer(CodyMusic.PlayerName.SpotifyDesktop);
        musicUtil.sleep(1500);
        // either...
        // await CodyMusic.playTrackInContext(PlayerName.SpotifyDesktop, [
        //     "spotify:track:6t52BHKOeX3os9AxPqET1R",
        //     "Liked Songs"
        // ]);
        // or...
        await CodyMusic.playTrack(
            PlayerName.SpotifyDesktop,
            "spotify:track:6t52BHKOeX3os9AxPqET1R"
        );
        // both work
        let runningTrack: Track = await CodyMusic.getRunningTrack();
        console.log("running track name: ", runningTrack.name);
    });
});
