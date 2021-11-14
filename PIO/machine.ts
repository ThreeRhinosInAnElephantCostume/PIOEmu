export {Machine};

import { PIO } from "./PIO";
import { Block } from "./block";
import * as ops  from "./instructions";
import { FIFO } from "./FIFO";

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

    jmp_pin: number = -1;

    clkdiv: number = 0;
    clk: number = 0;

    curinstgen?: Generator | null;
    lastresult?: IteratorResult<unknown, any>;

    input_shift_counter: number = 0;
    output_shift_counter: number = 0;

    RX_FIFO = new FIFO<number>(4);
    TX_FIFO = new FIFO<number>(4);

    X: number = 0;
    Y: number = 0;
    STATUS: number = 0;
    private _ISR: number = 0;
    set ISR(v:number)
    {
        this.input_shift_counter = 0;
        this._ISR = 0;
    }
    get ISR():number
    {
        return this._ISR;
    }

    private _OSR: number = 0;
    set OSR(v:number)
    {
        this.output_shift_counter = 0;
        this.OSR = 0;
    }
    get OSR():number
    {
        return this.OSR;
    }

    set PC(v: number)
    {
        this.position = v;
        this.curinstgen = null;
    }

    GetJumpPin()
    {
        return this.pio.GetPin(this.jmp_pin);
    }

    EXEC(inst: number)
    {
        this.LoadInstruction(this.pio.DecodeInstruction(inst));
    }
    LoadInstruction(inst: ops.Instruction)
    {
        this.curinstgen = inst.Execute(this);   
    }
    SetInstruction(block: Block, position: number)
    {
        this.LoadInstruction(block.instructions[position]);
    }
    NextInstruction(block: Block)
    {
        this.position++;
        if(this.position == this.wrap)
            this.position = this.wrap_target;
        this.SetInstruction(block, this.position);
    }
    GetPins(): number
    {
        let n = 0;
        for(let i = 0; i < this.pins_n; i++)
        {
            let v = +this.pio.GetPin(this.pins_base+i);
            n |= (v << i);
        }
        return n;
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
    private Tick(block: Block)
    {
        if(this.curinstgen == null)
            this.SetInstruction(block, this.position);
        this.lastresult = this.curinstgen?.next();
        if(this.lastresult?.done)
        {
            this.NextInstruction(block);    
        }
    }
    ClocksTillTick()
    {
        if(this.clk > this.clkdiv)
            return 0;
        return (this.clkdiv - this.clk);
    }
    ClockDivisor()
    {
        return this.clkdiv;
    }
    Clock(block: Block, n: number)
    {
        this.clk += n;
        let ts = 0;
        while(this.clk >= this.clkdiv)
        {
            this.clk -= this.clkdiv
            this.Tick(block);
            ts++;
        }
        return ts;
    }
    constructor(pio: PIO)
    {
        this.pio = pio;
    }
}