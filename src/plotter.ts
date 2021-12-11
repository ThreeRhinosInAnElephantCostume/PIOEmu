import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";

import { Pin, PINS_N, PIN_HIGH, PIO, ProgramConfig, SAMPLE_BUFFER_SIZE } from "./PIO/PIO";
import { PIOAPI, PIOProgram } from "./PIO/API";
import { Assert, sleep } from "./PIO/utils";

const line_colors =
    [
        new ColorRGBA(0.3, 1, 0.3, 1),
        new ColorRGBA(0.3, 0.9, 0.8, 1),
        new ColorRGBA(1, 0.4, 0.4, 1)
    ];

export enum PlotMode
{
    OSCILOSCOPE,
    STACKED
}

const CYCLES_PER_PIXEL_MIN = 0.001;
const CYCLES_PER_PIXEL_MAX = 10;
const CYCLES_PER_PIXEL_STEP = 0.9;

export class Plotter
{
    private _pio: PIO;
    private _pins: Pin[] = [];

    private _canvas!: HTMLCanvasElement;

    private _wglp!: WebglPlot;
    private _linesByPin = new Map<number, WebglLine>();

    private _cycles_per_pixel = 1;

    private _waveform_step = 0;

    private _lastcycle = 0n;

    private _vratio = 0.5;
    private _vmargin = 0.05;
    private _sepmargin = 0.05;

    private _viewKind: PlotMode = PlotMode.OSCILOSCOPE;
    private _offset: number = 0;

    private _dragging = false;
    get plotMode(): PlotMode
    {
        return this._viewKind;
    }
    set plotMode(b: PlotMode)
    {
        this.plotMode = b;
        this.Refresh();
    }

    set canvas(canvas: HTMLCanvasElement | null)
    {
        this._canvas = canvas!;
        if(canvas == null)
            return;
        this._wglp = new WebglPlot(this.canvas!);
        canvas.addEventListener("resize", (ev) => this._NewFrame());
        canvas.addEventListener("mousedown", (ev) => this._dragging = true);
        canvas.addEventListener("mouseup", (ev) => this._dragging = false);
        canvas.addEventListener("mouseleave", (ev) => this._dragging = false);
        canvas.addEventListener("mousemove", (ev) => 
        {
            if(!this._dragging)
                return;
            this._offset += ev.movementX * this._cycles_per_pixel;
            const xoff = (this._cycles_per_pixel * this._canvas.width);
            this._offset = Math.max(-xoff, this._offset);
            this._offset = Math.min(this._offset, SAMPLE_BUFFER_SIZE + xoff);
            this.Refresh();
        });
        canvas.addEventListener("wheel", (ev) => 
        {
            if(ev.deltaY > 0)
                this._cycles_per_pixel /= 0.9;
            else
                this._cycles_per_pixel *= 0.9;
            //this._cycles_per_pixel = Math.min(Math.max(this._cycles_per_pixel+(ev.deltaY/5000), CYCLES_PER_PIXEL_MIN), CYCLES_PER_PIXEL_MAX)
            this.Refresh();
        });
        let pincpy = this._pins;
        this._pins = [];
        this._linesByPin.clear();
        this._lastcycle = 0n;
        if(pincpy.length > 0)
            this.AddPins(pincpy);
        this._NewFrame();
    }
    get canvas()
    {
        return this._canvas;
    }

    private _Update()
    {
        const waveform_level = Math.log2(this._cycles_per_pixel);
        const old_res = this._waveform_step;
        if(waveform_level > this._waveform_step + 1)
            this._waveform_step++;
        else if(waveform_level < this._waveform_step - 1 || waveform_level <= 1)
            this._waveform_step = Math.max(this._waveform_step - 1, 0);
        if(this._waveform_step != old_res)
            this._pins.forEach((pin: Pin) => this.ReloadPin(pin));

        this.UpdateLines();
        if(this._canvas != null)
        {
            this.UpdateScaling();
            this._wglp.gOffsetX = (((this._offset / this._cycles_per_pixel) * this._wglp.gScaleX)) / this._canvas.width;
        }
    }
    private _NewFrame()
    {
        this._Update();
        if(this._canvas != null)
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
        if(this._pins.length == 0)
            return;
        const cdif = Number(this._pio.current_cycle - this._lastcycle);
        this._lastcycle = this._pio.current_cycle;

        if(cdif == 0)
            return;

        for(let pin of this._pins)
        {
            let samples = this.GetPinData(pin.index);
            if(samples.length == 0)
                continue;
            Assert(this._linesByPin.has(pin.index));
            const line = this._linesByPin.get(pin.index)!;
            const start = Math.max(0, samples.length - 1 - cdif);
            const end = samples.length - 1;
            this.AppendLine(line, samples.slice(start, end));
        }
    }
    private ScaleLine(pin: Pin, index: number)
    {
        const line = this._linesByPin.get(pin.index)!;
        const maxscale = Math.min((this._canvas.width / this._canvas.height), this._vratio);
        const range = 1.0 - 2 * this._vmargin;
        if(this.plotMode == PlotMode.STACKED)
        {
            const scale = (range / this._pins.length);
            const mscale = scale + this._sepmargin;
            const nodd = (this._pins.length % 2 == 0);
            const iodd = (index % 2 == 0);
            const dm = (iodd ? -1 : 1);
            const offset = (dm * (Math.ceil(index / 2) + (nodd ? 1 : 0)) * mscale) - (scale / 2);
            line.scaleY = scale / PIN_HIGH;
            line.offsetY = offset;
        }
        else if(this.plotMode == PlotMode.OSCILOSCOPE)
        {
            const scale = Math.min(range, maxscale);
            line.scaleY = scale / PIN_HIGH;
            line.offsetY = 0;
        }
    }
    private UpdateScaling()
    {
        this._wglp.gScaleX = SAMPLE_BUFFER_SIZE / (this._canvas.width * this._cycles_per_pixel);
        let i = 0;
        for(let pin of this._pins)
        {
            Assert(this._linesByPin.has(pin.index));
            this.ScaleLine(pin, i);
            i++;
        }
    }

    GetPinData(pin: number): number[]
    {
        return this._pio.log.GetWaveformForPin(pin, 2 ** this._waveform_step).GetSamples();
    }
    private ReloadPin(pin: Pin)
    {
        const line = this._linesByPin.get(pin.index)!;
        line.lineSpaceX(-1, 2 / line.numPoints);
        line.scaleY = 0.1;
        this.AppendLine(line, this.GetPinData(pin.index));
    }
    private CreateLine(pin: Pin)
    {
        const points = Math.round(SAMPLE_BUFFER_SIZE);//this._canvas.width/this._cycles_per_pixel);
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
        line.lineSpaceX(-1, 2 / points);
        line.scaleY = 0.1;
        this._linesByPin.set(pin.index, line);
        this._wglp.addLine(line);
        this.ReloadPin(pin);
    }
    AddPins(pins: (Pin | number)[])
    {
        Assert(pins.length > 0, "Attempting to add 0 pins");
        this.UpdateLines();
        for(let mpin of pins)
        {
            let pin: Pin = (typeof mpin == "number") ? this._pio.pins[mpin] : mpin;
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
    constructor(canvas: HTMLCanvasElement, pio: PIO, mode: PlotMode, pins: (Pin | number)[] = [])
    {
        this._pio = pio;
        this.canvas = canvas!;
        this._viewKind = mode;
        if(pins.length > 0)
            this.AddPins(pins);
        this.Refresh();
    }

}