import { Assert, AssertBits, BitRange, REG32_MAX,  BitsFromDir, ShiftInDir } from "../utils";
import { Block } from "../block";
import { Machine } from "../machine";
import { Instruction } from "./instruction";

export class IN extends Instruction
{
    getter: (m:Machine) => number;
    bitcount: number;
    bitmask: number;
    protected TickFunc(machine: Machine): boolean
    {
        let v = this.getter(machine) & this.bitmask;
        machine.input_shift_counter += this.bitcount;
        machine.ISR = ShiftInDir(machine.ISR, this.bitcount, machine.config!.in_shiftdir);
        machine.ISR |= BitsFromDir(v, this.bitcount, machine.config!.in_shiftdir);
        return true;
    }
    constructor(source: number, bitcount: number, sideset_delay: number)
    {
        super(sideset_delay);
        AssertBits(source, 3);
        AssertBits(bitcount, 5);
        this.getter = 
        {
            0b000 : (m: Machine) => m.GetOutPins(),             // PINS 
            0b001 : (m: Machine) => m.X,                        // X
            0b010 : (m: Machine) => m.Y,                        // Y
            0b011 : (m: Machine) => 0,                          // NULL
            0b110 : (m: Machine) => m.ISR,                      // ISR
            0b111 : (m: Machine) => m.OSR,                      // OSR

        }[source]!;
        this.bitcount = (bitcount == 0) ? 32 : bitcount;
        this.bitmask = REG32_MAX & ((1 << this.bitcount)-1);
    }
}