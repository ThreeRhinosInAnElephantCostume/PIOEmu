export {PIO};

import { Machine } from "./machine";
import { Block } from "./block";
import { Instruction } from "./instructions";

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
    SetPin(pinid: number, val: boolean)
    {
        if(!this.pins[pinid].isout)
        {
            this.LogWarning("Pin " + this.pins)
            return;
        }
    }
    SetPinDir(pinid: number, isout: boolean)
    {

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