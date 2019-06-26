import { MusicUtil } from "../../lib/util";
const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import {
    Track,
    PlayerName,
    PlaylistItem,
    CodyResponse,
    PaginationItem
} from "../../lib/models";
import { MusicController } from "../../lib/controller";

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
describe("itunes state tests", () => {
    before(done => {
        musicCtr
            .quitApp(CodyMusic.PlayerName.SpotifyDesktop)
            .then((result: any) => {
                musicCtr
                    .quitApp(CodyMusic.PlayerName.ItunesDesktop)
                    .then((result: any) => {
                        done();
                    });
            });
    });

    after("itunes player test completion", done => {
        musicCtr
            .quitApp(CodyMusic.PlayerName.SpotifyDesktop)
            .then((result: any) => {
                musicCtr
                    .quitApp(CodyMusic.PlayerName.ItunesDesktop)
                    .then((result: any) => {
                        done();
                    });
            });
    });

    it("Return itunes current track when itunes is the only app running", done => {
        CodyMusic.launchPlayer(CodyMusic.PlayerName.ItunesDesktop, {}).then(
            result => {
                musicUtil.sleep(2500);
                CodyMusic.getRunningTrack().then(async (track: Track) => {
                    let playerRunning = await CodyMusic.isPlayerRunning(
                        PlayerName.ItunesDesktop
                    );
                    expect(playerRunning).to.equal(true);
                    // there may be a grant error
                    if (!track.error) {
                        expect(track.id).to.not.equal("");
                        expect(track.playerType).to.not.equal(undefined);
                    }
                    done();
                });
            }
        );
    });

    it("Return itunes is not currently running", done => {
        musicCtr
            .quitApp(CodyMusic.PlayerName.ItunesDesktop)
            .then(async (result: any) => {
                let playerRunning = await CodyMusic.isPlayerRunning(
                    PlayerName.ItunesDesktop
                );
                console.log("player running: ", playerRunning);
                expect(playerRunning).to.equal(false);
                done();
            });
    });
});
