import { Pin, PIO, ProgramConfig } from "./PIO.js";
import { Machine } from "./machine.js";
import { Block } from "./block.js";
import { Instruction, JMP, MOV, PULL } from "./instructions/instructions.js";
import { Assert, AssertRange, BitRange, LikeInteger32 } from "../utils.js";
import { ConfigFileDiagnosticsReporter, isPrefixUnaryExpression, Program } from "typescript";
import { pio } from "../globals.js";


export class PIOProgram
{
    private _pio: PIO;
    private _config: ProgramConfig;
    private _block_index: number = -1;
    private _machine_index: number = -1;
    private _offset: number = -1;

    name: string = "";

    private AssertLoaded()
    {
        Assert(this.block != null && this.machine != null && this._config != null && this._offset != -1);
    }

    get instructions(): Instruction[]
    {
        Assert(this._config != null);
        return this._config.instructions;
    }

    get block(): Block
    {
        AssertRange(this._pio.blocks, this._block_index);
        return this._pio.blocks[this._block_index];
    }
    get machine(): Machine
    {
        AssertRange(this.block.machines, this._machine_index);
        return this.block.machines[this._machine_index];
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
    private AssertPins(pinbase: number, n: number)
    {
        Assert(n > 0);
        AssertRange(this._pio.pins, pinbase);
        AssertRange(this._pio.pins, pinbase+n-1);
    }
    SetOutPins(pin_base: number, n: number)
    {
        this.AssertPins(pin_base, n);
        this._pio.SetPinDirs(pin_base, n, true);
        this._config.out_pins_base = pin_base;
        this._config.out_pins_n = n;
    }
    SetSetPins(pin_base: number, n: number)
    {
        this.AssertPins(pin_base, n);
        this._pio.SetPinDirs(pin_base, n, true);
        this._config.set_pins_base = pin_base;
        this._config.set_pins_n = n;
    }
    SetInPins(pin_base: number, n: number)
    {
        this.AssertPins(pin_base, n);
        this._pio.SetPinDirs(pin_base, n, false);
        this._config.in_pins_base = pin_base;
        this._config.in_pins_n = n;
    }
    SetSidesetPins(pin_base: number, n: number)
    {
        this.AssertPins(pin_base, n);
        this._pio.SetPinDirs(pin_base, n, true);
        this._config.sideset_base = pin_base;
        this._config.sideset_n= n;
    }
    get clock_divider()
    {
        return this.machine.clkdiv;
    }
    set clock_divider(n: number)
    {
        this.machine.clkdiv = n;
    }
    
    TryAutoLoad(): boolean
    {
        if(this.loaded)
            return true;
        const bm = this._pio.GetFreeBlockAndMachine(this.instructions.length);
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
        this._block_index = block_index;
        this._machine_index = machine_index;
        this._offset = offset;
        this._pio.AddProgram(this._block_index, this._machine_index, this._offset, this._config);
        this.loaded = true;
    }
    Unload()
    {
        Assert(this.loaded, "Load a program before unloading it");
        if(this.running)
            this.Stop();
        this.loaded = false;
        this._pio.RemoveProgram(this._block_index, this._machine_index);
    }
    Start(auto_load: boolean = false)
    {
        Assert(this.loaded || auto_load, "Load a program before starting it, or call with auto_load=true");
        if(!this.loaded)
        {
            Assert(this.TryAutoLoad(), "Auto-load failed. Could not find suitable machine.");
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
    GetAllPinIndices(unique: boolean = true): number[]
    {
        let pins: number[] = [];
        for(let i = this._config.out_pins_base; i < this._config.out_pins_base+this._config.out_pins_n; i++)
        {
            pins.push(i);
        }
        for(let i = this._config.set_pins_base; i < this._config.set_pins_base+this._config.set_pins_n; i++)
        {
            pins.push(i);
        }
        for(let i = this._config.in_pins_base; i < this._config.in_pins_base+this._config.in_pins_n; i++)
        {
            pins.push(i);
        }
        for(let i = this._config.sideset_base; i < this._config.sideset_base+this._config.sideset_n; i++)
        {
            pins.push(i);
        }
        if(!unique)
            return pins;
        return [... new Set(pins)];
    }
    GetAllPins(unique: boolean = true): Pin[]
    {
        let pins: Pin[] = [];
        for(let it of this.GetAllPinIndices(unique))
        {
            pins.push(this._pio.pins[it]);
        }
        return pins;
    }
    PushInput(n: number)
    {
        this.AssertLoaded();
        this.machine.TX_FIFO.Push(LikeInteger32(n));
    }
    PushInputIfNotFull(n: number): boolean
    {
        this.AssertLoaded();
        if(this.IsInputFull())
            return false;
        this.machine.TX_FIFO.Push(LikeInteger32(n));
        return true;
    }
    IsInputFull(): boolean
    {
        this.AssertLoaded();
        return this.machine.TX_FIFO.full
    }
    PopOutput(): number | null
    {
        if(this.IsOutputEmpty())
            return null;
        return LikeInteger32(this.machine.RX_FIFO.Pop());
    }
    IsOutputEmpty(): boolean
    {
        return this.machine.RX_FIFO.empty;
    }
    constructor(pio: PIO, config: ProgramConfig, load: boolean=false, block_index?: number, machine_index?: number, offset?: number)
    {
        this._pio = pio;
        this._config = config;
        if(load)
        {
            Assert(block_index != null && machine_index != null && offset != null);
            this.Load(block_index!, machine_index!, offset!);
        }
    }
}
export class PIOAPI
{
    private _pio: PIO;
    private programs: PIOProgram[] = []
    private programs_by_name: Map<string, PIOProgram> = new Map()
    get cycle()
    {
        return this._pio.current_cycle;
    }
    AddProgram(name:string, prog: PIOProgram, auto_load:boolean, start:boolean)
    {
        Assert(!start || auto_load, "Cannot start a program without loading it");
        Assert(!this.programs_by_name.has(name), "Duplicate program name " + name);
        this.programs_by_name.set(name, prog);
        this.programs.push(prog);
        if(auto_load)
        {
            Assert(prog.TryAutoLoad(), "Could not auto-load program " + name);
            if(start)
            {
                prog.Start();
            }
        }
    }
    GetProgram(name_or_index: string | number) : PIOProgram
    {
        if(typeof name_or_index == "number")
        {
            AssertRange(this.programs, name_or_index as number);
            return this.programs[name_or_index as number];
        }
        Assert(this.programs_by_name.has(name_or_index as string));
        return this.programs_by_name.get(name_or_index as string)!;
    }
    GetPrograms(): PIOProgram[]
    {
        return this.programs;
    }
    GetRelevantPins(): Pin[]
    {
        let ret: Pin[] = [];
        for(let it of this.programs)
        {
            ret.concat(it.GetAllPins());
        }
        return ret;
    }
    GetPinState(indx: number): boolean
    {
        return this._pio.GetPin(indx);
    }
    GetPinDir(indx: number): boolean
    {
        AssertRange(pio.pins, indx);
        return this._pio.pins[indx].isout;
    }
    SetPinState(indx: number, v: boolean)
    {
        this._pio.SetPin(indx, v);
    }
    SetPinDir(indx: number, isout: boolean)
    {
        this._pio.SetPinDir(indx, isout);
    }
    µsToCycles(µs: number): number
    {
        return (this._pio.frequency*(µs/1000/100));
    }
    CyclesToµs(n: number): number
    {
        return (n / this._pio.frequency)*1000*1000;
    }
    Advanceµs(µs: number): number
    {
        let c = this.µsToCycles(µs);
        c = Math.max(c, 1);
        this.AdvanceCycles(c);
        return this.CyclesToµs(c);
    }
    Advancems(ms: number): number
    {
        return this.Advanceµs(ms*1000)/1000;
    }
    AdvanceCycles(n: number)
    {
        Assert(n > 0);
        this._pio.Clock(n);
    }
    constructor(pio: PIO)
    {
        this._pio = pio;
    }
}