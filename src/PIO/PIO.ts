
import { Machine } from "./machine";
import { Block } from "./block";
import { Instruction, JMP, WAIT, IN, OUT, PUSH, PULL, MOV, IRQ, SET, NOP } from "./instructions/instructions";

import { Assert, AssertBits, AssertInteger32, AssertRange, BitRange, LikeInteger32, ShiftDir } from "./utils";

export const SAMPLE_BUFFER_SIZE = 1 * 1000 * 10;
export const PINS_N = 32;
export const PIN_HIGH = 3.3;
export const PIN_LOW = 0;


export class ProgramConfig
{
    instructions: Instruction[];

    length: number;

    wrap: number = 0;
    wrap_target: number;

    sideset_opt_en: boolean = false;
    sideset_n: number = 0;
    sideset_base: number = 0;

    in_shiftdir: ShiftDir = ShiftDir.DEFAULT;
    out_shiftdir: ShiftDir = ShiftDir.DEFAULT;

    set_pins_n: number = 0;
    set_pins_base: number = 0;
    out_pins_n: number = 0;
    out_pins_base: number = 0;
    in_pins_n: number = 0;
    in_pins_base: number = 0;

    pindirs_n: number = 0;
    pindirs_base: number = 0;

    jmp_pin: number = -1;

    autopull: boolean = false;
    autopull_threshold: number = 0;
    autopush: boolean = false;
    autopush_threshold: number = 0;

    f_join_into_rx: boolean = false;
    f_join_into_tx: boolean = false;

    clone(): ProgramConfig
    {
        let ret = JSON.parse(JSON.stringify(this));
        ret.instructions = this.instructions;
        return ret;
    }

    set_instructions(instructions: Instruction[])
    {
        this.instructions = instructions;
        this.length = instructions.length;
        this.wrap_target = instructions.length;
    }

    constructor(instructions: Instruction[])
    {
        this.set_instructions(instructions);
        this.instructions = instructions;
        this.length = instructions.length;
        this.wrap_target = instructions.length;
    }

}

export class Pin
{
    index: number;
    isout: boolean = false;
    state: boolean = false;
    relevant: boolean = false;
    constructor(index: number)
    {
        this.index = index;
    }
}
export class Waveform
{
    private samples: number[];
    private next: number = 0;
    private prev: number = 0;
    get size(): number
    {
        return this.samples.length;
    }

    capacity: number;
    resolution: number;
    oldest_sample_cycle: bigint = 0n;
    youngest_sample_cycle: bigint = 0n;

    partial_sample: number = 0;
    partial_counter: number = 0;

    last_sample: number = 0;

    private _AddSample(s: number)
    {
        if(this.capacity == this.size)
            this.oldest_sample_cycle += BigInt(this.resolution);
        this.samples[this.next] = s;
        this.prev = this.next;
        this.next++;
        this.next %= this.capacity;
    }
    ReplaceLastSample(s: number)
    {
        this.samples[this.prev] = s;
        if(this.resolution == 1)
        {
            if(this.prev != this.next)
            {
                this.partial_counter = 0;
                this.prev--;
                this.next--;
                if(this.prev < 0)
                    this.prev = this.capacity - 1;
                if(this.next < 0)
                    this.next = this.capacity - 1;
            }
        }
        else if(this.partial_counter == 0)
        {
            let pprev = this.prev - 1;
            if(pprev == -1)
                pprev = this.capacity - 1;
            this.samples[pprev] -= this.last_sample / this.resolution;
            this.samples[pprev] += s / this.resolution;
        }
        else
        {
            this.partial_sample -= this.last_sample / this.resolution;
            this.partial_sample += s;
        }
        this.last_sample = s;

    }
    AddSample(s: number)
    {
        this.youngest_sample_cycle++;
        this.last_sample = s;
        if(this.resolution == 1)
        {
            this._AddSample(s);
        }
        else
        {
            if(this.partial_counter == 0)
                this._AddSample(s);
            this.partial_counter++;
            this.partial_sample += s / this.resolution;
            if(this.partial_counter == this.resolution)
            {
                this.partial_counter = 0;
                this.samples[this.prev] = this.partial_sample;
                this.partial_sample = 0;
            }
            else
            {
                this.samples[this.prev] = s;
            }
        }
    }
    AddSamples(sl: number[]) // TODO: optimize this
    {
        for(let it of sl)
        {
            this.AddSample(it);
        }
    }

