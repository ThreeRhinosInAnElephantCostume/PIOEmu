import { WebglPlot, WebglLine, ColorRGBA } from "./webgl-plot/dist/webglplot";

import { Pin, PINS_N, PIN_HIGH, PIO, ProgramConfig } from "./PIO/PIO";
import { PIOAPI, PIOProgram } from "./PIO/API";
import { Assert, sleep } from "./PIO/utils";

const line_colors = [new ColorRGBA(0.3, 1, 0.3, 1)]

export enum PlotMode
{
    OSCILOSCOPE,
    STACKED
}

export class Graph
{
    private _pio: PIO;
    private _pins: Pin[] = [];

    private _canvas: HTMLCanvasElement;

    private _wglp: WebglPlot;
    private _linesByPin= new Map<number, WebglLine>();
    private _cycles_per_pixel = 1;

    private _lastcycle = 0n;

    private _vratio = 0.5;
    private _vmargin = 0.05;
    private _sepmargin = 0.05;

    private _viewKind: PlotMode = PlotMode.OSCILOSCOPE;
    get plotMode(): PlotMode
    {
        return this._viewKind;
    }
    set plotMode(b: PlotMode)
    {
        this.plotMode = b;
        this.Refresh();
    }

    private _Update()
    {
        this.UpdateLines();
        this.UpdateScaling();
    }
    private _NewFrame()
    {
        this._Update();
        this._wglp.update();
    }
    Refresh()
    {
        requestAnimationFrame(this._NewFrame.bind(this));
    }

    AppendLine(line: WebglLine, dt: number[])
    {
        line?.shiftAdd(new Float32Array(dt));
    }

    UpdateLines()
    {
        const cdif = Number(this._pio.current_cycle - this._lastcycle);
        this._lastcycle = this._pio.current_cycle;

        if(cdif == 0 || this._pins.length == 0)
            return;

        for(let pin of this._pins)
        {
            let samples = this.GetPinData(pin.index);
            if(samples.length == 0)
                continue;
            Assert(this._linesByPin.has(pin.index));
            const line = this._linesByPin.get(pin.index)!;
            const start = Math.max(0, samples.length-1-cdif);
            const end = samples.length-1;
            this.AppendLine(line, samples.slice(start, end));
        }
    }
    private ScaleLine(pin: Pin, index: number)
    {
        const line = this._linesByPin.get(pin.index)!;
        const maxscale =  Math.min((this._canvas.width/this._canvas.height), this._vratio);
        const range = 1.0-2*this._vmargin; 
        if(this.plotMode == PlotMode.STACKED)
        {
            const scale = (range/this._pins.length);
            const mscale = scale + this._sepmargin;
            const nodd = (this._pins.length % 2 == 0);
            const iodd = (index % 2 == 0);
            const dm = (iodd ? -1 : 1);
            const offset = (dm*(Math.ceil(index/2) + (nodd ? 1 : 0))*mscale) - (scale/2);
            console.log(scale, offset);
            line.scaleY = scale/PIN_HIGH;
            line.offsetY = offset;
        }
        else if(this.plotMode == PlotMode.OSCILOSCOPE)
        {
            const scale = Math.min(range, maxscale);
            line.scaleY = scale/PIN_HIGH;
            line.offsetY = 0;
        }
    }
    private UpdateScaling()
    {
        let i = 0;
        for(let pin of this._pins)
        {
            Assert(this._linesByPin.has(pin.index));
            this.ScaleLine(pin, i);
            i++;
        }
    }

    GetPinData(pin: number) : number[]
    {
        return this._pio.log.GetWaveformForPin(pin).GetSamples();
    }
    private CreateLine(pin: Pin)
    {
        const points =  Math.round(this._canvas.width/this._cycles_per_pixel);
        let c: ColorRGBA;
        if(this._pins.length < line_colors.length)
        {
            c = line_colors[this._pins.length];
        }
        else
        {
            c = new ColorRGBA(Math.random(), Math.random(), Math.random(), 1);
        }
        this._pins.push(pin);
        const line = new WebglLine(c, points);
        line.lineSpaceX(-1, 2/points);
        line.scaleY = 0.1;
        this._linesByPin.set(pin.index, line);
        this._wglp.addLine(line);
        this.AppendLine(line, this.GetPinData(pin.index));
    }
    AddPins(pins: Pin[])
    {
        Assert(pins.length > 0, "Attempting to add 0 pins");
        this.UpdateLines();
        for(let pin of pins)
        {
            Assert(this._pins.indexOf(pin) == -1, "Attempting to add a pin that's already there");
            this.CreateLine(pin);
        }
        this.Refresh();
    }
    AddPin(pin: Pin)
    {
        Assert(this._pins.indexOf(pin) == -1, "Attempting to add a pin that's already there");
        this.AddPins([pin]);
    }
    constructor(canvas:HTMLCanvasElement, pio: PIO, mode: PlotMode, pins: Pin[] = [])
    {
        this._canvas = canvas;
        this._pio = pio;
        this._wglp = new WebglPlot(this._canvas);
        this._viewKind = mode;
        if(pins.length > 0)
            this.AddPins(pins);
        this.Refresh();
    }
    
}