"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.Waveform = exports.Pin = exports.ProgramConfig = exports.PIN_LOW = exports.PIN_HIGH = exports.PINS_N = exports.SAMPLE_BUFFER_SIZE = exports.PIO = void 0;
const block_js_1 = require("./block.js");
const instructions_js_1 = require("./instructions.js");
const utils_js_1 = require("../utils.js");
exports.SAMPLE_BUFFER_SIZE = 1 * 1000 * 1000;
exports.PINS_N = 32;
exports.PIN_HIGH = 3.3;
exports.PIN_LOW = 0;
class ProgramConfig {
    instructions;
    length;
    wrap = 0;
    wrap_target;
    sideset_opt_en = false;
    sideset_n = 0;
    sideset_base = 0;
    set_pins_n = 0;
    set_pins_base = 0;
    out_pins_n = 0;
    out_pins_base = 0;
    in_pins_n = 0;
    in_pins_base = 0;
    pindirs_n = 0;
    pindirs_base = 0;
    jmp_pin = -1;
    constructor(instructions) {
        this.instructions = instructions;
        this.length = instructions.length;
        this.wrap_target = instructions.length;
    }
}
exports.ProgramConfig = ProgramConfig;
class Pin {
    isout = false;
    state = false;
}
exports.Pin = Pin;
class Waveform {
    samples;
    next = 0;
    prev = 0;
    get size() {
        return this.samples.length;
    }
    capacity;
    resolution;
    oldest_sample_cycle = 0n;
    youngest_sample_cycle = 0n;
    partial_sample = 0;
    partial_counter = 0;
    last_sample = 0;
    _AddSample(s) {
        if (this.capacity == this.size)
            this.oldest_sample_cycle += BigInt(this.resolution);
        this.samples[this.next] = s;
        this.prev = this.next;
        this.next++;
        this.next %= this.capacity;
    }
    ReplaceLastSample(s) {
        this.samples[this.prev] = s;
        if (this.resolution == 1) {
            if (this.prev != this.next) {
                this.partial_counter = 0;
                this.prev--;
                this.next--;
                if (this.prev < 0)
                    this.prev = this.capacity - 1;
                if (this.next < 0)
                    this.next = this.capacity - 1;
            }
        }
        else if (this.partial_counter == 0) {
            let pprev = this.prev - 1;
            if (pprev == -1)
                pprev = this.capacity - 1;
            this.samples[pprev] -= this.last_sample / this.resolution;
            this.samples[pprev] += s / this.resolution;
        }
        else {
            this.partial_sample -= this.last_sample / this.resolution;
            this.partial_sample += s;
        }
        this.last_sample = s;
    }
    AddSample(s) {
        this.youngest_sample_cycle++;
        this.last_sample = s;
        if (this.resolution == 1) {
            this._AddSample(s);
        }
        else {
            if (this.partial_counter == 0)
                this._AddSample(s);
            this.partial_counter++;
            if (this.partial_counter == this.resolution) {
                this.partial_counter = 0;
                this.samples[this.prev] = this.partial_sample;
                this.partial_sample = 0;
            }
            else {
                this.partial_sample += s / this.resolution;
                this.samples[this.prev] = s;
            }
        }
    }
    AddSamples(sl) {
        for (let it of sl) {
            this.AddSample(it);
        }
    }
    GetSamples() {
        if (this.size == this.capacity && this.next != 0) {
            this.samples.copyWithin(this.size - 1, 0, this.next);
            this.next = 0;
            this.samples = this.samples.concat(this.samples.splice(0, this.next));
        }
        return this.samples;
    }
    RecreateWithResolution(res) {
        let w = new Waveform(this.capacity, res);
        w.AddSamples(this.samples);
        w.youngest_sample_cycle = this.youngest_sample_cycle;
        this.oldest_sample_cycle = this.oldest_sample_cycle;
        return w;
    }
    constructor(capacity, resolution) {
        this.capacity = capacity;
        this.samples = [];
        this.resolution = resolution;
    }
}
exports.Waveform = Waveform;
class Log {
    pin_waveforms;
    ReplaceLastSample(pinid, s) {
        let waveforms = this.pin_waveforms[pinid];
        for (let it of waveforms) {
            it.ReplaceLastSample(s);
        }
    }
    AddSample(pinid, s) {
        let waveforms = this.pin_waveforms[pinid];
        for (let it of waveforms) {
            it.AddSample(s);
        }
        const last = waveforms[waveforms.length - 1];
        if (last.size == last.capacity) {
            waveforms.push(last.RecreateWithResolution(last.resolution * 2));
        }
    }
    GetLastSampleCycle(pinid) {
        return this.GetWaveformForPin(pinid).youngest_sample_cycle;
    }
    GetWaveformsForPin(pinid) {
        (0, utils_js_1.Assert)(pinid >= 0 && pinid < this.pin_waveforms.length);
        return this.pin_waveforms[pinid];
    }
    GetWaveformForPin(pinid) {
        (0, utils_js_1.Assert)(pinid >= 0 && pinid < this.pin_waveforms.length);
        return this.pin_waveforms[pinid][0];
    }
    constructor() {
        this.pin_waveforms = [];
        for (let i = 0; i < exports.PINS_N; i++) {
            this.pin_waveforms.push([new Waveform(exports.SAMPLE_BUFFER_SIZE, 1)]);
        }
    }
}
exports.Log = Log;
class PIO {
    pins;
    blocks;
    current_cycle = 0n;
    log = new Log();
    on_clock_end = (pio) => { };
    SimulatePin(pinid, state, cycle) {
        (0, utils_js_1.Assert)(cycle >= 0);
        const lastupdate = this.log.GetLastSampleCycle(pinid);
        (0, utils_js_1.Assert)(cycle >= lastupdate);
        if (cycle == lastupdate) {
            this.log.ReplaceLastSample(pinid, (state) ? exports.PIN_HIGH : exports.PIN_LOW);
            return;
        }
        for (let i = 0; i < cycle - lastupdate; i++) {
            this.log.AddSample(pinid, (state) ? exports.PIN_HIGH : exports.PIN_LOW); // TODO: simulating pin capacitance
        }
    }
    UpdateAllPins() {
        for (let i = 0; i < this.pins.length; i++) {
            this.SimulatePin(i, this.pins[i].state, this.current_cycle);
        }
    }
    LogWarning(msg) {
        console.log(msg);
    }
    LogError(msg) {
        console.log(msg);
    }
    GetPin(pinid) {
        (0, utils_js_1.Assert)(pinid >= 0 && pinid < this.pins.length);
        this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle);
        return this.pins[pinid].state;
    }
    SetPin(pinid, val) {
        (0, utils_js_1.Assert)(pinid >= 0 && pinid < this.pins.length);
        if (!this.pins[pinid].isout) {
            this.LogWarning("Pin " + this.pins);
            return;
        }
        if (this.current_cycle > 0)
            this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle - 1n);
        this.pins[pinid].state = val;
        this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle);
    }
    SetPinDir(pinid, isout) {
        (0, utils_js_1.Assert)(pinid >= 0 && pinid < this.pins.length);
        this.pins[pinid].isout = isout;
    }
    Clock(n) {
        let sm = [];
        this.blocks.forEach((b) => b.machines.forEach((m) => { if (m.running)
            sm.push([m, b]); }));
        sm.sort((a, b) => a[0].ClockDivisor() - b[0].ClockDivisor());
        let step = Math.floor(sm[0][0].ClockDivisor());
        while (n > 0) {
            let nstep = Math.min(n, step);
            const startcycle = this.current_cycle;
            for (let it of sm) {
                this.current_cycle = BigInt(startcycle) + BigInt(Math.min(nstep, it[0].ClocksTillTick()));
                it[0].Clock(it[1], nstep);
            }
            this.current_cycle = startcycle + BigInt(nstep);
            n -= nstep;
        }
        this.on_clock_end(this);
    }
    DecodeInstruction(dt) {
        let inst;
        const ident = (0, utils_js_1.BitRange)(dt, 13, 15);
        const ds = (0, utils_js_1.BitRange)(dt, 8, 12);
        switch (ident) {
            case 0b000:
                inst = new instructions_js_1.JMP((0, utils_js_1.BitRange)(dt, 5, 7), (0, utils_js_1.BitRange)(dt, 0, 4), ds);
                break;
            case 0b100:
                if ((0, utils_js_1.BitRange)(dt, 7, 7))
                    inst = new instructions_js_1.PULL((0, utils_js_1.BitRange)(dt, 5, 5) > 0, (0, utils_js_1.BitRange)(dt, 6, 6) > 0, ds);
                break;
            case 0b101:
                inst = new instructions_js_1.MOV((0, utils_js_1.BitRange)(dt, 5, 7), (0, utils_js_1.BitRange)(dt, 3, 4), (0, utils_js_1.BitRange)(dt, 0, 2), ds);
                break;
        }
        (0, utils_js_1.Assert)(inst != null && inst != undefined);
        return inst;
    }
    DecodeProgram(data) {
        let ret = [];
        for (let it of data) {
            ret.push(this.DecodeInstruction(it));
        }
        return ret;
    }
    GetFreeBlockAndMachine(n_inst) {
        let ret = { found: false, block_index: -1, machine_index: -1, offset: -1 };
        for (let i = 0; i < this.blocks.length; i++) {
            const it = this.blocks[i];
            let mach = it.TryGetFreeMachine();
            if (mach == -1)
                continue;
            let off = it.TryAccomodateProgram(n_inst);
            if (off == -1)
                continue;
            ret.found = true;
            ret.block_index = i;
            ret.machine_index = mach;
            ret.offset = off;
        }
        return ret;
    }
    RemoveProgram(block_index, machine_index) {
        (0, utils_js_1.AssertRange)(this.blocks, block_index);
        this.blocks[block_index].RemoveProgram(machine_index);
    }
    AddProgram(block_index, machine_index, offset, config) {
        (0, utils_js_1.AssertRange)(this.blocks, block_index);
        this.blocks[block_index].AddProgram(machine_index, offset, config);
        this.UpdateAllPins();
    }
    StartProgram(block_index, machine_index) {
        this.blocks[block_index].machines[machine_index].running = true;
    }
    PushData(block_index, machine_index, dt) {
        this.blocks[block_index].machines[machine_index].TX_FIFO.Push(dt);
    }
    constructor(pins_n = 32, block_n = 2, machines_per_block = 4, instructions_per_machine = 32) {
        this.pins = [];
        for (let i = 0; i < pins_n; i++) {
            this.pins.push(new Pin());
        }
        this.blocks = [];
        for (let i = 0; i < block_n; i++) {
            this.blocks.push(new block_js_1.Block(this, machines_per_block, instructions_per_machine));
        }
    }
}
exports.PIO = PIO;
//# sourceMappingURL=PIO.js.map