    GetSamples(): number[]
    {
        if(this.size == this.capacity && this.next != 0)
        {
            this.samples.copyWithin(this.size - 1, 0, this.next);
            this.next = 0;
            this.samples = this.samples.concat(this.samples.splice(0, this.next));
        }
        return this.samples;
    }

    RecreateWithResolution(res: number): Waveform
    {
        let w = new Waveform(this.capacity, res);
        w.AddSamples(this.GetSamples());
        w.youngest_sample_cycle = this.youngest_sample_cycle;
        w.oldest_sample_cycle = this.oldest_sample_cycle;
        return w;
    }

    constructor(capacity: number, resolution: number)
    {
        this.capacity = capacity;
        this.samples = [];
        this.resolution = resolution;
    }
}
export class Log
{
    private pin_waveforms: Waveform[][];
    ReplaceLastSample(pinid: number, s: number)
    {
        let waveforms: Waveform[] = this.pin_waveforms[pinid];
        for(let it of waveforms)
        {
            it.ReplaceLastSample(s);
        }
    }
    AddSample(pinid: number, s: number)
    {
        let waveforms: Waveform[] = this.pin_waveforms[pinid];
        for(let it of waveforms)
        {
            it.AddSample(s);
        }
        const last = waveforms[waveforms.length - 1];
        if(last.size == last.capacity)
        {
            waveforms.push(last.RecreateWithResolution(last.resolution * 2));
        }
    }
    GetLastSampleCycle(pinid: number): bigint
    {
        return this.GetWaveformForPin(pinid, 1).youngest_sample_cycle;
    }
    GetWaveformsForPin(pinid: number): Waveform[]
    {
        Assert(pinid >= 0 && pinid < this.pin_waveforms.length);
        return this.pin_waveforms[pinid];
    }
    GetWaveformForPin(pinid: number, cycles_per_sample: number): Waveform
    {
        Assert(pinid >= 0 && pinid < this.pin_waveforms.length);
        Assert(cycles_per_sample > 0);
        let waveforms: Waveform[] = this.pin_waveforms[pinid];
        const expected_depth = Math.log2(cycles_per_sample);
        const closest_depth = Math.max(Math.round(expected_depth), 0);
        while(waveforms.length <= closest_depth)
            waveforms.push(waveforms[waveforms.length - 1].RecreateWithResolution(waveforms[waveforms.length - 1].resolution * 2));
        this.pin_waveforms[pinid] = waveforms;
        return waveforms[closest_depth];
    }
    constructor()
    {
        this.pin_waveforms = [];
        for(let i = 0; i < PINS_N; i++)
        {
            this.pin_waveforms.push([new Waveform(SAMPLE_BUFFER_SIZE, 1)]);
        }
    }
}


export class PIO 
{
    pins: Pin[];
    blocks: Block[];
    current_cycle: bigint = 0n;

    frequency: number;

    private log: Log = new Log();

    irq_vector: boolean[];

    on_clock_end: (pio: PIO) => void = (pio: PIO) => {};

