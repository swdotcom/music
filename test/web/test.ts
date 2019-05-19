import { PlayerName, PlayerType } from "../../lib/models";
import { MusicUtil } from "../../lib/util";
const expect = require("chai").expect;
const CodyMusic = require("../../dist/index.js");

const musicUtil = new MusicUtil();

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("web player music tests", () => {
    beforeEach(done => {
        const accessToken = "123abc";
        CodyMusic.setCredentials({
            refreshToken:
                "AQCSjp8_taBNv46KFtHsRpU9IcppjCDyGBWN4pATLLXqBPa4Wjk38CY703-WnG4xk7zVbU7niLKQrsYi_zkGnFIy2HuZv-RyiU9fwkE-uw3HUI-vqWBxZoEbdZEIcM1zIqPs3w",
            clientSecret: "2b40b4975b2743189c87f4712c0cd59e",
            clientId: "eb67e22ba1c6474aad8ec8067480d9dc",
            accessToken: accessToken
        });

        let setAccessToken = CodyMusic.getAccessToken("accessToken");

        expect(setAccessToken).to.equal(accessToken);

        CodyMusic.getSpotifyWebDevices().then((response: []) => {
            if (response.length === 0) {
                // launch the web player
                // High on Life
                const albumId = "1GUfof1gHsqYjoHFym3aim";
                CodyMusic.launchPlayer(PlayerType.WebSpotify, {
                    album: albumId
                }).then(() => {
                    musicUtil.sleep(3000);
                    done();
                });
            } else {
                done();
            }
        });
    });

    it("Check the spotify web player devices", done => {
        /**
         * [ { id: '116ab2c405ba92f106f4d10d45bb42cba89ec9e2',
            is_active: false,
            is_private_session: false,
            is_restricted: false,
            name: 'Web Player (Chrome)',
            type: 'Computer',
            volume_percent: 100 } ]
         */
        CodyMusic.getSpotifyWebDevices().then((response: any) => {
            expect(response.length).to.not.equal(0);
            done();
        });
    });

    it("Play on spotify device", done => {
        CodyMusic.getSpotifyWebDevices().then((response: any) => {
            // get the 1st device id
            const device_id = response[0].id;
            CodyMusic.playSpotifyDevice(device_id, true /* play */).then(
                (response: any) => {
                    expect(response.status).to.equal(204);
                    done();
                }
            );
        });
    });

    it("Pause web player", done => {
        CodyMusic.getSpotifyWebDevices().then((response: any) => {
            // get the 1st device id
            const device_id = response[0].id;
            const qsOptions = {
                device_id
            };
            CodyMusic.pause(PlayerName.SpotifyWeb, qsOptions).then(
                (response: any) => {
                    expect(response.status).to.equal(204);
                    done();
                }
            );
        });
    });

    it("Play specific track", done => {
        CodyMusic.getSpotifyWebDevices().then((response: any) => {
            // get the 1st device id
            const device_id = response[0].id;
            // https://open.spotify.com/track/0i0wnv9UoFdZ5MfuFGQzMy
            // name: 'Last Hurrah'
            // id: spotify:track:0i0wnv9UoFdZ5MfuFGQzMy
            const qsOptions = {
                device_id,
                uris: ["spotify:track:0i0wnv9UoFdZ5MfuFGQzMy"]
            };
            CodyMusic.play("spotify-web", qsOptions).then((response: any) => {
                expect(response.status).to.equal(204);
                done();
            });
        });
    });
});
