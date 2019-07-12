const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";
import { PlayerName, PlaylistItem, Track } from "../../lib/models";
import { UserProfile, SpotifyUser } from "../../lib/profile";

const userProfile = UserProfile.getInstance();

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
        done();
    });

    it("return songs not in a playlist", done => {
        CodyMusic.getSavedTracks(PlayerName.SpotifyWeb, { limit: 50 })
            .then(result => {
                expect(result.length).to.not.equal(0);
                done();
            })
            .catch(err => {
                console.log("error getting saved tracks: ", err.message);
            });
    });

    it("return the tracks of a playlist", done => {
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

    it("return a spotify track by id", done => {
        // spotify:track:4iVVU8DyQvOVsKafv3KWIF
        CodyMusic.getSpotifyTrackById(
            "spotify:track:4iVVU8DyQvOVsKafv3KWIF"
        ).then((track: Track) => {
            expect(track.uri).to.equal("spotify:track:4iVVU8DyQvOVsKafv3KWIF");
            done();
        });
    });
});
