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

const DRAG_SPEED_MULTIP = 1;

const CYCLES_PER_PIXEL_MIN = 0.001;
const CYCLES_PER_PIXEL_MAX = 10;
const CYCLES_PER_PIXEL_STEP = 0.95;

const GRID_DIVS_H = 9;
const GRID_DIVS_V_SCOPE = 9;
const GRID_DIVS_V_STACKED = 3;
const GRID_COLOR = new ColorRGBA(1, 1, 1, 0.3);
const GRID_COLOR_HIGHLIGHTED = new ColorRGBA(1, 1, 1, 0.5);

const CANVAS_BACKGROUND_COLOR = "black";

export class Plotter
{
    private _pio: PIO;
    private _pins: Pin[] = [];

    private _canvas: HTMLCanvasElement;

    private _wglp: WebglPlot;
    private _linesByPin = new Map<number, WebglLine>();
    private _gridLines: WebglLine[] = [];

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
    private RemoveGrid()
    {
        this._wglp.removeAuxLines();
    }
    private BuildGrid()
    {
        this._wglp.removeAllLines();
        this._wglp.removeDataLines();
        const AddAuxLine = (xy: Float32Array, c: ColorRGBA) =>
        {
            const line = new WebglLine(c, 2);
            line.xy = new Float32Array(xy);
            this._gridLines.push(line);
            this._wglp.addLine(line);
        };
        this.RemoveGrid();
        const offxb = 2 * ((this._canvas.width * this._cycles_per_pixel) / (GRID_DIVS_H + 1) / SAMPLE_BUFFER_SIZE);
        let offx = -(offxb) * Math.ceil(GRID_DIVS_H / 2);
        for(let i = 0; i < GRID_DIVS_H; i++)
        {
            offx += offxb;
            AddAuxLine(new Float32Array([offx, -10000, offx, 10000]), GRID_COLOR);
        }
        if(this.plotMode == PlotMode.STACKED)
        {
            for(let bline of this._linesByPin.values())
            {
                let offy = bline.offsetY;
                let offb = PIN_HIGH * (bline.scaleY / (GRID_DIVS_V_STACKED));
                for(let i = 0; i < GRID_DIVS_V_STACKED; i++)
                {
                    offy += offb;
                    AddAuxLine(new Float32Array([-1000, offy, 1000, offy]),
                        (i == GRID_DIVS_V_STACKED - 1) ? GRID_COLOR_HIGHLIGHTED : GRID_COLOR);
                }

            }
        }
        else if(this.plotMode == PlotMode.OSCILOSCOPE)
        {

        }
        this._linesByPin.forEach((v, k) => this._wglp.addDataLine(v));
    }
    private UpdateGrid()
    {
        this.BuildGrid();
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

        this.UpdateGrid();
        this.UpdateLines();
        this.UpdateScaling();
        const xoff = (this._cycles_per_pixel * this._canvas.width);
        const roff = this._offset - xoff;
        this._wglp.gOffsetX = (((roff / this._cycles_per_pixel))) / this._canvas.width;
        this._gridLines.forEach(it => it.offsetX = -this._wglp.gOffsetX);
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
        if(this._pins.length === 0)
            return;
        const cdif = Number(this._pio.current_cycle - this._lastcycle);
        this._lastcycle = this._pio.current_cycle;


        if(cdif === 0)
            return;

        for(let pin of this._pins)
        {
            let samples = this.GetPinData(pin.index);
            if(samples.length === 0)
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
        if(this.plotMode === PlotMode.STACKED)
        {
            const scale = (range / this._pins.length);
            const mscale = scale + this._sepmargin;
            const peven = (this._pins.length % 2 === 0);
            const ieven = +(index % 2 === 1);
            const dm = (!ieven ? -1 : 1);
            const offset = dm * ((Math.floor(index / 2) + (peven ? 1 : 0)) * mscale) - ieven * (scale / 2);
            //const offset = (dm * (Math.ceil(index / 2) + (peven ? 0 : 1)) * mscale) + dm * (scale / 2);
            line.scaleY = scale / PIN_HIGH;
            line.offsetY = offset;
        }
        else if(this.plotMode === PlotMode.OSCILOSCOPE)
        {
            const scale = Math.min(range, maxscale);
            line.scaleY = 2 * scale / PIN_HIGH;
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
        return this._pio.GetWaveformForPin(pin, 2 ** this._waveform_step).GetSamples();
    }
    private ReloadPin(pin: Pin)
    {
        const line = this._linesByPin.get(pin.index)!;
        line.lineSpaceX(-1, 2 / line.numPoints);
        line.scaleY = 0.1;
        this.AppendLine(line, this.GetPinData(pin.index));
        this._lastcycle = this._pio.current_cycle;
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
            Assert(this._pins.indexOf(pin) === -1, "Attempting to add a pin that's already there");
            this.CreateLine(pin);
        }
        this.Refresh();
    }
    AddPin(pin: Pin)
    {
        Assert(this._pins.indexOf(pin) === -1, "Attempting to add a pin that's already there");
        this.AddPins([pin]);
    }
    constructor(canvas: HTMLCanvasElement, pio: PIO, mode: PlotMode, pins: (Pin | number)[] = [])
    {
        this._canvas = canvas;

        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;

        canvas.style.background = CANVAS_BACKGROUND_COLOR;

        this._pio = pio;
        this._wglp = new WebglPlot(this._canvas);
        this._viewKind = mode;

        if(pins.length > 0)
            this.AddPins(pins);
        this.Refresh();
        canvas.addEventListener("resize", (ev) => 
        {
            console.log("w: " + this._canvas.width + " h: " + this._canvas.height);
            this.Refresh();
        });
        canvas.addEventListener("mousedown", (ev) => this._dragging = true);
        canvas.addEventListener("mouseup", (ev) => this._dragging = false);
        canvas.addEventListener("mouseleave", (ev) => this._dragging = false);
        canvas.addEventListener("mousemove", (ev) => 
        {
            if(!this._dragging)
                return;
            this._offset += ev.movementX * this._cycles_per_pixel * DRAG_SPEED_MULTIP;
            const xoff = (this._cycles_per_pixel * this._canvas.width);
            this._offset = Math.max(0, this._offset);
            this._offset = Math.min(this._offset, SAMPLE_BUFFER_SIZE + xoff);
            this.Refresh();
        });
        canvas.addEventListener("wheel", (ev) => 
        {
            this._cycles_per_pixel *= CYCLES_PER_PIXEL_STEP ** (Math.round(ev.deltaY / 10));
            this._cycles_per_pixel = Math.max(Math.min(this._cycles_per_pixel, CYCLES_PER_PIXEL_MAX), CYCLES_PER_PIXEL_MIN);
            this.Refresh();
        });
    }

}