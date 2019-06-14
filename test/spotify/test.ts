const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { MusicUtil } from "../../lib/util";
import { MusicController } from "../../lib/controller";
import { MusicPlayerState } from "../../lib/playerstate";
import { TestUtil } from "../util";

const testUtil = new TestUtil();

const musicUtil = new MusicUtil();
const musicCtr = MusicController.getInstance();
const musicPlayerCtr = MusicPlayerState.getInstance();

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("player control tests", () => {
    beforeEach(done => {
        let configFile = __dirname + "/../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.accessToken
        });

        musicCtr
            .quitApp(CodyMusic.PlayerName.SpotifyDesktop)
            .then((result: any) => {
                musicCtr
                    .quitApp(CodyMusic.PlayerName.ItunesDesktop)
                    .then((result: any) => {
                        done();
                    })
                    .catch((err: any) => {
                        done();
                    });
            })
            .catch((err: any) => {
                musicCtr
                    .quitApp(CodyMusic.PlayerName.ItunesDesktop)
                    .then((result: any) => {
                        done();
                    })
                    .catch((err: any) => {
                        done();
                    });
            });
    });

    after(done => {
        // make sure both players have been killed
        musicCtr
            .quitApp(CodyMusic.PlayerName.SpotifyDesktop)
            .then((result: any) => {
                musicCtr
                    .quitApp(CodyMusic.PlayerName.ItunesDesktop)
                    .then((result: any) => {
                        done();
                    })
                    .catch((err: any) => {
                        done();
                    });
            })
            .catch((err: any) => {
                musicCtr
                    .quitApp(CodyMusic.PlayerName.ItunesDesktop)
                    .then((result: any) => {
                        done();
                    })
                    .catch((err: any) => {
                        done();
                    });
            });
    });

    it("Launch and play Spotify on the desktop", done => {
        musicCtr
            .launchApp(CodyMusic.PlayerName.SpotifyDesktop)
            .then(async () => {
                musicUtil.sleep(1500);

                // iniate play
                await CodyMusic.pause(CodyMusic.PlayerName.SpotifyDesktop);
                musicUtil.sleep(1500);

                // check
                let result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                let songName = result.name;

                expect(songName).to.not.equal(null);
                expect(songName).to.not.equal("");

                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyWeb
                );
                songName = result.name;
                expect(songName).to.not.equal(null);
                expect(songName).to.not.equal("");

                await musicCtr.quitApp(CodyMusic.PlayerName.SpotifyDesktop);
                done();
            });
    });
});
