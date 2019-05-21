const expect = require("chai").expect;
const CodyMusic = require("../../dist/index.js");
import { MusicUtil } from "../../lib/util";
import { PlayerName } from "../../lib/models";
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
            .quitApp(PlayerName.SpotifyDesktop)
            .then((result: any) => {
                musicCtr
                    .quitApp(PlayerName.ItunesDesktop)
                    .then((result: any) => {
                        done();
                    })
                    .catch((err: any) => {
                        done();
                    });
            })
            .catch((err: any) => {
                musicCtr
                    .quitApp(PlayerName.ItunesDesktop)
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
            .quitApp(PlayerName.SpotifyDesktop)
            .then((result: any) => {
                done();
            })
            .catch((err: any) => {
                done();
            });
    });

    it("Should Show The Playlist Names AND Show The Tracks Of A Playlist", done => {
        CodyMusic.getPlaylistNames("iTunes").then((names: []) => {
            expect(names).to.not.equal(0);
            // get the last name in the list and get the tracks
            CodyMusic.getTracksByPlaylistName(
                PlayerName.ItunesDesktop,
                names[names.length - 1]
            ).then((result: any) => {
                expect(result.length).to.not.equal(0);
                done();
            });
        });
    });

    it("Should Set An Itunes Song's Love State", done => {
        musicCtr.launchApp(PlayerName.ItunesDesktop).then(async () => {
            musicUtil.sleep(1500);
            await CodyMusic.setVolume("iTunes", 5);
            await CodyMusic.play("iTunes");
            musicUtil.sleep(1500);
            let result = await CodyMusic.getState("iTunes");
            let loved = result.loved;
            CodyMusic.setItunesLoved(!loved).then(async (result: any) => {
                // get the state again
                result = await CodyMusic.getState("iTunes");
                expect(result.loved).to.equal(!loved);
                done();
            });
        });
    });

    it("Should Show An Error", done => {
        // play a bad track number
        CodyMusic.playTrack("iTunes", 1000000000).then((result: any) => {
            expect(result.error).to.not.equal(null);
            musicCtr.quitApp(PlayerName.ItunesDesktop).then(() => {
                done();
            });
        });
    });

    it("Should Show Spotify Is Not Running", done => {
        musicCtr.quitApp(PlayerName.SpotifyDesktop).then(() => {
            CodyMusic.isSpotifyRunning().then((result: any) => {
                expect(result).to.equal(false);
                done();
            });
        });
    });

    it("Should Show Itunes Is Not Running", done => {
        musicCtr.quitApp(PlayerName.ItunesDesktop).then(() => {
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
        musicCtr.launchApp(PlayerName.SpotifyDesktop).then(async () => {
            musicUtil.sleep(2000);
            await CodyMusic.setVolume("Spotify", 5);
            // artist: 'Martin Garrix',
            // album: 'High On Life (feat. Bonn)'
            // id: spotify:track:4ut5G4rgB1ClpMTMfjoIuy
            let params = ["spotify:track:4ut5G4rgB1ClpMTMfjoIuy"];

            await CodyMusic.playTrackInContext("Spotify", params);
            musicUtil.sleep(1500);
            let result = await CodyMusic.getState("Spotify");
            expect(result.id).to.equal("spotify:track:4ut5G4rgB1ClpMTMfjoIuy");
            done();
        });
    });

    // example result
    // {"artist": "Loud Forest","album": "Out of Sight - Single",
    // "genre":"Alternative","disc_number": 1,"duration": 212.042007446289,
    // "played_count": 120,"track_number": 1,"id": "5601","name": "Out of Sight","state":"playing"}
    it("Get iTunes Track Info", done => {
        musicCtr.launchApp(PlayerName.ItunesDesktop).then(async () => {
            musicUtil.sleep(1500);
            await CodyMusic.setVolume("iTunes", 5);
            await CodyMusic.play("iTunes");
            musicUtil.sleep(1500);
            let result = await CodyMusic.getState("iTunes");
            expect(result.artist).to.not.equal(null);
            done();
        });
    });

    it("Tell Spotify To Perform Next, Repeat, Previous, Pause, Shuffle, Volume Change, Mute, Unmute, Shuffle, Check Shuffle", done => {
        musicCtr
            .launchApp(PlayerName.SpotifyDesktop)
            .then(async () => {
                musicUtil.sleep(1500);
                let params = [
                    "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                    "spotify:album:6ZG5lRT77aJ3btmArcykra"
                ];

                await CodyMusic.playTrackInContext("Spotify", params);
                musicUtil.sleep(1500);

                let result = await CodyMusic.getState("Spotify");
                // make sure it's playing
                expect(result.state).to.equal("playing");
                expect(result.name).to.equal("Trouble");
                // check if it's disk_number is greater than 1
                let diskNum = result.disk_number;
                let previousSong;
                if (diskNum === 1) {
                    // we're at disk one, just test using next and previous
                    await CodyMusic.next("Spotify");
                    musicUtil.sleep(1500);
                    await CodyMusic.next("Spotify");
                    musicUtil.sleep(1500);

                    // go to the previous song
                    await CodyMusic.previous("Spotify");
                    musicUtil.sleep(3000);
                    // check
                    result = await CodyMusic.getState("Spotify");
                    previousSong = result.name;
                    expect(previousSong).to.not.equal("Trouble");
                } else {
                    // go to the previous song
                    await CodyMusic.previous("Spotify");
                    musicUtil.sleep(3000);
                    // check
                    result = await CodyMusic.getState("Spotify");
                    previousSong = result.name;
                    expect(previousSong).to.equal("Trouble");
                }

                // pause it
                await CodyMusic.pause("Spotify");
                musicUtil.sleep(1500);
                // check
                result = await CodyMusic.getState("Spotify");
                expect(result.state).to.equal("paused");
                // go to next
                await CodyMusic.next("Spotify");
                musicUtil.sleep(1500);
                // check
                result = await CodyMusic.getState("Spotify");
                let nextSong = result.name;
                expect(nextSong).to.not.equal(previousSong);
                // turn repeat on
                await CodyMusic.setRepeat("Spotify", true);
                // check
                result = await CodyMusic.isRepeating("Spotify");
                expect(result).to.equal(true);
                // turn repeat off
                await CodyMusic.setRepeat("Spotify", false);
                // check
                result = await CodyMusic.isRepeating("Spotify");
                expect(result).to.equal(false);
                // up the volume
                await CodyMusic.volumeUp("Spotify");
                // check
                result = await CodyMusic.getState("Spotify");
                const volume = result.volume;
                expect(volume).to.be.greaterThan(5);

                // mute and unmute tests
                await CodyMusic.mute("Spotify");
                result = await CodyMusic.getState("Spotify");
                expect(result.volume).to.equal(0);

                await CodyMusic.unmute("Spotify");
                result = await CodyMusic.getState("Spotify");
                expect(result.volume).to.be.within(volume - 1, volume + 1);

                // play track
                await CodyMusic.playTrack(
                    "Spotify",
                    "spotify:track:4ut5G4rgB1ClpMTMfjoIuy"
                );
                result = await CodyMusic.getState("Spotify");
                expect(result.artist).to.equal("Martin Garrix");

                // shuffle test
                await CodyMusic.setShuffle("Spotify", true);
                result = await CodyMusic.isShuffling("Spotify");
                expect(result).to.equal(true);

                await musicCtr.quitApp(PlayerName.SpotifyDesktop);

                done();
            })
            .catch((err: any) => {
                console.log("failed to run itunes tests: ", err.message);
                done();
            });
    });

    it("Tell Itunes To Perform Next, Repeat, Previous, Pause, Shuffle, Volume Change, Mute, Unmute, Shuffle, Check Shuffle", done => {
        musicCtr
            .launchApp(PlayerName.ItunesDesktop)
            .then(async () => {
                musicUtil.sleep(1500);
                await CodyMusic.play("iTunes");
                musicUtil.sleep(1500);

                let result = await CodyMusic.getState("iTunes");
                // make sure it's playing
                expect(result.state).to.equal("playing");
                let songName = result.name;

                // go to the next song
                await CodyMusic.next("iTunes");

                // check
                result = await CodyMusic.getState("iTunes");
                expect(result.name).to.not.equal(songName);
                songName = result.name;
                // pause it
                await CodyMusic.pause("iTunes");
                // check
                result = await CodyMusic.getState("iTunes");
                expect(result.state).to.equal("paused");
                // go to previous
                await CodyMusic.previous("iTunes");
                // check
                result = await CodyMusic.getState("iTunes");
                expect(result.name).to.not.equal(songName);
                songName = result.name;
                // turn repeat on
                await CodyMusic.setRepeat("iTunes", true);
                result = await CodyMusic.getState("iTunes");
                // check
                result = await CodyMusic.isRepeating("iTunes");
                expect(result).to.equal("one");
                // turn repeat off
                await CodyMusic.setRepeat("iTunes", false);
                // check
                result = await CodyMusic.isRepeating("iTunes");
                expect(result).to.equal("off");
                // up the volume
                await CodyMusic.volumeUp("iTunes");
                // check
                result = await CodyMusic.getState("iTunes");
                const volume = result.volume;
                expect(volume).to.be.greaterThan(5);

                // mute and unmute tests
                await CodyMusic.mute("iTunes");
                result = await CodyMusic.getState("iTunes");
                expect(result.volume).to.equal(0);

                await CodyMusic.unmute("iTunes");
                result = await CodyMusic.getState("iTunes");
                expect(result.volume).to.equal(volume);

                // play track
                await CodyMusic.playTrack("iTunes", 1);
                result = await CodyMusic.getState("iTunes");

                // shuffle test
                await CodyMusic.setShuffle("iTunes", true);
                result = await CodyMusic.isShuffling("iTunes");
                expect(result).to.equal(true);

                await musicCtr.quitApp(PlayerName.ItunesDesktop);

                done();
            })
            .catch((err: any) => {
                console.log("failed to run itunes tests: ", err.message);
                done();
            });
    });
});
