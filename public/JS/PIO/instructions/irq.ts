import { Assert, AssertBits, BitRange } from "../../utils.js";
import { Block } from "../block.js";
import { Machine } from "../machine.js";
import { Instruction } from "./instructions.js";

export function IRQCalculateAddress(machine: Machine, index: number)
{
    if(index & 0b10000)
    {
        const low = index & 0b00011;
        return (index * 0b00100) | ((low + machine.index) % 4);
    }
    return index & 0b00111;
}

export class IRQ extends Instruction
{
    clr: boolean;
    wait: boolean;
    index: number;
    protected TickFunc(machine: Machine): boolean
    {
        const address = IRQCalculateAddress(machine, this.index);
        if(machine.wait_on_irq_flag && this.wait)
        {
            return !machine.pio.GetIRQ(address);
        }
        machine.pio.SetIRQ(address, !this.clr);
        machine.wait_on_irq_flag = this.wait;
        return !this.wait;
    }
    constructor(clr: boolean, wait: boolean, index: number, sideset_delay: number)
    {
        super(sideset_delay);
        AssertBits(index, 5);
        this.clr = clr;
        this.wait = (clr) ? false : wait;
        this.index = index;
    }   
}