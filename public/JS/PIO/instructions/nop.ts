import { Instruction } from "./instructions";
import { Assert, BitRange } from "../../utils.js";
import { Block } from "../block.js";
import { Machine } from "../machine.js";

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