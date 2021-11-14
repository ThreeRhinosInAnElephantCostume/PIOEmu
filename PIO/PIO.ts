export {PIO};

import { Machine } from "./machine";
import { Block } from "./block";
import { Instruction, JMP, MOV, PULL } from "./instructions";
import { Assert, BitRange } from "../utils";
import { OutputSelector } from "reselect";

class Pin
{
    isout: boolean = false;
    state: boolean = false;
}

class PIO 
{
    pins: Pin[];
    blocks: Block[];
    

    LogWarning(msg: string)
    {
        console.log(msg);
    }
    LogError(msg: string)
    {
        console.log(msg);
    }
    GetPin(pinid: number)
    {
        Assert(pinid >= 0 && pinid < this.pins.length);

        return this.pins[pinid].state;
    }
    SetPin(pinid: number, val: boolean)
    {
        Assert(pinid >= 0 && pinid < this.pins.length);
        if(!this.pins[pinid].isout)
        {
            this.LogWarning("Pin " + this.pins)
            return;
        }
        this.pins[pinid].state = val;
    }
    SetPinDir(pinid: number, isout: boolean)
    {
        Assert(pinid >= 0 && pinid < this.pins.length);
        this.pins[pinid].isout = isout;
    }

    Clock(n: number)
    {
        let sm: [Machine, Block][] = [];
        this.blocks.forEach((b)=>b.machines.forEach((m) => {if(m.running)sm.push([m, b]);}));
        sm.sort((a, b) => a[0].ClockDivisor()-b[0].ClockDivisor());
        let step  = Math.floor(sm[0][0].ClockDivisor());
        while (n > 0)
        {
            let nstep = Math.min(n, step);
            for(let it of sm)
            {
                it[0].Clock(it[1], nstep);
            }
            n -= nstep;
        }
    }

    DecodeInstruction(dt: number): Instruction
    {
        let inst: Instruction;
        const ident = BitRange(dt, 13, 15); 
        const ds = BitRange(dt, 8, 12);
        switch(ident)
        {
            case 0b000:
                inst = new JMP(BitRange(dt, 5, 7), BitRange(dt, 0, 4), ds);
                break;
            case 0b100:
                if(BitRange(dt, 7, 7))
                    inst = new PULL(BitRange(dt, 5, 5) > 0, BitRange(dt, 6, 6) > 0, ds);
                break;
            case 0b101:
                inst = new MOV(BitRange(dt, 5, 7), BitRange(dt, 3, 4), BitRange(dt, 0, 2), ds);
                break;
        }
        Assert(inst! != null && inst! != undefined);
        return inst!;
    }

    constructor(pins_n: number = 32, block_n: number = 2, machines_per_block: number = 4, instructions_per_machine: number = 32)
    {
        this.pins = [];
        for(let i = 0; i < pins_n; i++)
        {
            this.pins.push(new Pin());
        }
        this.blocks = [];
        for(let i = 0; i < block_n; i++)
        {
            this.blocks.push(new Block(this, machines_per_block, instructions_per_machine));
        }

    }

}