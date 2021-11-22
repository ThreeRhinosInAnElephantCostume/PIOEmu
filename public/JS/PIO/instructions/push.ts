import { Assert, AssertBits, BitRange } from "../../utils.js";
import { Block } from "../block.js";
import { Machine } from "../machine.js";
import { Instruction } from "./instructions.js";

export class PUSH extends Instruction
{
    block: boolean;
    if_empty: boolean;
    protected TickFunc(machine: Machine): boolean
    {
        if(this.if_empty && machine.input_shift_counter < machine.config.autopush_threshold)
            return true;
        if(machine.RX_FIFO.full)
        {
            if(this.block)
                return false;
        }
        else
        {
            machine.RX_FIFO.Push(machine.ISR);
        }
        machine.input_shift_counter = 0;
        machine.ISR = 0;
        return true;
    }
    constructor(block: boolean, if_empty: boolean, sideset_delay: number)
    {
        super(sideset_delay);
        this.block = block;
        this.if_empty = if_empty;
    }
}