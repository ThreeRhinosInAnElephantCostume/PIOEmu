import { Assert, AssertBits, BitRange } from "../utils";
import { Block } from "../block";
import { Machine } from "../machine";
import { Instruction } from "./instruction";

export class PULL extends Instruction
{
    block: boolean;
    if_empty: boolean;
    protected TickFunc(machine: Machine): boolean
    {
        if(this.if_empty && machine.output_shift_counter < machine.config!.autopull_threshold)
            return true;
        if(machine.TX_FIFO.empty)
        {
            if(this.block)
                return false;
            machine.OSR = machine.X;
        }
        else
        {
            machine.OSR = machine.TX_FIFO.Pop();
        }
        machine.output_shift_counter = 0;
        return true;
    }
    constructor(block: boolean, if_empty: boolean, sideset_delay: number)
    {
        super(sideset_delay);
        this.block = block;
        this.if_empty = if_empty;
    }
}