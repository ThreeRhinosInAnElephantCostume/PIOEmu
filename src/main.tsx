import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";

import { PIO, ProgramConfig } from "./PIO/PIO";
import { PIOAPI, PIOProgram } from "./PIO/API";
import { Assert, sleep } from "./PIO/utils";
import { Plotter, PlotMode } from "./plotter";
import { ReactElement } from "react";
export var pio: PIO;
export var plotters: Plotter[] = [];
export var plotCanvases: ReactElement[] = [];

export function InitPIO()
{
    pio = new PIO();
}
export function RunProgram(progstr: string)
{
    progstr = "90a0\na0c7\n9080\na027\na046\n00a7\n1808\na042\n0085\n0002";
    let buf = progstr;
    let dt: Uint16Array = new Uint16Array(buf.length / 4);

    let ii = 0;
    for(let i = 0; i + 3 < buf.length; i += 5)
    {
        let s = buf.substring(i, i + 4);
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
        console.log(pio.log.GetWaveformForPin(1, 1).GetSamples());
    }

    let api = new PIOAPI(pio);

    const prog_div = 1;

    let prog = new PIOProgram(pio, config);
    api.AddProgram("prog0", prog, true, true);

    prog.clock_divider = prog_div;

    prog.PushInput(16);
    prog.PushInput(4);

    api.AdvanceCycles(prog_div);
    api.Advancems(0.1);

    dbshow();
    plotCanvases.push((<canvas ref={(c) => 
    {
        if(c == null)
            return;
        let plot = new Plotter(c, pio, PlotMode.STACKED, [pio.pins[1], pio.pins[2], pio.pins[3]]);
        plotters.push(plot);
    }}> </canvas>));
}

// export async function test(canvas: HTMLCanvasElement)
// {
//     const devicePixelRatio = window.devicePixelRatio || 1;
//     canvas.width = canvas.clientWidth * devicePixelRatio;
//     canvas.height = canvas.clientHeight * devicePixelRatio;


//     let filename = "examples/pwm";

//     let res = await fetch(filename);
//     Assert(res.ok, "Failed to fetch " + filename);
//     let buf = await res.text();

//     console.log(buf);

//     let dt: Uint16Array = new Uint16Array(buf.length / 4);

//     let ii = 0;
//     for(let i = 0; i + 3 < buf.length; i += 5)
//     {
//         let s = buf.substring(i, i + 4);
//         dt[ii] = Number.parseInt(s, 16);
//         ii++;
//     }
//     dt = dt.slice(0, ii);

//     var pio = new PIO();

//     let instructions = pio.DecodeProgram(dt);
//     let config = new ProgramConfig(instructions);
//     config.sideset_n = 1;
//     config.sideset_opt_en = true;
//     config.sideset_base = 1;
//     pio.SetPinDir(1, true);

//     let progp = pio.GetFreeBlockAndMachine(config.length);

//     function dbshow()
//     {
//         console.log(pio.log.GetWaveformForPin(1, 1).GetSamples());
//     }

//     let api = new PIOAPI(pio);

//     const prog_div = 1;

//     let prog = new PIOProgram(pio, config);
//     api.AddProgram("prog0", prog, true, true);

//     prog.clock_divider = prog_div;

//     prog.PushInput(16);
//     prog.PushInput(4);

//     api.AdvanceCycles(prog_div);
//     api.Advancems(1);

//     dbshow();

//     let plot = new Plotter(canvas, pio, PlotMode.STACKED, [pio.pins[1], pio.pins[2], pio.pins[3]]);
// }