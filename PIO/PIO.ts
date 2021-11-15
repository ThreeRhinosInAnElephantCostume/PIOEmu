export {PIO};

import { Machine } from "./machine";
import { Block } from "./block";
import { Instruction, JMP, MOV, PULL } from "./instructions";
import { Assert, BitRange } from "../utils";

export const SAMPLE_BUFFER_SIZE=1*1000*1000;
export const PINS_N = 32;
export const PIN_HIGH = 3.3;
export const PIN_LOW = 0;


class Pin
{
    isout: boolean = false;
    state: boolean = false;
}
class Waveform
{
    private samples: number[];
    private next: number = 0;
    private prev: number = 0;
    get size() : number
    {
        return this.samples.length;
    }

    capacity: number;
    resolution: number;
    oldest_sample_cycle: bigint = 0n;
    youngest_sample_cycle: bigint = 0n;

    partial_sample: number = 0;
    partial_counter: number = 0;

    private _AddSample(s: number)
    {
        if(this.capacity == this.size)
            this.oldest_sample_cycle+= BigInt(this.resolution);
        this.samples[this.next] = s;
        this.prev = this.next;
        this.next++;
        this.next %= this.capacity;
    }
    AddSample(s: number)
    {
        this.youngest_sample_cycle++;
        if(this.resolution == 1)
        {
            this._AddSample(s);
        }
        else
        {
            if(this.partial_counter == 0)
                this._AddSample(s);
            this.partial_counter++;
            if(this.partial_counter == this.resolution)
            {
                this.partial_counter = 0;
                this.samples[this.prev] = this.partial_sample;
                this.partial_sample = 0;
            }
            else
            {
                this.partial_sample += s/this.resolution;
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
            this.samples.copyWithin(this.size-1, 0, this.next);
            this.next = 0;
            this.samples = this.samples.concat(this.samples.splice(0, this.next));
        }
        return this.samples;
    }
    
    RecreateWithResolution(res: number): Waveform
    {
        let w = new Waveform(this.capacity, res);
        w.AddSamples(this.samples);
        w.youngest_sample_cycle = this.youngest_sample_cycle;
        this.oldest_sample_cycle = this.oldest_sample_cycle;
        return w;
    }

    constructor(capacity: number, resolution: number)
    {
        this.capacity = capacity;
        this.samples = [];
        this.resolution = resolution;
    }
}
class Log
{
    private pin_waveforms: Waveform[][];
    AddSample(pinid:number, s: number)
    {
        let waveforms: Waveform[] = this.pin_waveforms[pinid];
        for(let it of waveforms)
        {
            it.AddSample(s);
        }
        const last = waveforms[waveforms.length-1];
        if(last.size == last.capacity)
        {
            waveforms.push(last.RecreateWithResolution(last.resolution*2));
        }
    }
    GetLastSampleCycle(pinid: number): bigint
    {
        return this.GetWaveformForPin(pinid).youngest_sample_cycle;
    }
    GetWaveformsForPin(pinid: number): Waveform[]
    {
        Assert(pinid >= 0 && pinid < this.pin_waveforms.length);
        return this.pin_waveforms[pinid];
    }
    GetWaveformForPin(pinid: number): Waveform
    {
        Assert(pinid >= 0 && pinid < this.pin_waveforms.length);
        return this.pin_waveforms[pinid][0];
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


class PIO 
{
    pins: Pin[];
    blocks: Block[];
    current_cycle: bigint = 0n;

    log: Log = new Log();

    SimulatePin(pinid: number, state: boolean, cycle: bigint)
    {
        const lastupdate = this.log.GetLastSampleCycle(pinid);
        if(cycle == lastupdate)
            return;
        Assert(cycle <= lastupdate);
        for(let i = 0; i < lastupdate-cycle; i++)
        {
            this.log.AddSample(pinid, (state) ? PIN_HIGH : PIN_LOW); // TODO: simulating pin capacitance
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
        this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle);
        return this.pins[pinid].state;
    }
    SetPin(pinid: number, val: boolean)
    {
        Assert(pinid >= 0 && pinid < this.pins.length);
        if(!this.pins[pinid].isout)
        {
            this.LogWarning("Pin " + this.pins)
            return;
        }
        if(this.current_cycle > 0)
            this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle-1n);
        this.pins[pinid].state = val;
        this.SimulatePin(pinid, this.pins[pinid].state, this.current_cycle);
    }
    SetPinDir(pinid: number, isout: boolean)
    {
        Assert(pinid >= 0 && pinid < this.pins.length);
        this.pins[pinid].isout = isout;
    }

    Clock(n: number)
    {
        let sm: [Machine, Block][] = [];
        this.blocks.forEach((b)=>b.machines.forEach((m) => {if(m.running)sm.push([m, b]);}));
        sm.sort((a, b) => a[0].ClockDivisor()-b[0].ClockDivisor());
        let step  = Math.floor(sm[0][0].ClockDivisor());
        while (n > 0)
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
    }

    DecodeInstruction(dt: number): Instruction
    {
        let inst: Instruction;
        const ident = BitRange(dt, 13, 15); 
        const ds = BitRange(dt, 8, 12);
        switch(ident)
        {
            case 0b000:
                inst = new JMP(BitRange(dt, 5, 7), BitRange(dt, 0, 4), ds);
                break;
            case 0b100:
                if(BitRange(dt, 7, 7))
                    inst = new PULL(BitRange(dt, 5, 5) > 0, BitRange(dt, 6, 6) > 0, ds);
                break;
            case 0b101:
                inst = new MOV(BitRange(dt, 5, 7), BitRange(dt, 3, 4), BitRange(dt, 0, 2), ds);
                break;
        }
        Assert(inst! != null && inst! != undefined);
        return inst!;
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