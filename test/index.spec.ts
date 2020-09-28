import assert from "assert";
import { add, minus } from "../src/index";

describe("validate:", () => {
    /**
     * add
     */
    describe("add", () => {
        test(" test for add() function ", () => {
            assert.strictEqual(add(1, 2), 3);
        });
    });
    /**
     * minus
     */
    describe("minus", () => {
        test(" test for minus() function ", () => {
            assert.strictEqual(minus(3, 2), 1);
        });
    });
});