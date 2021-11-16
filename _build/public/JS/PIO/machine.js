"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Machine = void 0;
const FIFO_js_1 = require("./FIFO.js");
const utils_js_1 = require("../utils.js");
class Machine {
    pio;
    offset;
    position;
    nextposition;
    running;
    clkdiv = 1;
    clk = 0;
    config;
    curinstgen = null;
    nextinstgen = null;
    lastresult;
    input_shift_counter = 0;
    output_shift_counter = 0;
    RX_FIFO = new FIFO_js_1.FIFO(4);
    TX_FIFO = new FIFO_js_1.FIFO(4);
    _X = 0;
    get X() {
        return this._X;
    }
    set X(v) {
        this._X = (0, utils_js_1.LikeInteger32)(v);
    }
    _Y = 0;
    get Y() {
        return this._Y;
    }
    set Y(v) {
        this._Y = (0, utils_js_1.LikeInteger32)(v);
    }
    STATUS = 0;
    _ISR = 0;
    set ISR(v) {
        this.input_shift_counter = 0;
        this._ISR = (0, utils_js_1.LikeInteger32)(v);
    }
    get ISR() {
        return this._ISR;
    }
    _OSR = 0;
    set OSR(v) {
        this.output_shift_counter = 0;
        this._OSR = (0, utils_js_1.LikeInteger32)(v);
    }
    get OSR() {
        return this._OSR;
    }
    set PC(v) {
        this.nextposition = this.offset + v;
    }
    get has_program() {
        return !(this.config == undefined || this.config == null);
    }
    GetJumpPin() {
        return this.pio.GetPin(this.config.jmp_pin);
    }
    EXEC(inst) {
        this.nextinstgen = this.LoadInstruction(this.pio.DecodeInstruction(inst));
    }
    LoadInstruction(instruction) {
        return instruction.Execute(this);
    }
    LoadInstructionFromPosition(block, position) {
        console.log(position);
        return this.LoadInstruction(block.instructions[position]);
    }
    NextInstruction(block) {
        if (this.nextinstgen != null) {
            this.curinstgen = this.nextinstgen;
            this.nextinstgen = null;
            return;
        }
        this.position = this.nextposition;
        this.nextposition++;
        if (this.nextposition == this.config.wrap)
            this.nextposition = this.config.wrap_target;
        if (this.nextposition >= this.config.length)
            this.nextposition = this.offset;
        this.curinstgen = this.LoadInstructionFromPosition(block, this.position);
    }
    GetInPins() {
        let n = 0;
        for (let i = 0; i < this.config.in_pins_n; i++) {
            let v = +this.pio.GetPin(this.config.in_pins_base + i);
            n |= (v << i);
        }
        return n;
    }
    GetOutPins() {
        let n = 0;
        for (let i = 0; i < this.config.set_pins_n; i++) {
            let v = +this.pio.GetPin(this.config.set_pins_base + i);
            n |= (v << i);
        }
        return n;
    }
    GetSetPins() {
        let n = 0;
        for (let i = 0; i < this.config.out_pins_n; i++) {
            let v = +this.pio.GetPin(this.config.out_pins_base + i);
            n |= (v << i);
        }
        return n;
    }
    SetOutPins(val) {
        if (this.config.out_pins_n == 0) {
            this.pio.LogWarning("Attempting to set pins even though none are assigned. Did you forget to assign them?");
        }
        for (let i = 0; i < this.config.out_pins_n; i++) {
            this.pio.SetPin(this.config.out_pins_base + i, !!(val & (1 << i)));
        }
    }
    SetSetPins(val) {
        if (this.config.set_pins_n == 0) {
            this.pio.LogWarning("Attempting to set pins even though none are assigned. Did you forget to assign them?");
        }
        for (let i = 0; i < this.config.set_pins_n; i++) {
            this.pio.SetPin(this.config.set_pins_base + i, !!(val & (1 << i)));
        }
    }
    SetSideset(val) {
        if (this.config.sideset_n == 0) {
            this.pio.LogError("Attempting to set sideset even though there are no pins assigned to it. This should not compile.");
        }
        for (let i = 0; i < this.config.sideset_n; i++) {
            this.pio.SetPin(this.config.sideset_base + i, !!(val & (1 << i)));
        }
    }
    SetPindirs(val) {
        if (this.config.pindirs_n == 0) {
            this.pio.LogWarning("Attempting to set pindirs even though none are assigned. Did you forget to assign them?");
        }
        for (let i = 0; i < this.config.pindirs_n; i++) {
            this.pio.SetPinDir(this.config.pindirs_base + i, !!(val & (1 << i)));
        }
    }
    Tick(block) {
        if (this.curinstgen == null)
            this.NextInstruction(block);
        this.lastresult = this.curinstgen?.next();
        if (this.lastresult?.done) {
            this.NextInstruction(block);
        }
    }
    ClocksTillTick() {
        if (this.clk > this.clkdiv)
            return 0;
        return (this.clkdiv - this.clk);
    }
    ClockDivisor() {
        return this.clkdiv;
    }
    Clock(block, n) {
        (0, utils_js_1.Assert)(this.config != undefined);
        this.clk += n;
        let ts = 0;
        while (this.clk >= this.clkdiv) {
            this.clk -= this.clkdiv;
            this.Tick(block);
            ts++;
        }
        return ts;
    }
    SetProgram(config, offset) {
        this.offset = offset;
        this.position = offset;
        this.nextposition = offset;
        this.config = config;
        this.RX_FIFO.Clear();
        this.TX_FIFO.Clear();
        this.curinstgen = null;
        this.lastresult = undefined;
        this.input_shift_counter = 0;
        this.output_shift_counter = 0;
    }
    RemoveProgram() {
        this.offset = -1;
        this.position = -1;
        this.config = null;
        this.running = false;
    }
    constructor(pio) {
        this.pio = pio;
    }
}
exports.Machine = Machine;
//# sourceMappingURL=machine.js.map