import { Assert, BitRange } from "../../utils.js";
import { Block } from "../block.js";
import { Machine } from "../machine.js";

export { JMP } from "./jmp";
//export { WAIT } from "./wait";
//export { IN } from "./in";
//export { OUT } from "./out";
//export { PUSH } from "./push";
export { PULL } from "./pull";
export { MOV } from "./mov";
//export { IRQ } from "./irq";
//export { SET } from "./set";
export { NOP } from "./nop";

export abstract class Instruction
{
    sideset_delay: number;
    protected abstract TickFunc(machine: Machine): boolean;
    *Execute(machine: Machine)
    {
        let sideset_opt: boolean = false;
        let sideset: number = 0;
        let delay: number = 0;
        let sidelen = machine.config.sideset_n + +machine.config.sideset_opt_en;
        if(machine.config.sideset_n)
        {
            sideset = BitRange(this.sideset_delay, 4-machine.config.sideset_n+(-machine.config.sideset_opt_en)+1, 4+(-machine.config.sideset_opt_en));
            if(machine.config.sideset_opt_en)
                sideset_opt = BitRange(this.sideset_delay, 4, 4) != 0;
            else 
                sideset_opt = true;
        }
        if(sidelen < 5)
            delay = BitRange(this.sideset_delay, 0, 4-sidelen);
        if(machine.config.sideset_n > 0)
        {
            if(!machine.config.sideset_opt_en || sideset_opt)
                machine.SetSideset(sideset);
        }
        while(!this.TickFunc(machine))
            yield -1;
        for(let i = 0; i < delay; i++)
        {
            yield delay-i-1;
        }
        return -2;
    }
    constructor(sideset_delay: number)
    {
        this.sideset_delay = sideset_delay;
    }
}
