export {Machine};

import { PIO, ProgramConfig } from "./PIO.js";
import { Block } from "./block.js";
import * as ops  from "./instructions.js";
import { FIFO } from "./FIFO.js";
import { Assert, LikeInteger32 } from "../utils.js";

class Machine
{

    pio: PIO;

    offset!: number;
    position!: number;
    nextposition!: number
    running!: boolean;

    clkdiv: number = 1;
    clk: number = 0;

    config!: ProgramConfig;

    curinstgen: Generator | null = null;
    nextinstgen: Generator | null = null;
    lastresult?: IteratorResult<unknown, any>;

    input_shift_counter: number = 0;
    output_shift_counter: number = 0;

    RX_FIFO = new FIFO<number>(4);
    TX_FIFO = new FIFO<number>(4);

    private _X: number = 0;
    get X()
    {
        return this._X;
    }
    set X(v: number)
    {
        this._X = LikeInteger32(v);
    }

    private _Y: number = 0;
    get Y()
    {
        return this._Y;
    }
    set Y(v: number)
    {
        this._Y = LikeInteger32(v);
    }

    STATUS: number = 0;

    private _ISR: number = 0;
    set ISR(v:number)
    {
        this.input_shift_counter = 0;
        this._ISR = LikeInteger32(v);
    }
    get ISR():number
    {
        return this._ISR;
    }

    private _OSR: number = 0;
    set OSR(v:number)
    {
        this.output_shift_counter = 0;
        this._OSR = LikeInteger32(v);
    }
    get OSR():number
    {
        return this._OSR;
    }

    set PC(v: number)
    {
        this.nextposition = this.offset+v;
    }

    get has_program(): boolean
    {
        return !(this.config == undefined || this.config == null);
    }

    GetJumpPin()
    {
        return this.pio.GetPin(this.config.jmp_pin);
    }

    EXEC(inst: number)
    {
        this.nextinstgen = this.LoadInstruction(this.pio.DecodeInstruction(inst));
    }
    LoadInstruction(instruction: ops.Instruction)
    {
        return instruction.Execute(this);
    }
    LoadInstructionFromPosition(block: Block, position: number)
    {
        return this.LoadInstruction(block.instructions[position]);
    }
    NextInstruction(block: Block)
    {
        if(this.nextinstgen != null)
        {
            this.curinstgen = this.nextinstgen;
            this.nextinstgen = null;
            return;
        }
        this.position = this.nextposition;
        this.nextposition++;
        if(this.nextposition == this.config.wrap)
            this.nextposition= this.config.wrap_target;
        if(this.nextposition >= this.config.length)
            this.nextposition = this.offset;
        this.curinstgen = this.LoadInstructionFromPosition(block, this.position);
    }
    GetInPins(): number
    {
        let n = 0;
        for(let i = 0; i < this.config.in_pins_n; i++)
        {
            let v = +this.pio.GetPin(this.config.in_pins_base+i);
            n |= (v << i);
        }
        return n;
    }
    GetOutPins(): number
    {
        let n = 0;
        for(let i = 0; i < this.config.set_pins_n; i++)
        {
            let v = +this.pio.GetPin(this.config.set_pins_base+i);
            n |= (v << i);
        }
        return n;
    }
    GetSetPins(): number
    {
        let n = 0;
        for(let i = 0; i < this.config.out_pins_n; i++)
        {
            let v = +this.pio.GetPin(this.config.out_pins_base+i);
            n |= (v << i);
        }
        return n;
    }
    SetOutPins(val: number)
    {
        if(this.config.out_pins_n == 0)
        {
            this.pio.LogWarning("Attempting to set pins even though none are assigned. Did you forget to assign them?");
        }
        for(let i = 0; i < this.config.out_pins_n; i++)
        {
            this.pio.SetPin(this.config.out_pins_base+i, !!(val & (1 << i)));
        }
    }
    SetSetPins(val: number)
    {
        if(this.config.set_pins_n == 0)
        {
            this.pio.LogWarning("Attempting to set pins even though none are assigned. Did you forget to assign them?");
        }
        for(let i = 0; i < this.config.set_pins_n; i++)
        {
            this.pio.SetPin(this.config.set_pins_base+i, !!(val & (1 << i)));
        }
    }
    SetSideset(val: number)
    {
        if(this.config.sideset_n == 0)
        {
            this.pio.LogError("Attempting to set sideset even though there are no pins assigned to it. This should not compile.");
        }
        for(let i = 0; i < this.config.sideset_n; i++)
        {
            this.pio.SetPin(this.config.sideset_base+i, !!(val & (1 << i)));
        }

    }
    SetPindirs(val: number)
    {
        if(this.config.pindirs_n == 0)
        {
            this.pio.LogWarning("Attempting to set pindirs even though none are assigned. Did you forget to assign them?");
        }

        for(let i = 0; i < this.config.pindirs_n; i++)
        {
            this.pio.SetPinDir(this.config.pindirs_base+i, !!(val & (1 << i)));
        }
        
    }
    private Tick(block: Block)
    {
        if(this.curinstgen == null)
            this.NextInstruction(block);    
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
        Assert(this.config != undefined);
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
    SetProgram(config: ProgramConfig, offset: number)
    {
        this.offset = offset;
        this.position = offset;
        this.nextposition = offset;
        this.config = config;
        this.RX_FIFO.Clear();
        this.TX_FIFO.Clear();
        this.curinstgen = null;
        this.lastresult = undefined;
        this.input_shift_counter = 0;
        this.output_shift_counter = 0;
    }
    RemoveProgram()
    {
        this.offset = -1;
        this.position = -1;
        this.config = null!;
        this.running = false;
    }
    constructor(pio: PIO)
    {
        this.pio = pio;
    }
}