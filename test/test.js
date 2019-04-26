const expect = require("chai").expect;
const music = require("../dist/index.js");
const util = require("../dist/lib/util.js");

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("software music tests", () => {
    beforeEach(done => {
        music
            .stopSpotifyIfRunning()
            .then(result => {
                music
                    .stopItunesIfRunning()
                    .then(result => {
                        done();
                    })
                    .catch(err => {
                        done();
                    });
            })
            .catch(err => {
                music
                    .stopItunesIfRunning()
                    .then(result => {
                        done();
                    })
                    .catch(err => {
                        done();
                    });
            });
    });

    after(done => {
        // make sure both players have been killed
        done();
    });

    it("Should Show The Playlist Names", done => {
        music.playlistNames("iTunes").then(result => {
            let names = result.split(",");
            expect(names).to.not.equal(0);
            done();
        });
    });

    it("Should Show The Tracks Of A Playlist", done => {
        music.getTracksByPlaylistName("iTunes", "Nice").then(result => {
            console.log("playlist tracks: ", result);
            done();
        });
    });

    it("Should Show An Error", done => {
        // play a bad track number
        music.playTrack("iTunes", 1000000000).then(result => {
            expect(result.error).to.not.equal(null);
            music.stopItunesIfRunning().then(() => {
                done();
            });
        });
    });

    it("Should Show Spotify Is Not Running", done => {
        music.stopSpotifyIfRunning().then(() => {
            music.isSpotifyRunning().then(result => {
                expect(result).to.equal(false);
                done();
            });
        });
    });

    it("Should Show Itunes Is Not Running", done => {
        music.stopItunesIfRunning().then(() => {
            music.isItunesRunning().then(result => {
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
        music.startSpotifyIfNotRunning().then(async () => {
            util.sleep(2000);
            await music.setVolume("Spotify", 5);
            let params = [
                "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                "spotify:album:6ZG5lRT77aJ3btmArcykra"
            ];

            await music.playTrackInContext("Spotify", params);
            util.sleep(1000);
            let result = await music.getState("Spotify");
            expect(result.artist).to.equal("Coldplay");
            expect(result.name).to.equal("Trouble");
            done();
        });
    });

    // example result
    // {"artist": "Loud Forest","album": "Out of Sight - Single",
    // "genre":"Alternative","disc_number": 1,"duration": 212.042007446289,
    // "played_count": 120,"track_number": 1,"id": "5601","name": "Out of Sight","state":"playing"}
    it("Get iTunes Track Info", done => {
        music.startItunesIfNotRunning().then(async () => {
            util.sleep(1000);
            await music.setVolume("iTunes", 5);
            await music.play("iTunes");
            util.sleep(1000);
            let result = await music.getState("iTunes");
            expect(result.artist).to.not.equal(null);
            done();
        });
    });

    it("Tell Spotify To Perform Next, Repeat, Previous, Pause, Shuffle, Volume Change, Mute, Unmute, Shuffle, Check Shuffle", done => {
        music
            .startSpotifyIfNotRunning()
            .then(async () => {
                util.sleep(1000);
                let params = [
                    "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                    "spotify:album:6ZG5lRT77aJ3btmArcykra"
                ];

                await music.playTrackInContext("Spotify", params);
                util.sleep(1000);

                let result = await music.getState("Spotify");
                // make sure it's playing
                expect(result.state).to.equal("playing");
                expect(result.name).to.equal("Trouble");

                // go to the previous song
                await music.previous("Spotify");
                // check
                result = await music.getState("Spotify");
                expect(result.name).to.equal("Yellow");
                // pause it
                await music.pause("Spotify");
                // check
                result = await music.getState("Spotify");
                expect(result.state).to.equal("paused");
                // go to next
                await music.next("Spotify");
                // check
                result = await music.getState("Spotify");
                expect(result.name).to.equal("Trouble");
                // turn repeat on
                await music.repeatOn("Spotify");
                // check
                result = await music.isRepeating("Spotify");
                expect(result).to.equal(true);
                // turn repeat off
                await music.repeatOff("Spotify");
                // check
                result = await music.isRepeating("Spotify");
                expect(result).to.equal(false);
                // up the volume
                await music.volumeUp("Spotify");
                // check
                result = await music.getState("Spotify");
                const volume = result.volume;
                expect(volume).to.be.greaterThan(5);

                // mute and unmute tests
                await music.mute("Spotify");
                result = await music.getState("Spotify");
                expect(result.volume).to.equal(0);

                await music.unMute("Spotify");
                result = await music.getState("Spotify");
                expect(result.volume).to.be.within(volume - 1, volume + 1);

                // play track
                await music.playTrack(
                    "Spotify",
                    "spotify:track:2YarjDYjBJuH63dUIh9OWv"
                );
                result = await music.getState("Spotify");
                expect(result.artist).to.equal("Wolfgang Amadeus Mozart");

                // shuffle test
                await music.setShufflingOn("Spotify");
                result = await music.isShuffling("Spotify");
                expect(result).to.equal(true);

                await music.stopSpotifyIfRunning();

                done();
            })
            .catch(err => {
                console.log("failed to run itunes tests: ", err.message);
                done();
            });
    });

    it("Tell Itunes To Perform Next, Repeat, Previous, Pause, Shuffle, Volume Change, Mute, Unmute, Shuffle, Check Shuffle", done => {
        music
            .startItunesIfNotRunning()
            .then(async () => {
                util.sleep(1000);
                await music.play("iTunes");
                util.sleep(1000);

                let result = await music.getState("iTunes");
                // make sure it's playing
                expect(result.state).to.equal("playing");
                let songName = result.name;

                // go to the next song
                await music.next("iTunes");

                // check
                result = await music.getState("iTunes");
                expect(result.name).to.not.equal(songName);
                songName = result.name;
                // pause it
                await music.pause("iTunes");
                // check
                result = await music.getState("iTunes");
                expect(result.state).to.equal("paused");
                // go to previous
                await music.previous("iTunes");
                // check
                result = await music.getState("iTunes");
                expect(result.name).to.not.equal(songName);
                songName = result.name;
                // turn repeat on
                await music.repeatOn("iTunes");
                result = await music.getState("iTunes");
                // check
                result = await music.isRepeating("iTunes");
                expect(result).to.equal("one");
                // turn repeat off
                await music.repeatOff("iTunes");
                // check
                result = await music.isRepeating("iTunes");
                expect(result).to.equal("off");
                // up the volume
                await music.volumeUp("iTunes");
                // check
                result = await music.getState("iTunes");
                const volume = result.volume;
                expect(volume).to.be.greaterThan(5);

                // mute and unmute tests
                await music.mute("iTunes");
                result = await music.getState("iTunes");
                expect(result.volume).to.equal(0);

                await music.unMute("iTunes");
                result = await music.getState("iTunes");
                expect(result.volume).to.equal(volume);

                // play track
                await music.playTrack("iTunes", 1);
                result = await music.getState("iTunes");

                // shuffle test
                await music.setShufflingOn("iTunes");
                result = await music.isShuffling("iTunes");
                expect(result).to.equal(true);

                await music.stopItunesIfRunning();

                done();
            })
            .catch(err => {
                console.log("failed to run itunes tests: ", err.message);
                done();
            });
    });
});