    private MarkPinRelevant(pinid: number)
    {
        this.pins[pinid].relevant = true;
    }
    GetRelevantPins(): Pin[]
    {
        return this.pins.filter(it => it.relevant);
    }
    GetWaveformsForPin(pinid: number): Waveform[]
    {
        this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle);
        return this.log.GetWaveformsForPin(pinid);
    }
    GetWaveformForPin(pinid: number, cycles_per_sample: number): Waveform
    {
        this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle);
        return this.log.GetWaveformForPin(pinid, cycles_per_sample);
    }
    SimulatePin(pinid: number, state: boolean, cycle: bigint)
    {
        Assert(cycle >= 0);
        const lastupdate = this.log.GetLastSampleCycle(pinid);
        Assert(cycle >= lastupdate);
        if(cycle == lastupdate)
        {
            this.log.ReplaceLastSample(pinid, (state) ? PIN_HIGH : PIN_LOW);
            return;
        }
        for(let i = 0; i < cycle - lastupdate; i++)
        {
            this.log.AddSample(pinid, (state) ? PIN_HIGH : PIN_LOW); // TODO: simulating pin capacitance
        }
    }

    UpdateAllPins()
    {
        for(let i = 0; i < this.pins.length; i++)
        {
            this.SimulatePin(i, this.pins[i].state, this.current_cycle);
        }
    }

    LogWarning(msg: string)
    {
        console.log(msg);
    }
    LogError(msg: string)
    {
        console.log(msg);
    }
    GetPin(pinid: number)
    {
        Assert(pinid >= 0 && pinid < this.pins.length);
        this.MarkPinRelevant(pinid);
        this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle);
        return this.pins[pinid].state;
    }
    SetPin(pinid: number, val: boolean)
    {
        Assert(pinid >= 0 && pinid < this.pins.length);
        this.MarkPinRelevant(pinid);
        if(!this.pins[pinid].isout)
        {
            this.LogWarning("Pin " + this.pins);
            return;
        }
        if(this.current_cycle > 0)
            this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle - 1n);
        this.pins[pinid].state = val;
        this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle);
    }
    SetPinDir(pinid: number, isout: boolean)
    {
        AssertRange(this.pins, pinid);
        this.MarkPinRelevant(pinid);
        this.pins[pinid].isout = isout;
    }
    SetPinDirs(pin_base: number, n: number, isout: boolean)
    {
        Assert(n > 0);
        for(let i = 0; i < n; i++)
        {
            this.SetPinDir(i + pin_base, isout);
        }
    }

    Clock(n: number)
    {
        let sm: [Machine, Block][] = [];
        this.blocks.forEach((b) => b.machines.forEach((m) => { if(m.running) sm.push([m, b]); }));
        sm.sort((a, b) => a[0].ClockDivisor() - b[0].ClockDivisor());
        let step = Math.floor(sm[0][0].ClockDivisor());
        while(n > 0)
        {
            let nstep = Math.min(n, step);
            const startcycle: bigint = this.current_cycle;
            for(let it of sm)
            {
                this.current_cycle = BigInt(startcycle) + BigInt(Math.min(nstep, it[0].ClocksTillTick()));
                it[0].Clock(it[1], nstep);
            }
            this.current_cycle = startcycle + BigInt(nstep);
            n -= nstep;
        }
        this.on_clock_end(this);
    }
    static DecodeInstruction(dt: number): Instruction
    {
        Assert(dt >= 0);
        AssertBits(dt, 16);
        let inst: Instruction;
        const ident = BitRange(dt, 13, 15);
        const sd = BitRange(dt, 8, 12);
        switch(ident)
        {
            case 0b000:
                inst = new JMP(BitRange(dt, 5, 7), BitRange(dt, 0, 4), sd);
                break;
            case 0b001:
                inst = new WAIT(!!BitRange(dt, 7, 7), BitRange(dt, 5, 6), BitRange(dt, 0, 4), sd);
                break;
            case 0b010:
                inst = new IN(BitRange(dt, 5, 7), BitRange(dt, 0, 4), sd);
                break;
            case 0b011:
                inst = new OUT(BitRange(dt, 5, 7), BitRange(dt, 0, 4), sd);
                break;
            case 0b100:
                if(BitRange(dt, 7, 7))
                    inst = new PULL(!!BitRange(dt, 5, 5), !!BitRange(dt, 6, 6), sd);
                else
                    inst = new PUSH(!!BitRange(dt, 5, 5), !!BitRange(dt, 6, 6), sd);
                break;
            case 0b101:
                const destination = BitRange(dt, 5, 7);
                const op = BitRange(dt, 3, 4);
                const source = BitRange(dt, 0, 2);
                if(source == destination && source == 0b010 && op == 0b00)
                    inst = new NOP(sd);
                else
                    inst = new MOV(destination, op, source, sd);
                break;
            case 0b110:
                if(!BitRange(dt, 7, 7))
                    inst = new IRQ(!!BitRange(dt, 6, 6), !!BitRange(dt, 5, 5), BitRange(dt, 0, 4), sd);
                break;
            case 0b111:
                inst = new SET(BitRange(sd, 5, 7), BitRange(sd, 0, 4), sd);
                break;
        }
        Assert(inst! != null && inst! != undefined, "Invalid instruction!");
        return inst!;
    }
    DecodeInstruction(dt: number): Instruction
    {
        return PIO.DecodeInstruction(dt);
    }
    static DecodeProgram(data: Uint16Array): Instruction[]
    {
        let ret = [];
        for(let it of data)
        {
            ret.push(this.DecodeInstruction(it));
        }
        return ret;
    }
    DecodeProgram(data: Uint16Array): Instruction[]
    {
        return PIO.DecodeProgram(data);
    }
    GetFreeBlockAndMachine(n_inst: number): { found: boolean; block_index: number; machine_index: number, offset: number; }
    {
        let ret = { found: false, block_index: -1, machine_index: -1, offset: -1 };
        for(let i = 0; i < this.blocks.length; i++)
        {
            const it = this.blocks[i];
            let mach = it.TryGetFreeMachine();
            if(mach == -1)
                continue;
            let off = it.TryAccomodateProgram(n_inst);
            if(off == -1)
                continue;
            ret.found = true;
            ret.block_index = i;
            ret.machine_index = mach;
            ret.offset = off;
            break;
        }

        return ret;
    }
    RemoveProgram(block_index: number, machine_index: number)
    {
        AssertRange(this.blocks, block_index);
        this.blocks[block_index].RemoveProgram(machine_index);
    }
    AddProgram(block_index: number, machine_index: number, offset: number, config: ProgramConfig)
    {
        AssertRange(this.blocks, block_index);
        this.blocks[block_index].AddProgram(machine_index, offset, config);
        this.UpdateAllPins();
    }
    StartProgram(block_index: number, machine_index: number) // TODO: program interface
    {
        this.blocks[block_index].machines[machine_index].running = true;
    }
    SetIRQ(address: number, val: boolean): boolean // TODO: attaching interrupts
    {
        AssertRange(this.irq_vector, address);
        if(this.irq_vector[address] == val)
            return false;
        this.irq_vector[address] = val; // TODO: attaching interrupts
        return true;
    }
    ClearIRQ(address: number): boolean
    {
        return this.SetIRQ(address, false);
    }
    RaiseIRQ(address: number): boolean
    {
        return this.SetIRQ(address, true);
    }
    GetIRQ(address: number): boolean
    {
        AssertRange(this.irq_vector, address);
        return this.irq_vector[address];
    }

    constructor(frequency: number = 133 * 1000 * 1000, pins_n: number = 32, block_n: number = 2, machines_per_block: number = 4, instructions_per_machine: number = 32)
    {
        this.frequency = frequency;
        this.pins = [];
        for(let i = 0; i < pins_n; i++)
        {
            this.pins.push(new Pin(i));
        }
        this.blocks = [];
        for(let i = 0; i < block_n; i++)
        {
            this.blocks.push(new Block(this, machines_per_block, instructions_per_machine));
        }
        this.irq_vector = [];
        for(let i = 0; i < 7; i++)
        {
            this.irq_vector.push(false);
        }
    }

}