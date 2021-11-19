import { PIO, ProgramConfig } from "./PIO.js";
import { Machine } from "./machine.js";
import { Block } from "./block.js";
import { Instruction, JMP, MOV, PULL } from "./instructions.js";
import { Assert, AssertRange, BitRange } from "../utils.js";
import { ConfigFileDiagnosticsReporter, Program } from "typescript";


export class PIOProgram
{
    pio: PIO;
    config: ProgramConfig;
    block_index: number = -1;
    machine_index: number = -1;
    offset: number = -1;

    private AssertLoaded()
    {
        Assert(this.block != null && this.machine != null && this.config != null && this.offset != -1);
    }

    get instructions(): Instruction[]
    {
        Assert(this.config != null);
        return this.config.instructions;
    }

    get block(): Block
    {
        AssertRange(this.pio.blocks, this.block_index);
        return this.pio.blocks[this.block_index];
    }
    get machine(): Machine
    {
        AssertRange(this.block.machines, this.machine_index);
        return this.block.machines[this.machine_index];
    }

    private _running = false;
    get running()
    {
        return this.block != null && this.machine != null && this.machine.running;
    }
    set running(v: boolean)
    {
        this.AssertLoaded();
        this.machine.running = v;
    }
    private _loaded = false;
    get loaded()
    {
        return this._loaded;
    }
    private set loaded(v: boolean)
    {
        if(this._loaded == v)
            return;
        this._loaded = v;
        if(v)
            this.AssertLoaded();
    }
    TryAutoLoad(): boolean
    {
        if(this.loaded)
            return;
        const bm = this.pio.GetFreeBlockAndMachine(this.instructions.length);
        if(!bm.found)
            return false;
        this.Load(bm.block_index, bm.machine_index, bm.offset);
        return true;
    }
    Load(block_index: number, machine_index: number, offset: number)
    {
        if(this.loaded)
            this.Unload();
        Assert(block_index >= 0 && machine_index >= 0 && offset >= 0);
        this.loaded = false;
        this.block_index = block_index;
        this.machine_index = machine_index;
        this.offset = offset;
        this.pio.AddProgram(this.block_index, this.machine_index, this.offset, this.config);
        this.loaded = true;
    }
    Unload()
    {
        Assert(this.loaded);
        if(this.running)
            this.Stop();
        this.loaded = false;
        this.pio.RemoveProgram(this.block_index, this.machine_index);
    }
    Start(auto_load: boolean = false)
    {
        Assert(this.loaded || auto_load);
        if(!this.loaded)
        {
            Assert(this.TryAutoLoad());
        }
        this.AssertLoaded();
        this.loaded = true;
        this.running = true;
    }
    Stop()
    {
        Assert(this.running);
        this.AssertLoaded();
        this.running = false;
    }
    constructor(pio: PIO, config: ProgramConfig, load: boolean=false, block_index?: number, machine_index?: number, offset?: number)
    {
        this.pio = pio;
        this.config = config;
        if(load)
        {
            this.Load(block_index, machine_index, offset);
        }
    }
}
export class PIOAPI
{

}