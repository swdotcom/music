const expect = require("chai").expect;
const index = require("../dist/index.js");
const util = require("../dist/lib/util.js");

describe("software music tests", () => {
    beforeEach(done => {
        done();
    });

    after(done => {
        index.stopItunesIfRunning().then(result => {
            index.stopSpotifyIfRunning().then(result => {
                done();
            });
        });
    });

    // example result
    // {"artist": "Coldplay","album": "Parachutes","genre": "",
    // "disc_number": 1,"duration": 273426,"played_count": 0,"track_number": 6,
    // "id": "spotify:track:0R8P9KfGJCDULmlEoBagcO","name": "Trouble","state":"playing"}
    it("Get Spotify Track Info", done => {
        index.startSpotifyIfNotRunning().then(() => {
            util.sleep(2000);
            let params = [
                "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                "spotify:album:6ZG5lRT77aJ3btmArcykra"
            ];

            index.playTrackInContext("Spotify", params).then(() => {
                util.sleep(1000);
                index.getState("Spotify").then(result => {
                    expect(result.artist).to.equal("Coldplay");
                    expect(result.name).to.equal("Trouble");
                    done();
                });
            });
        });
    });

    // example result
    // {"artist": "Loud Forest","album": "Out of Sight - Single",
    // "genre":"Alternative","disc_number": 1,"duration": 212.042007446289,
    // "played_count": 120,"track_number": 1,"id": "5601","name": "Out of Sight","state":"playing"}
    it("Get iTunes Track Info", done => {
        index.startItunesIfNotRunning().then(() => {
            util.sleep(2000);
            index.play("iTunes").then(() => {
                util.sleep(1000);
                index.getState("iTunes").then(result => {
                    expect(result.artist).to.not.equal(null);
                    // since we were successful, pause it.
                    // this isn't part of the test, just turning off music.
                    index.pause("iTunes");
                    done();
                });
            });
        });
    });

    it("Get Spotify Paused State", done => {
        index.startSpotifyIfNotRunning().then(() => {
            util.sleep(2000);
            let params = [
                "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                "spotify:album:6ZG5lRT77aJ3btmArcykra"
            ];

            index.playTrackInContext("Spotify", params).then(() => {
                util.sleep(1000);
                index.getState("Spotify").then(result => {
                    try {
                        expect(result.state).to.equal("playing");
                    } catch (e) {
                        console.log("use case error: ", e.message);
                        done();
                    }
                    // pause it
                    index.pause("Spotify").then(result => {
                        util.sleep(1000);
                        index.getState("Spotify").then(result => {
                            expect(result.state).to.equal("paused");
                            done();
                        });
                    });
                });
            });
        });
    });

    it("Get Spotify Play Paused State", done => {
        index.startSpotifyIfNotRunning().then(() => {
            util.sleep(2000);
            let params = [
                "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                "spotify:album:6ZG5lRT77aJ3btmArcykra"
            ];

            index.playTrackInContext("Spotify", params).then(() => {
                util.sleep(1000);
                index.getState("Spotify").then(result => {
                    // make sure it's playing
                    expect(result.state).to.equal("playing");

                    // pause it
                    index.playPause("Spotify").then(result => {
                        util.sleep(1000);
                        index.getState("Spotify").then(result => {
                            expect(result.state).to.equal("paused");
                            done();
                        });
                    });
                });
            });
        });
    });

    it("Go to Next Spotify Track", done => {
        index.startSpotifyIfNotRunning().then(() => {
            util.sleep(2000);
            let params = [
                "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                "spotify:album:6ZG5lRT77aJ3btmArcykra"
            ];

            index.playTrackInContext("Spotify", params).then(() => {
                util.sleep(1000);
                index.getState("Spotify").then(result => {
                    // make sure it's playing
                    expect(result.state).to.equal("playing");
                    expect(result.name).to.equal("Trouble");

                    // pause it
                    index.next("Spotify").then(result => {
                        util.sleep(1000);
                        index.getState("Spotify").then(result => {
                            expect(result.name).to.equal("Parachutes");
                            done();
                        });
                    });
                });
            });
        });
    });

    it("Go to Previous Spotify Track", done => {
        index.startSpotifyIfNotRunning().then(() => {
            util.sleep(2000);
            let params = [
                "spotify:track:0R8P9KfGJCDULmlEoBagcO",
                "spotify:album:6ZG5lRT77aJ3btmArcykra"
            ];

            index.playTrackInContext("Spotify", params).then(() => {
                util.sleep(1000);
                index.getState("Spotify").then(result => {
                    // make sure it's playing
                    expect(result.state).to.equal("playing");
                    expect(result.name).to.equal("Trouble");

                    // pause it
                    index.previous("Spotify").then(result => {
                        util.sleep(1000);
                        index.getState("Spotify").then(result => {
                            expect(result.name).to.equal("Yellow");
                            done();
                        });
                    });
                });
            });
        });
    });
});
