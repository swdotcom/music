"use strict";
const expect = require("chai").expect;
const index = require("../dist/index.js");

describe("get active music player function test", () => {
    it("should return nothing is running", async () => {
        const result = await index.isAnythingRunning();
        expect(result).to.equal(false);
    });
    // it("should return spotify is not active", () => {
    //     var result = index.getPlural("Boy");
    //     expect(result).to.equal("Boys");
    // });
    // it("should return Girls", () => {
    //     var result = index.getPlural("Girl");
    //     expect(result).to.equal("Girls");
    // });
    // it("should return Geese", () => {
    //     var result = index.getPlural("Goose");
    //     expect(result).to.equal("Geese");
    // });
    // it("should return Toys", () => {
    //     var result = index.getPlural("Toy");
    //     expect(result).to.equal("Toys");
    // });
    // it("should return Men", () => {
    //     var result = index.getPlural("Man");
    //     expect(result).to.equal("Men");
    // });
});
