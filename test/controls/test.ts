const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { MusicUtil } from "../../lib/util";
import { MusicController } from "../../lib/controller";
import { TrackStatus } from "../../lib/models";

const musicUtil = new MusicUtil();
const musicCtr = MusicController.getInstance();

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("desktop player tests", () => {
    beforeEach(done => {
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

    it("Play and Pause itunes", done => {
        musicCtr
            .launchApp(CodyMusic.PlayerName.ItunesDesktop)
            .then(async () => {
                musicUtil.sleep(1500);

                // iniate play
                await CodyMusic.play(CodyMusic.PlayerName.ItunesDesktop);
                musicUtil.sleep(1500);

                // check
                let result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                let songName = result.name;

                // go to the next track
                await CodyMusic.next(CodyMusic.PlayerName.ItunesDesktop);
                musicUtil.sleep(1500);

                // check the current song
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result.name).to.not.equal(songName);
                songName = result.name;

                // pause it
                await CodyMusic.pause(CodyMusic.PlayerName.ItunesDesktop);
                musicUtil.sleep(1500);
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result.name).to.equal(songName);
                expect(result.state).to.equal(TrackStatus.Paused);

                // play again and make sure the song name is still the same
                await CodyMusic.play(CodyMusic.PlayerName.ItunesDesktop);
                musicUtil.sleep(1500);
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result.name).to.equal(songName);
                expect(result.state).to.equal(TrackStatus.Playing);

                done();
            });
    });
});
