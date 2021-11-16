"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const machine_js_1 = require("./machine.js");
const ops = __importStar(require("./instructions.js"));
const utils_js_1 = require("../utils.js");
class Block {
    pio;
    machines;
    instructions;
    instruction_map;
    TryGetFreeMachine() {
        let i = 0;
        for (let it of this.machines) {
            if (!it.has_program)
                return i;
            i++;
        }
        return -1;
    }
    TryAccomodateProgram(n_inst) {
        let conse = 0;
        let start = 0;
        let i = 0;
        for (let it of this.instruction_map) {
            if (!it) {
                if (conse == 0)
                    start = i;
                conse++;
                if (conse == n_inst)
                    return start;
            }
            else
                conse = 0;
            i++;
        }
        return -1;
    }
    AddProgram(machine_index, offset, config) {
        (0, utils_js_1.AssertRange)(this.machines, machine_index);
        (0, utils_js_1.Assert)(!this.machines[machine_index].has_program);
        this.AddInstructions(offset, config.instructions);
        this.machines[machine_index].SetProgram(config, offset);
    }
    RemoveProgram(machine_index) {
        (0, utils_js_1.AssertRange)(this.machines, machine_index);
        let m = this.machines[machine_index];
        for (let i = m.offset; i < m.config.length; i++) {
            this.instruction_map[i] = false;
        }
        m.RemoveProgram();
    }
    AddInstructions(offset, new_instructions) {
        (0, utils_js_1.Assert)(offset + new_instructions.length < this.instructions.length);
        for (let i = offset; i < new_instructions.length; i++) {
            (0, utils_js_1.Assert)(!this.instruction_map[i]);
            this.instruction_map[i] = true;
            this.instructions[i] = new_instructions[i];
        }
    }
    constructor(pio, machines_n, instructions_n) {
        this.pio = pio;
        this.machines = [];
        for (let i = 0; i < machines_n; i++) {
            this.machines.push(new machine_js_1.Machine(pio));
        }
        this.instructions = [];
        this.instruction_map = [];
        for (let i = 0; i < instructions_n; i++) {
            this.instructions.push(new ops.NOP(0));
            this.instruction_map.push(false);
        }
    }
}
exports.Block = Block;
//# sourceMappingURL=block.js.map