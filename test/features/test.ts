const expect = require("chai").expect;
const CodyMusic = require("../../dist/index.js");

describe("feature api tests", () => {
    before(done => {
        const accessToken = "123abc";
        CodyMusic.setCredentials({
            refreshToken:
                "AQCSjp8_taBNv46KFtHsRpU9IcppjCDyGBWN4pATLLXqBPa4Wjk38CY703-WnG4xk7zVbU7niLKQrsYi_zkGnFIy2HuZv-RyiU9fwkE-uw3HUI-vqWBxZoEbdZEIcM1zIqPs3w",
            clientSecret: "2b40b4975b2743189c87f4712c0cd59e",
            clientId: "eb67e22ba1c6474aad8ec8067480d9dc",
            accessToken: accessToken
        });

        done();
    });

    it("Fetch genre from itunes using artist and song", done => {
        CodyMusic.getGenre("Hozier", "Movement - Single").then(
            (result: any) => {
                expect(result).to.not.equal("");
                done();
            }
        );
    });

    it("Fetch genre from itunes using artist", done => {
        CodyMusic.getGenre("Hozier").then((result: any) => {
            expect(result).to.not.equal("");
            done();
        });
    });

    it("Fetch genre from spotify using artist", done => {
        CodyMusic.getSpotifyGenre("Alec Benjamin").then((result: any) => {
            expect(result).to.not.equal("");
            done();
        });
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
