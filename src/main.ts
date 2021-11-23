import { WebglPlot, WebglLine, ColorRGBA } from "./webgl-plot/dist/webglplot";

import { PIO, ProgramConfig } from "./PIO/PIO";
import { PIOAPI, PIOProgram } from "./PIO/API";
import { Assert, sleep } from "./PIO/utils";
import { Graph, PlotMode } from "./graph";


const canvas = document.getElementById("my_canvas")! as HTMLCanvasElement;
const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

var pio = new PIO();

let filename = "examples/pwm";

let res = await fetch(filename);
Assert(res.ok, "Failed to fetch " + filename);
let buf = await res.text();

let dt: Uint16Array = new Uint16Array(buf.length/4);

let ii = 0;
for(let i = 0; i+3 < buf.length; i+=5)
{
    let s = buf.substring(i, i+4);
    dt[ii] = Number.parseInt(s, 16);
    ii++;
}
dt = dt.slice(0, ii);

let instructions = pio.DecodeProgram(dt);
let config = new ProgramConfig(instructions);
config.sideset_n = 1;
config.sideset_opt_en = true;
config.sideset_base = 1;
pio.SetPinDir(1, true);

let progp = pio.GetFreeBlockAndMachine(config.length);

function dbshow()
{
    console.log(pio.log.GetWaveformForPin(1).GetSamples());
}

let api = new PIOAPI(pio);

const prog_div = 1;

let prog = new PIOProgram(pio, config);
api.AddProgram("prog0", prog, true, true);

prog.clock_divider = prog_div;

prog.PushInput(16);
prog.PushInput(4);

api.AdvanceCycles(prog_div);
api.Advancems(1);

dbshow();

let graph = new Graph(canvas, pio, PlotMode.STACKED, [pio.pins[1], pio.pins[2], pio.pins[3]]);

