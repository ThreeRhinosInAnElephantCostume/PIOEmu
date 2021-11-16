"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.msleep = exports.LikeInteger32 = exports.Mod = exports.BitRange = exports.BitReverse = exports.AssertRange = exports.Assert = void 0;
function Assert(b, msg = "Unspecified assertion") {
    if (!b)
        throw msg;
}
exports.Assert = Assert;
function AssertRange(arr, indx) {
    Assert(indx >= 0 && indx < arr.length, "Index out of range!");
}
exports.AssertRange = AssertRange;
function BitReverse(n, nbits = 32) {
    let r = 0;
    for (let i = 0; i < nbits; i++) {
        r |= (n & (1 << (nbits - i - 1)));
    }
    return r;
}
exports.BitReverse = BitReverse;
function BitRange(n, low, high, reverse = false) {
    let r = 0;
    if (low > high) {
        reverse = !reverse;
        const o = low;
        low = high;
        high = o;
    }
    high++;
    for (let i = 0; i < (high - low); i++) {
        r |= (+!!(n & (1 << (low + i))) << i);
    }
    if (reverse)
        r = BitReverse(r, (high - low));
    return r;
}
exports.BitRange = BitRange;
function Mod(n, m) {
    return ((n % m) + m) % m;
}
exports.Mod = Mod;
const REG32_MAX = Math.pow(2, 32) - 1;
function LikeInteger32(n) {
    return Mod(n, REG32_MAX);
}
exports.LikeInteger32 = LikeInteger32;
function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
exports.msleep = msleep;
function sleep(n) {
    msleep(n * 1000);
}
exports.sleep = sleep;
//# sourceMappingURL=utils.js.map