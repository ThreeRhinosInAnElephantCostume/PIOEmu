import { Assert, AssertBits, BitRange, REG32_MAX,  BitsFromDir, ShiftInDir } from "../../utils.js";
import { Block } from "../block.js";
import { Machine } from "../machine.js";
import { Instruction } from "./instructions.js";

export class OUT extends Instruction
{
    setter: (m:Machine, v: number) => void;
    bitcount: number;
    increment_isr: boolean;
    protected TickFunc(machine: Machine): boolean
    {
        let v = BitsFromDir(machine.OSR, this.bitcount, machine.config.out_shiftdir);
        machine.OSR = ShiftInDir(machine.OSR, this.bitcount, machine.config.out_shiftdir);
        machine.output_shift_counter += this.bitcount;
        this.setter(machine, v);
        if(this.increment_isr)
            machine.input_shift_counter += this.bitcount;
        return true;
    }
    constructor(destination: number, bitcount: number, sideset_delay: number)
    {
        super(sideset_delay);
        AssertBits(destination, 3);
        AssertBits(bitcount, 5);
        this.setter = 
        {
            0b000 : (m: Machine, n: number) => m.SetOutPins(n), // PINS
            0b001 : (m: Machine, n: number) => m.X = n,         // X
            0b010 : (m: Machine, n: number) => m.Y = n,         // Y
            0b011 : (m: Machine, n: number) => {},              // NULL
            0b100 : (m: Machine, n: number) => m.SetPindirs(n), // PINDIRS
            0b101 : (m: Machine, n: number) => m.PC = n,        // PC
            0b110 : (m: Machine, n: number) => m.ISR = n,       // ISR
            0b111 : (m: Machine, n: number) => m.EXEC(n),       // EXEC

        }[destination]!;
        this.bitcount = (bitcount == 0) ? 32 : bitcount;
        this.increment_isr = destination == 0b110;
    }
}