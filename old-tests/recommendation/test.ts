const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { MusicUtil } from "../../lib/util";
import { MusicController } from "../../lib/controller";
import { TestUtil } from "../util";

const testUtil = new TestUtil();

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
describe("track recommendation tests", () => {
    beforeEach(done => {
        let configFile = __dirname + "/../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.accessToken
        });

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

    it("Get recommended tracks", async () => {
        let limit = 5;
        let recommendedTracks = await CodyMusic.getRecommendationsForTracks(
            ["4ut5G4rgB1ClpMTMfjoIuy"],
            limit,
            "US",
            2,
            10,
            [],
            [],
            {min_valence: 0.9, target_energy: 0.8}
        );

        let names = recommendedTracks.map(track => {
            return track.name;
        });

        let myTrack = await CodyMusic.getSpotifyTrackById(
            "spotify:track:0i0wnv9UoFdZ5MfuFGQzMy"
        );

        console.log(`requested ${limit} recommendations`);
        console.log("seed track: ", myTrack.name);
        console.log("recommended tracks: ", names.join(", "));
    });

    it("Get recommended track for multiple seed", async () => {
        let limit = 10;
        let recommendedTracks = await CodyMusic.getRecommendationsForTracks(
            [
                "4oDZ5L8izBals6jKBJDBcX",
                "7wJ68ofWLxPI4uCokb7J91",
                "2jQR1VmFDXexGGIWQD3zop"
            ],
            limit,
            "US",
            2
        );

        let names = recommendedTracks.map(track => {
            return track.name;
        });

        let myTrack1 = await CodyMusic.getSpotifyTrackById(
            "spotify:track:4ut5G4rgB1ClpMTMfjoIuy"
        );
        let myTrack2 = await CodyMusic.getSpotifyTrackById(
            "spotify:track:0i0wnv9UoFdZ5MfuFGQzMy"
        );

        console.log(`requested ${limit} recommendations`);
        console.log("seed tracks: ", myTrack1.name, myTrack2.name);
        console.log("recommended tracks: ", names.join(", "));
    });
});
