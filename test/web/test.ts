import { MusicUtil } from "../../lib/util";
const expect = require("chai").expect;
import * as CodyMusic from "../../index";

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
    before(done => {
        const accessToken = "123abc";
        CodyMusic.setCredentials({
            refreshToken:
                "AQCSjp8_taBNv46KFtHsRpU9IcppjCDyGBWN4pATLLXqBPa4Wjk38CY703-WnG4xk7zVbU7niLKQrsYi_zkGnFIy2HuZv-RyiU9fwkE-uw3HUI-vqWBxZoEbdZEIcM1zIqPs3w",
            clientSecret: "2b40b4975b2743189c87f4712c0cd59e",
            clientId: "eb67e22ba1c6474aad8ec8067480d9dc",
            accessToken: accessToken
        });

        let setAccessToken = CodyMusic.getAccessToken();

        expect(setAccessToken).to.equal(accessToken);

        CodyMusic.getSpotifyDevices().then(
            async (response: CodyMusic.PlayerDevice[]) => {
                let hasComputerDevice = false;
                if (response) {
                    for (let i = 0; i < response.length; i++) {
                        let element: any = response[i];
                        if (element.type === "Computer") {
                            hasComputerDevice = true;
                            break;
                        }
                    }
                }

                if (!hasComputerDevice) {
                    // launch the web player
                    // High on Life
                    const albumId = "1GUfof1gHsqYjoHFym3aim";
                    await CodyMusic.launchPlayer(
                        CodyMusic.PlayerName.SpotifyWeb,
                        {
                            album: albumId
                        }
                    );
                    musicUtil.sleep(5000);
                }
                done();
            }
        );
    });

    after("web play music test completion", done => {
        CodyMusic.getSpotifyDevices().then(async (response: any) => {
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
        CodyMusic.getSpotifyDevices().then((response: any) => {
            expect(response.length).to.not.equal(0);
            done();
        });
    });

    it("Play on spotify device", done => {
        CodyMusic.getSpotifyDevices().then(async (response: any) => {
            // get the 1st device id
            const device_id = response[0].id;
            response = await CodyMusic.playSpotifyDevice(device_id);
            musicUtil.sleep(3000);
            expect(response.status).to.equal(204);
            done();
        });
    });

    it("Pause web player", done => {
        CodyMusic.getSpotifyDevices().then(async (response: any) => {
            // get the 1st device id
            const device_id = response[0].id;
            const options = {
                device_id
            };
            response = await CodyMusic.pause(
                CodyMusic.PlayerName.SpotifyWeb,
                options
            );
            musicUtil.sleep(3000);
            expect(response.status).to.equal(204);
            done();
        });
    });

    it("Play specific track and validate track is playing", done => {
        CodyMusic.getSpotifyDevices().then(async (response: any) => {
            // get the 1st device id
            const device_id = response[0].id;
            // https://open.spotify.com/track/0i0wnv9UoFdZ5MfuFGQzMy
            // name: 'Last Hurrah'
            // id: spotify:track:0i0wnv9UoFdZ5MfuFGQzMy
            const track_id = "spotify:track:0i0wnv9UoFdZ5MfuFGQzMy";
            const options = {
                device_id,
                track_ids: [track_id]
            };
            response = await CodyMusic.play(
                CodyMusic.PlayerName.SpotifyWeb,
                options
            );
            musicUtil.sleep(3000);

            expect(response.status).to.equal(204);
            CodyMusic.getState(CodyMusic.PlayerName.SpotifyWeb).then(
                (response: any) => {
                    expect(response.uri).to.equal(track_id);
                    done();
                }
            );
        });
    });

    it("Go to the next and previous track", done => {
        CodyMusic.getSpotifyDevices().then(async (response: any) => {
            // get the 1st device id
            const device_id = response[0].id;
            let options = {
                device_id,
                track_ids: [
                    "spotify:track:4ut5G4rgB1ClpMTMfjoIuy",
                    "spotify:track:0i0wnv9UoFdZ5MfuFGQzMy"
                ]
            };

            response = await CodyMusic.play(
                CodyMusic.PlayerName.SpotifyWeb,
                options
            );
            musicUtil.sleep(3000);

            delete options["track_ids"];

            response = await CodyMusic.next(
                CodyMusic.PlayerName.SpotifyWeb,
                options
            );
            musicUtil.sleep(1000);

            response = await CodyMusic.next(
                CodyMusic.PlayerName.SpotifyWeb,
                options
            );
            musicUtil.sleep(1000);

            done();
        });
    });
});
