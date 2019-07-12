const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";
import { PlayerName, Track, PlayerDevice, TrackStatus } from "../../lib/models";
import { MusicUtil } from "../../lib/util";

const musicUtil = new MusicUtil();
const testUtil = new TestUtil();

/**
 * Don't add "async" into the it condition.
 * i.e. xit("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("spotify nonplaylist tests", () => {
    before(done => {
        let configFile = __dirname + "/../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.accessToken
        });

        done();
    });

    after("clean up spotify nonplaylist testing", done => {
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

    it("return songs not in a playlist", done => {
        CodyMusic.getSpotifyDevices().then(devices => {
            CodyMusic.getSavedTracks(PlayerName.SpotifyWeb, { limit: 50 })
                .then(result => {
                    expect(result.length).to.not.equal(0);
                    if (devices && devices.length > 0) {
                        const track: Track = result[0];
                        const track_id = track.uri;
                        const device: PlayerDevice = devices[0];
                        const options = {
                            device_id: device.id,
                            track_ids: [track_id]
                        };
                        // play this track
                        CodyMusic.play(
                            CodyMusic.PlayerName.SpotifyWeb,
                            options
                        ).then(result => {
                            musicUtil.sleep(3000);
                            expect(result.status).to.equal(204);
                            done();
                        });
                    } else {
                        done();
                    }
                })
                .catch(err => {
                    console.log("error getting saved tracks: ", err.message);
                });
        });
    });

    xit("return the tracks of a playlist", done => {
        CodyMusic.getPlaylists(PlayerName.SpotifyWeb).then(result => {
            let playlist_id = result[0].id;
            CodyMusic.getPlaylistTracks(
                PlayerName.SpotifyWeb,
                playlist_id
            ).then(async result => {
                expect(result.data.items.length).to.not.equal(0);
                done();
            });
        });
    });

    xit("return a spotify track by id", done => {
        CodyMusic.getSpotifyTrackById(
            "spotify:track:4iVVU8DyQvOVsKafv3KWIF",
            true
        )
            .then((track: Track) => {
                expect(track.uri).to.equal(
                    "spotify:track:4iVVU8DyQvOVsKafv3KWIF"
                );
                done();
            })
            .catch(err => {
                console.log(
                    "failed to return a spotify track by id, error: ",
                    err.message
                );
                done();
            });
    });
});
