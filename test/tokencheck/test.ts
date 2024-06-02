const expect = require("chai").expect;
import * as CodyMusic from "../../index";
import { TestUtil } from "../util";

const testUtil = new TestUtil();

/**
 * Don't add "async" into the it condition.
 * i.e. it("description text", async (done) => {
 *     // do stuff
 * });
 * It will return the following error if you do.
 * "Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both."
 */
describe("recently playing tracks tests", () => {
    it("Validate refreshing an expired access token", async () => {
      testUtil.initializeSpotifyConfig('expired');
      expect(await CodyMusic.accessExpired()).to.be.false;
    });

    it("Validate getting non-expired token response", async () => {
      testUtil.initializeSpotifyConfig();
      expect(await CodyMusic.accessExpired()).to.be.false;
    });

    it("Validate getting non-expired token response", async () => {
      testUtil.initializeSpotifyConfig('expired', 'bad_secret');
      expect(await CodyMusic.accessExpired()).to.be.true;
    });

    it("Returns a 401 status", async () => {
      const resp:CodyMusic.CodyResponse = await CodyMusic.pause(CodyMusic.PlayerName.SpotifyWeb);
      expect(resp.status).to.equal(401);
    });

    it("Returns an expired status text", async () => {
      const resp:CodyMusic.CodyResponse = await CodyMusic.pause(CodyMusic.PlayerName.SpotifyWeb);
      expect(resp.statusText).to.equal('EXPIRED');
    });
});
