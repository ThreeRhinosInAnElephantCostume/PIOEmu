export { Instruction }

import { Assert, BitRange } from "../utils";
import { Block } from "./block";
import { Machine } from "./machine";

abstract class Instruction
{
    sideset_delay: number;
    protected abstract TickFunc(machine: Machine): boolean;
    *Execute(machine: Machine)
    {
        let sideset_opt: boolean = false;
        let sideset: number = 0;
        let delay: number = 0;
        let sidelen = machine.sideset_n + +machine.sideset_opt_en;
        if(machine.sideset_n)
        {
            sideset = BitRange(this.sideset_delay, 12-machine.sideset_n, 12);
            if(machine.sideset_opt_en)
                sideset_opt = BitRange(this.sideset_delay, 12-machine.sideset_n-1, 12-machine.sideset_n-1) != 0;
            else 
                sideset_opt = true;
        }
        if(sidelen < 5)
            delay = BitRange(this.sideset_delay, 8, 12-sidelen);
        if(machine.sideset_n > 0)
        {
            if(!machine.sideset_opt_en || sideset_opt)
                machine.SetSideset(sideset);
        }
        while(!this.TickFunc(machine))
            yield -1;
        for(let i = 0; i < delay; i++)
        {
            yield i;
        }
        return -2;
    }
    constructor(sideset_delay: number)
    {
        this.sideset_delay = sideset_delay;
    }
}

enum MOV_OP
{
    NONE=0b00,
    INVERT=0b01,
    BIT_REVERSE=0b10,
} 

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
export class JMP extends Instruction
{
    condition?: (m: Machine) => boolean;
    address: number;
    protected TickFunc(machine: Machine): boolean
    {
        if(this.condition!(machine))
        {
            machine.PC = this.address;
        }
        return true;
    }
    constructor(condition: number, address:number, sideset_delay: number)
    {
        super(sideset_delay);
        this.condition = 
        {
            0b000 : (m: Machine) => true,           // none (always jump)
            0b001 : (m: Machine) => !m.X,           // !X
            0b010 : (m: Machine) => !!(m.X--),      // X--
            0b011 : (m: Machine) => !m.Y,           // !Y
            0b100 : (m: Machine) => !!(m.Y--),      // Y--
            0b101 : (m: Machine) => m.X != m.Y,     // X!=Y
            0b110 : (m: Machine) => m.GetJumpPin(), // PIN
            // TODO 0b111 !OSRE
        }[condition];
        Assert(this.condition != undefined);
        this.address = address;
        Assert(this.address >= 0);
    }
}
export class MOV extends Instruction
{
    getter?: (m:Machine) => number;
    process?: (m:Machine, n:number) => number;
    setter?: (m:Machine, n:number) => void;
    protected TickFunc(machine: Machine): boolean
    {
        this.setter!(machine, this.process!(machine, this.getter!(machine)));
        return true;
    }
    Test()
    {
        return (i:number)=>{};
    }
    constructor(destination: number, op: number, source: number, sideset_delay: number)
    {
        super(sideset_delay);
        this.setter = 
        {
            0b000 : (m: Machine, n: number) => m.SetPins(n),    // PINS
            0b001 : (m: Machine, n: number) => m.X = n,         // X
            0b010 : (m: Machine, n: number) => m.Y = n,         // Y
            0b100 : (m: Machine, n: number) => m.EXEC(n),       // EXEC
            0b101 : (m: Machine, n: number) => m.PC = n,        // PC
            0b110 : (m: Machine, n: number) => m.ISR = n,       // ISR
            0b111 : (m: Machine, n: number) => m.OSR = n,       // OSR

        }[destination];
        Assert(this.setter != undefined);
        this.process = 
        {
            0b00 : (m: Machine, n: number) => n,
            0b01 : (m: Machine, n: number) => ~n,
            0b10 : (m: Machine, n: number) => 
            {
                let rn = 0;
                for(let i = 0; i < 32; i++)
                {
                    rn |= ((n & (1 << (31-i))) ? 1 : 0);
                }
                return rn;
            }
        }[op];
        Assert(this.process != undefined);
        this.getter = 
        {
            0b000 : (m: Machine) => m.GetPins(),                // PINS 
            0b001 : (m: Machine) => m.X,                        // X
            0b010 : (m: Machine) => m.Y,                        // Y
            0b011 : (m: Machine) => 0,                          // NULL
            0b101 : (m: Machine) => m.STATUS,                   // STATUS
            0b110 : (m: Machine) => m.ISR,                      // ISR
            0b111 : (m: Machine) => m.OSR,                      // OSR

        }[source];
        Assert(this.getter != undefined);
    }

}