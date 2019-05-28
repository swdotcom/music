const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";
import { PlayerName } from "../../lib/models";

const testUtil = new TestUtil();

/**
 * Don't add "async" into the it condition.
 * i.e. xit("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("spotify playlist tests", () => {
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

    after("clean up spotify playlist testing", done => {
        done();
    });

    it("create a spotify playlist", done => {
        CodyMusic.createPlaylist("cody-favs", false /*isPublic*/).then(
            result => {
                expect(result.data.id).to.not.equal("");
                const playlist_id = result.data.id;
                CodyMusic.deletePlaylist(playlist_id).then(result => {
                    expect(result.status).to.equal(200);
                    done();
                });
            }
        );
    });

    it("return spotify playlists", done => {
        CodyMusic.getPlaylists(PlayerName.SpotifyWeb).then(result => {
            expect(result.length).to.not.equal(0);
            done();
        });
    });

    it("return spotify playlist names", done => {
        CodyMusic.getPlaylistNames(PlayerName.SpotifyWeb).then(result => {
            expect(result.length).to.not.equal(0);
            done();
        });
    });

    it("return the tracks of a playlist", done => {
        CodyMusic.getPlaylists(PlayerName.SpotifyWeb).then(result => {
            let playlist_id = result[0].id;
            CodyMusic.getPlaylistTracks(
                PlayerName.SpotifyWeb,
                playlist_id
            ).then(result => {
                expect(result.data.items[0].track).to.not.equal(null);
                done();
            });
        });
    });
});
