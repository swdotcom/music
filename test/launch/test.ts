const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { PlayerName } from "../../lib/models";
import { MusicController } from "../../lib/controller";

const musicCtr = MusicController.getInstance();

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("launch spotify tests", () => {
    before(async () => {
        await musicCtr.quitApp(CodyMusic.PlayerName.SpotifyDesktop);
    });

    it("spotify desktop launch", async () => {
        const result = await CodyMusic.launchPlayer(PlayerName.SpotifyDesktop);
        console.log("result: ", result);
    });
});
