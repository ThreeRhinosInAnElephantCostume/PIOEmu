import { Assert, AssertBits, BitRange } from "../utils";
import { Block } from "../block";
import { Machine } from "../machine";
import { Instruction } from "./instruction";

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
        AssertBits(condition, 3);
        AssertBits(address, 5);
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