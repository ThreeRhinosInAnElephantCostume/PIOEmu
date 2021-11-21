import { Assert, AssertBits, BitRange } from "../../utils.js";
import { Block } from "../block.js";
import { Machine } from "../machine.js";
import { Instruction } from "./instructions.js";

export class PULL extends Instruction
{
    block: boolean;
    if_empty: boolean;
    protected TickFunc(machine: Machine): boolean
    {
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
        return true;
    }
    constructor(block: boolean, if_empty: boolean, sideset_delay: number)
    {
        super(sideset_delay);
        this.block = block;
        this.if_empty = if_empty;
    }
}