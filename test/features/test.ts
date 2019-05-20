const expect = require("chai").expect;
const CodyMusic = require("../../dist/index.js");

describe("feature api tests", () => {
    it("Fetch genre from itunes or spotify using artist and song", done => {
        CodyMusic.getGenre("Hozier", "Movement - Single").then(
            (result: any) => {
                expect(result).to.not.equal("");
                done();
            }
        );
    });

    it("Fetch genre from itunes or spotify using artist", done => {
        CodyMusic.getGenre("Hozier").then((result: any) => {
            expect(result).to.not.equal("");
            done();
        });
    });
});
