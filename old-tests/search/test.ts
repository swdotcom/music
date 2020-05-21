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

    it("search for tracks", async () => {
        let result = await CodyMusic.searchTracks(
            "track:what a time artist:tom",
            1
        );
        expect(result.tracks.items.length).to.not.equal(0);

        result = await CodyMusic.searchTracks(
            "artist:Nicky Jam & Enrique Iglesias track:El Perdón",
            1
        );
        expect(result.tracks.items.length).to.not.equal(0);

        // trying again to show we're using cache
        result = await CodyMusic.searchTracks(
            "artist:Nicky Jam & Enrique Iglesias track:El Perdón",
            1
        );

        expect(result.tracks.items.length).to.not.equal(0);
    });

    xit("search for artists", async () => {
        let result = await CodyMusic.searchArtists("walker", 1);
        expect(result.artists.items.length).to.not.equal(0);
    });
});
