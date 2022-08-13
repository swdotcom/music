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
    it("Validate getting expired access token response", async () => {
        let configFile = __dirname + "/../../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.newClientSecret,
            clientId: data.newClientId,
            accessToken: data.accessToken,
        });
        const expired = await CodyMusic.accessExpired();
        expect(expired).to.be.true;
    });

    it("Validate getting non-expired token response", async () => {
        let configFile = __dirname + "/../../config.json";
        let data = testUtil.getJsonFromFile(configFile);
        CodyMusic.setCredentials({
            refreshToken: data.refreshToken,
            clientSecret: data.clientSecret,
            clientId: data.clientId,
            accessToken: data.accessToken,
        });
        const expired = await CodyMusic.accessExpired();
        expect(expired).to.be.false;
    });
});
