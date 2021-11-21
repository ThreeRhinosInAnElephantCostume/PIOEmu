import { Instruction } from "./instructions";
import { Assert, AssertBits, BitRange } from "../../utils.js";
import { Block } from "../block.js";
import { Machine } from "../machine.js";

export class MOV extends Instruction
{
    getter: (m:Machine) => number;
    process: (m:Machine, n:number) => number;
    setter: (m:Machine, n:number) => void;
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
        AssertBits(destination, 3);
        AssertBits(op, 2);
        AssertBits(source, 3);
        this.setter = 
        {
            0b000 : (m: Machine, n: number) => m.SetOutPins(n), // PINS
            0b001 : (m: Machine, n: number) => m.X = n,         // X
            0b010 : (m: Machine, n: number) => m.Y = n,         // Y
            0b100 : (m: Machine, n: number) => m.EXEC(n),       // EXEC
            0b101 : (m: Machine, n: number) => m.PC = n,        // PC
            0b110 : (m: Machine, n: number) => m.ISR = n,       // ISR
            0b111 : (m: Machine, n: number) => m.OSR = n,       // OSR

        }[destination]!;
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
        }[op]!;
        Assert(this.process != undefined);
        this.getter = 
        {
            0b000 : (m: Machine) => m.GetOutPins(),             // PINS 
            0b001 : (m: Machine) => m.X,                        // X
            0b010 : (m: Machine) => m.Y,                        // Y
            0b011 : (m: Machine) => 0,                          // NULL
            0b101 : (m: Machine) => m.STATUS,                   // STATUS
            0b110 : (m: Machine) => m.ISR,                      // ISR
            0b111 : (m: Machine) => m.OSR,                      // OSR

        }[source]!;
        Assert(this.getter != undefined);
    }
}