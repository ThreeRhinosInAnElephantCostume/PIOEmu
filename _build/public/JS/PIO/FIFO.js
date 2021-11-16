"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIFO = void 0;
const utils_js_1 = require("../utils.js");
class FIFO {
    data = [];
    _size;
    get empty() {
        return this.data.length == 0;
    }
    ;
    get full() {
        return this.count == this.capacity;
    }
    get count() {
        return this.data.length;
    }
    get capacity() {
        return this._size;
    }
    Peek() {
        (0, utils_js_1.Assert)(!this.empty);
        return this.data[0];
    }
    Pop(def = null) {
        if (def != null && this.empty)
            return def;
        (0, utils_js_1.Assert)(!this.empty);
        return this.data.splice(0, 1)[0];
    }
    Push(v) {
        if (this.data.length == this.capacity)
            this.Pop();
        this.data.push(v);
    }
    Clear() {
        this.data = [];
    }
    constructor(size) {
        this._size = size;
    }
}
exports.FIFO = FIFO;
//# sourceMappingURL=FIFO.js.map