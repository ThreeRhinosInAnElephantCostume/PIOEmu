"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOV = exports.JMP = exports.PULL = exports.NOP = exports.Instruction = void 0;
const utils_js_1 = require("../utils.js");
class Instruction {
    sideset_delay;
    *Execute(machine) {
        let sideset_opt = false;
        let sideset = 0;
        let delay = 0;
        let sidelen = machine.config.sideset_n + +machine.config.sideset_opt_en;
        if (machine.config.sideset_n) {
            sideset = (0, utils_js_1.BitRange)(this.sideset_delay, 4 - machine.config.sideset_n + (-machine.config.sideset_opt_en) + 1, 4 + (-machine.config.sideset_opt_en));
            if (machine.config.sideset_opt_en)
                sideset_opt = (0, utils_js_1.BitRange)(this.sideset_delay, 4, 4) != 0;
            else
                sideset_opt = true;
        }
        if (sidelen < 5)
            delay = (0, utils_js_1.BitRange)(this.sideset_delay, 0, 4 - sidelen);
        if (machine.config.sideset_n > 0) {
            if (!machine.config.sideset_opt_en || sideset_opt)
                machine.SetSideset(sideset);
        }
        while (!this.TickFunc(machine))
            yield -1;
        for (let i = 0; i < delay; i++) {
            yield delay - i - 1;
        }
        return -2;
    }
    constructor(sideset_delay) {
        this.sideset_delay = sideset_delay;
    }
}
exports.Instruction = Instruction;
var MOV_OP;
(function (MOV_OP) {
    MOV_OP[MOV_OP["NONE"] = 0] = "NONE";
    MOV_OP[MOV_OP["INVERT"] = 1] = "INVERT";
    MOV_OP[MOV_OP["BIT_REVERSE"] = 2] = "BIT_REVERSE";
})(MOV_OP || (MOV_OP = {}));
class NOP extends Instruction {
    TickFunc(machine) {
        return true;
    }
    constructor(sideset_delay) {
        super(sideset_delay);
    }
}
exports.NOP = NOP;
class PULL extends Instruction {
    block;
    if_empty;
    TickFunc(machine) {
        if (machine.TX_FIFO.empty) {
            if (this.block)
                return false;
            machine.OSR = machine.X;
        }
        else {
            machine.OSR = machine.TX_FIFO.Pop();
        }
        return true;
    }
    constructor(block, if_empty, sideset_delay) {
        super(sideset_delay);
        this.block = block;
        this.if_empty = if_empty;
    }
}
exports.PULL = PULL;
class JMP extends Instruction {
    condition;
    address;
    TickFunc(machine) {
        if (this.condition(machine)) {
            machine.PC = this.address;
        }
        return true;
    }
    constructor(condition, address, sideset_delay) {
        super(sideset_delay);
        this.condition =
            {
                0b000: (m) => true,
                0b001: (m) => !m.X,
                0b010: (m) => !!(m.X--),
                0b011: (m) => !m.Y,
                0b100: (m) => !!(m.Y--),
                0b101: (m) => m.X != m.Y,
                0b110: (m) => m.GetJumpPin(), // PIN
                // TODO 0b111 !OSRE
            }[condition];
        (0, utils_js_1.Assert)(this.condition != undefined);
        this.address = address;
        (0, utils_js_1.Assert)(this.address >= 0);
    }
}
exports.JMP = JMP;
class MOV extends Instruction {
    getter;
    process;
    setter;
    TickFunc(machine) {
        this.setter(machine, this.process(machine, this.getter(machine)));
        return true;
    }
    Test() {
        return (i) => { };
    }
    constructor(destination, op, source, sideset_delay) {
        super(sideset_delay);
        this.setter =
            {
                0b000: (m, n) => m.SetOutPins(n),
                0b001: (m, n) => m.X = n,
                0b010: (m, n) => m.Y = n,
                0b100: (m, n) => m.EXEC(n),
                0b101: (m, n) => m.PC = n,
                0b110: (m, n) => m.ISR = n,
                0b111: (m, n) => m.OSR = n, // OSR
            }[destination];
        (0, utils_js_1.Assert)(this.setter != undefined);
        this.process =
            {
                0b00: (m, n) => n,
                0b01: (m, n) => ~n,
                0b10: (m, n) => {
                    let rn = 0;
                    for (let i = 0; i < 32; i++) {
                        rn |= ((n & (1 << (31 - i))) ? 1 : 0);
                    }
                    return rn;
                }
            }[op];
        (0, utils_js_1.Assert)(this.process != undefined);
        this.getter =
            {
                0b000: (m) => m.GetOutPins(),
                0b001: (m) => m.X,
                0b010: (m) => m.Y,
                0b011: (m) => 0,
                0b101: (m) => m.STATUS,
                0b110: (m) => m.ISR,
                0b111: (m) => m.OSR, // OSR
            }[source];
        (0, utils_js_1.Assert)(this.getter != undefined);
    }
}
exports.MOV = MOV;
//# sourceMappingURL=instructions.js.map