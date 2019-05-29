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
describe("itunes player tests", () => {
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

    it("Launch and test itunes track state", done => {
        CodyMusic.launchPlayer(CodyMusic.PlayerName.ItunesDesktop, {}).then(
            result => {
                CodyMusic.getRunningTrack().then((track: Track) => {
                    expect(track.id).to.equal("");
                    done();
                });
            }
        );
    });

    it("Get running track with only iTunes running", done => {
        CodyMusic.play(CodyMusic.PlayerName.ItunesDesktop).then(result => {
            musicUtil.sleep(3000);
            CodyMusic.getRunningTrack().then(track => {
                expect(track.id).to.not.equal("");
                done();
            });
        });
    });

    it("Get itunes playlists", done => {
        CodyMusic.getPlaylists(PlayerName.ItunesDesktop).then(
            (result: PlaylistItem[]) => {
                expect(result.length).to.not.equal(0);
                const playlistItem: PlaylistItem = result[0];
                expect(playlistItem.tracks.total).to.not.equal(0);
                done();
            }
        );
    });

    it("Get itunes playlists tracks", done => {
        CodyMusic.getPlaylists(PlayerName.ItunesDesktop).then(
            (result: PlaylistItem[]) => {
                expect(result.length).to.not.equal(0);
                const playlistItem: PlaylistItem = result[0];
                CodyMusic.getPlaylistTracks(
                    PlayerName.ItunesDesktop,
                    playlistItem.id
                ).then((result: CodyResponse) => {
                    let pageItem: PaginationItem = result.data;
                    expect(pageItem.items.length).to.not.equal(0);
                    done();
                });
            }
        );
    });
});
