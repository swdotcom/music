const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { MusicUtil } from "../../lib/util";
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

    it("Should Show The Playlist Names AND Show The Tracks Of A Playlist", done => {
        CodyMusic.getPlaylistNames(CodyMusic.PlayerName.ItunesDesktop).then(
            (names: string[]) => {
                expect(names.length).to.not.equal(0);
                // get the last name in the list and get the tracks
                CodyMusic.getTracksByPlaylistName(
                    CodyMusic.PlayerName.ItunesDesktop,
                    names[names.length - 1]
                ).then((result: any) => {
                    expect(result.length).to.not.equal(0);
                    done();
                });
            }
        );
    });

    it("Should Set An Itunes Song's Love State", done => {
        musicCtr
            .launchApp(CodyMusic.PlayerName.ItunesDesktop)
            .then(async () => {
                musicUtil.sleep(1500);
                await CodyMusic.setVolume(
                    CodyMusic.PlayerName.ItunesDesktop,
                    5
                );
                await CodyMusic.play(CodyMusic.PlayerName.ItunesDesktop);
                musicUtil.sleep(1500);
                let result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );

                let loved = result.loved;
                CodyMusic.setItunesLoved(!loved).then(async (result: any) => {
                    // get the state again
                    result = await CodyMusic.getState(
                        CodyMusic.PlayerName.ItunesDesktop
                    );
                    expect(result.loved).to.equal(!loved);
                    done();
                });
            });
    });

    it("Should Show An Error", done => {
        // play a bad track number
        CodyMusic.playTrack(
            CodyMusic.PlayerName.ItunesDesktop,
            1000000000
        ).then((result: any) => {
            expect(result.error).to.not.equal(null);
            musicCtr.quitApp(CodyMusic.PlayerName.ItunesDesktop).then(() => {
                done();
            });
        });
    });

    it("Should Show Spotify Is Not Running", done => {
        musicCtr.quitApp(CodyMusic.PlayerName.SpotifyDesktop).then(() => {
            CodyMusic.isSpotifyRunning().then((result: any) => {
                expect(result).to.equal(false);
                done();
            });
        });
    });

    it("Should Show Itunes Is Not Running", done => {
        musicCtr.quitApp(CodyMusic.PlayerName.ItunesDesktop).then(() => {
            CodyMusic.isItunesRunning().then((result: any) => {
                expect(result).to.equal(false);
                done();
            });
        });
    });

    // example result
    // {"artist": "Coldplay","album": "Parachutes","genre": "",
    // "disc_number": 1,"duration": 273426,"played_count": 0,"track_number": 6,
    // "id": "spotify:track:0R8P9KfGJCDULmlEoBagcO","name": "Trouble","state":"playing"}
    it("Get Spotify Track Info", done => {
        musicCtr
            .launchApp(CodyMusic.PlayerName.SpotifyDesktop)
            .then(async () => {
                musicUtil.sleep(2000);
                await CodyMusic.setVolume(
                    CodyMusic.PlayerName.SpotifyDesktop,
                    5
                );
                // artist: 'Martin Garrix',
                // album: 'High On Life (feat. Bonn)'
                // id: spotify:track:4ut5G4rgB1ClpMTMfjoIuy
                let params = ["spotify:track:4ut5G4rgB1ClpMTMfjoIuy"];

                await CodyMusic.playTrackInContext(
                    CodyMusic.PlayerName.SpotifyDesktop,
                    params
                );
                musicUtil.sleep(1500);
                let result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyDesktop
                );

                expect(result.id).to.equal(
                    "spotify:track:4ut5G4rgB1ClpMTMfjoIuy"
                );
                done();
            });
    });

    // example result
    // {"artist": "Loud Forest","album": "Out of Sight - Single",
    // "genre":"Alternative","disc_number": 1,"duration": 212.042007446289,
    // "played_count": 120,"track_number": 1,"id": "5601","name": "Out of Sight","state":"playing"}
    it("Get iTunes Track Info", done => {
        musicCtr
            .launchApp(CodyMusic.PlayerName.ItunesDesktop)
            .then(async () => {
                musicUtil.sleep(1500);
                await CodyMusic.setVolume(
                    CodyMusic.PlayerName.ItunesDesktop,
                    5
                );
                await CodyMusic.play(CodyMusic.PlayerName.ItunesDesktop);
                musicUtil.sleep(1500);
                let result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result.artist).to.not.equal(null);
                done();
            });
    });

    it("Tell Spotify To Perform Next, Repeat, Previous, Pause, Shuffle, Volume Change, Mute, Unmute, Shuffle, Check Shuffle", done => {
        musicCtr
            .launchApp(CodyMusic.PlayerName.SpotifyDesktop)
            .then(async () => {
                musicUtil.sleep(1500);
                let params = [
                    "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                    "spotify:album:6ZG5lRT77aJ3btmArcykra"
                ];

                await CodyMusic.playTrackInContext(
                    CodyMusic.PlayerName.SpotifyDesktop,
                    params
                );
                musicUtil.sleep(1500);

                let result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                // make sure it's playing
                expect(result.state).to.equal("playing");
                expect(result.name).to.equal("Trouble");

                // check if it's disc_number is greater than 1
                let diskNum = result.disc_number;
                let previousSong;
                if (diskNum === 1) {
                    // we're at disk one, just test using next and previous
                    await CodyMusic.next(CodyMusic.PlayerName.SpotifyDesktop);
                    musicUtil.sleep(1500);
                    await CodyMusic.next(CodyMusic.PlayerName.SpotifyDesktop);
                    musicUtil.sleep(1500);

                    // go to the previous song
                    await CodyMusic.previous(
                        CodyMusic.PlayerName.SpotifyDesktop
                    );
                    musicUtil.sleep(3000);
                    // check
                    result = await CodyMusic.getState(
                        CodyMusic.PlayerName.SpotifyDesktop
                    );
                    previousSong = result.name;
                    expect(previousSong).to.not.equal("Trouble");
                } else {
                    // go to the previous song
                    await CodyMusic.previous(
                        CodyMusic.PlayerName.SpotifyDesktop
                    );
                    musicUtil.sleep(3000);
                    // check
                    result = await CodyMusic.getState(
                        CodyMusic.PlayerName.SpotifyDesktop
                    );
                    previousSong = result.name;
                    expect(previousSong).to.equal("Trouble");
                }

                // pause it
                await CodyMusic.pause(CodyMusic.PlayerName.SpotifyDesktop);
                musicUtil.sleep(1500);
                // check
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                expect(result.state).to.equal("paused");
                // go to next
                await CodyMusic.next(CodyMusic.PlayerName.SpotifyDesktop);
                musicUtil.sleep(1500);
                // check
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                let nextSong = result.name;
                expect(nextSong).to.not.equal(previousSong);
                // turn repeat on
                await CodyMusic.setRepeat(
                    CodyMusic.PlayerName.SpotifyDesktop,
                    true
                );
                // check
                result = await CodyMusic.isRepeating(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                expect(result).to.equal(true);
                // turn repeat off
                await CodyMusic.setRepeat(
                    CodyMusic.PlayerName.SpotifyDesktop,
                    false
                );
                // check
                result = await CodyMusic.isRepeating(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                expect(result).to.equal(false);
                // up the volume
                await CodyMusic.volumeUp(CodyMusic.PlayerName.SpotifyDesktop);
                // check
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                const volume = result.volume;
                expect(volume).to.be.greaterThan(5);

                // mute and unmute tests
                await CodyMusic.mute(CodyMusic.PlayerName.SpotifyDesktop);
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                expect(result.volume).to.equal(0);

                await CodyMusic.unmute(CodyMusic.PlayerName.SpotifyDesktop);
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                expect(result.volume).to.be.within(volume - 1, volume + 1);

                // play track
                await CodyMusic.playTrack(
                    CodyMusic.PlayerName.SpotifyDesktop,
                    "spotify:track:4ut5G4rgB1ClpMTMfjoIuy"
                );

                musicUtil.sleep(1500);
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                expect(result.artist).to.equal("Martin Garrix");

                // shuffle test
                await CodyMusic.setShuffle(
                    CodyMusic.PlayerName.SpotifyDesktop,
                    true
                );
                result = await CodyMusic.isShuffling(
                    CodyMusic.PlayerName.SpotifyDesktop
                );
                expect(result).to.equal(true);

                await musicCtr.quitApp(CodyMusic.PlayerName.SpotifyDesktop);

                done();
            })
            .catch((err: any) => {
                console.log("failed to run itunes tests: ", err.message);
                done();
            });
    });

    it("Tell Itunes To Perform Next, Repeat, Previous, Pause, Shuffle, Volume Change, Mute, Unmute, Shuffle, Check Shuffle", done => {
        musicCtr
            .launchApp(CodyMusic.PlayerName.ItunesDesktop)
            .then(async () => {
                musicUtil.sleep(1500);
                await CodyMusic.play(CodyMusic.PlayerName.ItunesDesktop);
                musicUtil.sleep(1500);

                let result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                // make sure it's playing
                expect(result.state).to.equal("playing");
                let songName = result.name;

                // go to the next song
                await CodyMusic.next(CodyMusic.PlayerName.ItunesDesktop);

                // check
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result.name).to.not.equal(songName);
                songName = result.name;
                // pause it
                await CodyMusic.pause(CodyMusic.PlayerName.ItunesDesktop);
                // check
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result.state).to.equal("paused");
                // go to previous
                await CodyMusic.previous(CodyMusic.PlayerName.ItunesDesktop);
                // check
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result.name).to.not.equal(songName);
                songName = result.name;
                // turn repeat on
                await CodyMusic.setRepeat(
                    CodyMusic.PlayerName.ItunesDesktop,
                    true
                );
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                // check
                result = await CodyMusic.isRepeating(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result).to.equal("one");
                // turn repeat off
                await CodyMusic.setRepeat(
                    CodyMusic.PlayerName.ItunesDesktop,
                    false
                );
                // check
                result = await CodyMusic.isRepeating(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result).to.equal("off");
                // up the volume
                await CodyMusic.volumeUp(CodyMusic.PlayerName.ItunesDesktop);
                // check
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                const volume = result.volume;
                expect(volume).to.be.greaterThan(5);

                // mute and unmute tests
                await CodyMusic.mute(CodyMusic.PlayerName.ItunesDesktop);
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result.volume).to.equal(0);

                await CodyMusic.unmute(CodyMusic.PlayerName.ItunesDesktop);
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result.volume).to.equal(volume);

                // play track
                await CodyMusic.playTrack(
                    CodyMusic.PlayerName.ItunesDesktop,
                    1
                );
                result = await CodyMusic.getState(
                    CodyMusic.PlayerName.ItunesDesktop
                );

                // shuffle test
                await CodyMusic.setShuffle(
                    CodyMusic.PlayerName.ItunesDesktop,
                    true
                );
                result = await CodyMusic.isShuffling(
                    CodyMusic.PlayerName.ItunesDesktop
                );
                expect(result).to.equal(true);

                await musicCtr.quitApp(CodyMusic.PlayerName.ItunesDesktop);

                done();
            })
            .catch((err: any) => {
                console.log("failed to run itunes tests: ", err.message);
                done();
            });
    });
});