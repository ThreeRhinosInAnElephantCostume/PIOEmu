import { pio } from "../../globals.js";
import { Assert, AssertBits, BitRange } from "../../utils.js";
import { Block } from "../block.js";
import { Machine } from "../machine.js";

export { JMP } from "./jmp";
export { WAIT } from "./wait";
export { IN } from "./in";
export { OUT } from "./out";
export { PUSH } from "./push";
export { PULL } from "./pull";
export { MOV } from "./mov";
export { IRQ } from "./irq";
export { SET } from "./set";
export { NOP } from "./nop";

export const INST_DONE = -1;
export const INST_STALL_INTERNAL = -2;
export const INST_STALL_AUTOPUSH = -3;
export const INST_STALL_AUTOPULL = -4;
export const INST_STALL_IRQ = -5;

export abstract class Instruction
{
    sideset_delay: number;
    protected abstract TickFunc(machine: Machine): boolean;
    // Yields an x >= 0 number of delay cycles remaining, or an INST_ constant indicating the reason for stalling. 
    // Returns INST_DONE on completion
    *Execute(machine: Machine)
    {
        let sideset_opt: boolean = false;
        let sideset: number = 0;
        let delay: number = 0;
        let sidelen = machine.config.sideset_n + +machine.config.sideset_opt_en;
        if(machine.config.sideset_n)
        {
            sideset = BitRange(this.sideset_delay, 4-machine.config.sideset_n+(-machine.config.sideset_opt_en)+1, 4+(-machine.config.sideset_opt_en));
            if(machine.config.sideset_opt_en)
                sideset_opt = BitRange(this.sideset_delay, 4, 4) != 0;
            else 
                sideset_opt = true;
        }
        if(sidelen < 5)
            delay = BitRange(this.sideset_delay, 0, 4-sidelen);
        if(machine.config.sideset_n > 0)
        {
            if(!machine.config.sideset_opt_en || sideset_opt)
                machine.SetSideset(sideset);
        }
        while(!this.TickFunc(machine))
            yield (machine.wait_on_irq_flag) ? INST_STALL_IRQ : INST_STALL_INTERNAL;
        while(machine.output_shift_flag)
        {
            if(machine.TX_FIFO.empty)
                yield INST_STALL_AUTOPULL;
            else
            {
                machine.OSR = machine.TX_FIFO.Pop();
                machine.output_shift_flag = false;
            }
        }
        while(machine.input_shift_flag)
        {
            if(machine.RX_FIFO.full)
                yield INST_STALL_AUTOPUSH;
            else
            {
                machine.RX_FIFO.Push(machine.ISR);
                machine.ISR = 0;
                machine.input_shift_flag = false;
            }
        }
        for(let i = 0; i < delay; i++)
        {
            yield delay-i-1;
        }
        return INST_DONE;
    }
    constructor(sideset_delay: number)
    {
        AssertBits(sideset_delay, 5);
        this.sideset_delay = sideset_delay;
    }
}
