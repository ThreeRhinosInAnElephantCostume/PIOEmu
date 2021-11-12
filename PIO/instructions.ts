export { Instruction }

import { Block } from "./block";
import { Machine } from "./machine";

abstract class Instruction
{
    sideset_opt!: boolean;
    sideset!: number;
    delay!: number;
    protected abstract TickFunc(machine: Machine): boolean;
    *Execute(machine: Machine)
    {
        if(machine.sideset_n > 0)
        {
            if(!machine.sideset_opt_en || this.sideset_opt)
                machine.SetSideset(this.sideset);
        }
        while(!this.TickFunc(machine))
            yield -1;
        for(let i = 0; i < this.delay; i++)
        {
            yield i;
        }
        return -2;
    }
    constructor(machine: Machine, sideset_opt: boolean, sideset: number, delay: number)
    {
        this.sideset_opt = sideset_opt;
        this.sideset = sideset;
        this.delay = delay;
    }
}

class nop extends Instruction
{
    protected TickFunc(machine: Machine): boolean
    {
        return true;
    }
    constructor(machine: Machine, sideset_opt: boolean, sideset: number, delay: number)
    {
        super(machine, sideset_opt, sideset, delay);
    }
}