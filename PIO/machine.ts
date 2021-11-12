export {Machine};

import { PIO } from "./PIO";
import { Block } from "./block";
import * as ops  from "./instructions";

class Machine
{
    pio: PIO;

    offset!: number;
    len!: number;
    wrap!: number;
    wrap_target!: number;
    position!: number;
    running!: boolean;

    sideset_opt_en: boolean = false;
    sideset_n: number = 0;
    sideset_base: number = 0;

    pins_n: number = 0;
    pins_base: number = 0;

    pindirs_n: number = 0;
    pindirs_base: number = 0;

    curinstgen?: Generator;
    lastresult?: IteratorResult<unknown, any>;

    NextInstruction(block: Block)
    {
        this.position++;
        if(this.position == this.wrap)
            this.position = this.wrap_target;
        this.curinstgen = block.instructions[this.position].Execute(this);
    }
    SetPins(val: number)
    {
        if(this.pins_n == 0)
        {
            this.pio.LogWarning("Attempting to set pins even though none are assigned. Did you forget to assign them?");
        }
        for(let i = 0; i < this.pins_n; i++)
        {
            this.pio.SetPin(this.pins_base+i, !!(val & (1 << i)));
        }
    }
    SetSideset(val: number)
    {
        if(this.sideset_n == 0)
        {
            this.pio.LogError("Attempting to set sideset even though there are no pins assigned to it. This should not compile.");
        }
        for(let i = 0; i < this.sideset_n; i++)
        {
            this.pio.SetPin(this.sideset_base+i, !!(val & (1 << i)));
        }

    }
    SetPindirs(val: number)
    {
        if(this.pindirs_n == 0)
        {
            this.pio.LogWarning("Attempting to set pindirs even though none are assigned. Did you forget to assign them?");
        }

        for(let i = 0; i < this.pindirs_n; i++)
        {
            this.pio.SetPinDir(this.pindirs_base+i, !!(val & (1 << i)));
        }
        
    }
    Tick(block: Block)
    {
        if(this.curinstgen == null)
            this.curinstgen = block.instructions[this.position].Execute(this);
        this.lastresult = this.curinstgen?.next();
        if(this.lastresult.done)
        {
            this.NextInstruction(block);    
        }
    }
    constructor(pio: PIO)
    {
        this.pio = pio;
    }
}