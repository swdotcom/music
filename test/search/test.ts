const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";
import { PlayerName, Track, PlayerDevice, TrackStatus } from "../../lib/models";
import { MusicUtil } from "../../lib/util";

const testUtil = new TestUtil();

/**
 * Don't add "async" into the it condition.
 * i.e. xit("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("spotify search tests", () => {
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

    it("search for tracks", done => {
        CodyMusic.searchTracks("track:what a time artist:tom", 1)
            .then((result: any) => {
                expect(result.tracks.items.length).to.not.equal(0);
                done();
            })
            .catch((err: any) => {
                console.log("error searching for tracks: ", err.message);
                done();
            });
    });

    it("search for artists", done => {
        CodyMusic.searchArtists("tom walker", 1)
            .then((result: any) => {
                expect(result.artists.items.length).to.not.equal(0);
                done();
            })
            .catch((err: any) => {
                console.log("error searching for tracks: ", err.message);
                done();
            });
    });
});
