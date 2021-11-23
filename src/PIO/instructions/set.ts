import { Assert, AssertBits, BitRange } from "../utils";
import { Block } from "../block";
import { Machine } from "../machine";
import { Instruction } from "./instruction";

export class SET extends Instruction
{
    destination: number;
    data: number;
    setter: (m: Machine, n: number) => void;
    protected TickFunc(machine: Machine): boolean
    {
        this.setter(machine, this.data);
        return true;
    }
    constructor(destination: number, data: number, sideset_delay: number)
    {
        super(sideset_delay);
        AssertBits(destination, 3);
        AssertBits(data, 5);

        this.destination = destination;
        this.data = data;

        this.setter = 
        {
            0b000 : (m: Machine, n: number) => m.SetSetPins(n), // PINS
            0b001 : (m: Machine, n: number) => m.X = n,         // X
            0b010 : (m: Machine, n: number) => m.Y = n,         // Y
            0b100 : (m: Machine, n: number) => m.SetPindirs(n),       // EXEC

        }[destination]!;
    }
}