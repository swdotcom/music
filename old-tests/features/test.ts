import { TestUtil } from "../util";
const expect = require("chai").expect;
const CodyMusic = require("../../dist/index.js");

const testUtil = new TestUtil();

describe("feature api tests", () => {
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

    it("Fetch spotify audio features", done => {
        const spotifyTrackIdOne = "0i0wnv9UoFdZ5MfuFGQzMy";
        const spotifyTrackIdTwo = "4ut5G4rgB1ClpMTMfjoIuy";
        const ids = [
            spotifyTrackIdOne, // 'Last Hurrah'
            spotifyTrackIdTwo
        ];
        CodyMusic.getSpotifyAudioFeatures(ids).then((result: any) => {
            // make sure we have features for both
            let map: any = {};
            let foundTrackOne = false;
            let foundTrackTwo = false;
            for (let i = 0; i < result.length; i++) {
                let feature = result[i];
                if (feature.id === spotifyTrackIdOne) {
                    foundTrackOne = true;
                } else if (feature.id === spotifyTrackIdTwo) {
                    foundTrackTwo = true;
                }
            }

            expect(foundTrackOne).to.equal(true);
            expect(foundTrackTwo).to.equal(true);
            done();
        });
    });
});
