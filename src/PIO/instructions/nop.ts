import { Instruction } from "./instruction";
import { Assert, BitRange } from "../utils";
import { Block } from "../block";
import { Machine } from "../machine";

export class NOP extends Instruction
{
    protected TickFunc(machine: Machine): boolean
    {
        return true;
    }
    constructor(sideset_delay: number)
    {
        super(sideset_delay);
    }
}