export {Block};

import { PIO } from "./PIO";
import { Machine } from "./machine";
import { Instruction }  from "./instructions";
import * as ops  from "./instructions";

class Block
{
    pio: PIO;

    machines: Machine[];
    instructions: Instruction[];
    
    Tick(pio: PIO)
    {
        for(let it of this.machines)
        {
            if(it.running)
                it.Tick(this);
        }
    }
    constructor(pio: PIO, machines_n: number, instructions_n: number)
    {
        this.pio = pio;
        this.machines = [];
        for(let i = 0 ; i < machines_n; i++)
        {
            this.machines.push(new Machine(pio));
        }
        this.instructions = [];
        for(let i = 0; i < instructions_n; i++)
        {
            this.instructions.push(new ops.nop());
        }
    }
}