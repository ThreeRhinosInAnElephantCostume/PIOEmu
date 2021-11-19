export {Block};

import { PIO, ProgramConfig } from "./PIO.js";
import { Machine } from "./machine.js";
import { Instruction }  from "./instructions.js";
import * as ops  from "./instructions.js";
import { Assert, AssertRange } from "../utils.js";

class Block
{
    pio: PIO;

    machines: Machine[];
    instructions: Instruction[];
    instruction_map: boolean[];
    TryGetFreeMachine(): number
    {
        let i = 0;
        for(let it of this.machines)
        {
            if(!it.has_program)
                return i;
            i++;
        }
        return -1;
    }
    TryAccomodateProgram(n_inst: number): number
    {
        let conse = 0;
        let start = 0;
        let i = 0;
        for(let it of this.instruction_map)
        {
            if(!it)
            {
                if(conse == 0)
                    start = i;
                conse++;
                if(conse == n_inst)
                    return start;
            }
            else
                conse = 0;
            i++;
        }
        return -1;
    }
    AddProgram(machine_index: number, offset: number, config: ProgramConfig)
    {
        AssertRange(this.machines, machine_index);
        Assert(!this.machines[machine_index].has_program);
        this.AddInstructions(offset, config.instructions);
        this.machines[machine_index].SetProgram(config, offset);
    }
    RemoveProgram(machine_index: number)
    {
        AssertRange(this.machines, machine_index);
        let m = this.machines[machine_index];
        for(let i = m.offset; i < m.config.length; i++)
        {
            this.instruction_map[i] = false;
        }
        m.RemoveProgram();
    }
    AddInstructions(offset: number, new_instructions: Instruction[])
    {
        Assert(offset + new_instructions.length < this.instructions.length);
        for(let i = offset; i < new_instructions.length; i++)
        {
            Assert(!this.instruction_map[i]);
            this.instruction_map[i] = true;
            this.instructions[i] = new_instructions[i];
        }
    }

    constructor(pio: PIO, machines_n: number, instructions_n: number)
    {
        this.pio = pio;
        this.machines = [];
        for(let i = 0 ; i < machines_n; i++)
        {
            this.machines.push(new Machine(pio));
        }
        this.instructions = [];
        this.instruction_map = [];
        for(let i = 0; i < instructions_n; i++)
        {
            this.instructions.push(new ops.NOP(0));
            this.instruction_map.push(false);
        }
    }
}