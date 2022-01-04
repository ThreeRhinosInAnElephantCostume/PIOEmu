/* eslint-disable no-eval */
import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";

import { PIO, ProgramConfig } from "./PIO/PIO";
import { PIOAPI, PIOProgram } from "./PIO/API";
import { Assert, sleep } from "./PIO/utils";
import { Plotter, PlotMode } from "./plotter";
import { ReactElement } from "react";
import { Instruction } from "./PIO/instructions/instruction";
export var plotters: Plotter[] = [];
export var plotCanvases: ReactElement[] = [];


function ParseHexProgram(pio: PIO, progstr: string): Instruction[]
{
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

    return pio.DecodeProgram(dt);
}


export function RunProgram(progstr: string, jsstr: string)
{
    plotCanvases = [];
    plotters = [];

    let pio = new PIO();
    let _instructions = ParseHexProgram(pio, progstr);
    let _config = new ProgramConfig(_instructions);
    let api = new PIOAPI(pio);
    let _prog = new PIOProgram(pio, _config);
    api.AddProgram("program_0", _prog, false, false);

    // {
    //     let prog = api.GetProgram("program_0");
    //     prog.SetSidesetPins(1, 1, true);
    //     prog.Start(true);
    //     prog.PushInput(16);
    //     prog.PushInput(7);
    //     api.Advancems(0.1);
    // }

    eval(jsstr);


    plotCanvases.push((<canvas style={{ width: '100%', height: '100%', display: 'block' }} ref={(c) => 
    {
        if(c == null)
            return;
        let plot = new Plotter(c, pio, PlotMode.STACKED, pio.GetRelevantPins());
        plotters.push(plot);
    }}> </canvas >));
    // pio.GetRelevantPins().forEach(pin => plotCanvases.push((<canvas style={{ width: '100%', height: 200 }} ref={(c) => 
    // {
    //     if(c == null)
    //         return;
    //     let plot = new Plotter(c, pio, PlotMode.OSCILOSCOPE, [pin]);
    //     plotters.push(plot);
    // }}> </canvas>)));

}
export function RunTestProgram(progstr: string)
{
    plotCanvases = [];
    plotters = [];

    let pio = new PIO();
    let instructions = ParseHexProgram(pio, progstr);
    let config = new ProgramConfig(instructions);
    pio.SetPinDir(1, true);

    let progp = pio.GetFreeBlockAndMachine(config.length);

    function dbshow()
    {
        console.log(pio.GetWaveformForPin(1, 1).GetSamples());
    }

    let api = new PIOAPI(pio);

    const prog_div = 1;

    let prog0 = new PIOProgram(pio, config.clone());
    let prog1 = new PIOProgram(pio, config.clone());
    api.AddProgram("prog0", prog0, true, true);
    api.AddProgram("prog1", prog1, true, true);

    prog0.clock_divider = prog_div;
    prog1.clock_divider = prog_div;

    prog1.SetSidesetPins(2, 1, true);
    prog1.PushInput(16);
    prog1.PushInput(4);

    prog0.SetSidesetPins(1, 1, true);
    prog0.PushInput(16);
    prog0.PushInput(5);

    api.AdvanceCycles(prog_div);
    api.Advancems(0.1);

    prog0.PushInput(8);
    api.Advancems(0.1);

    dbshow();
    plotCanvases.push((<canvas style={{ width: '100%', height: 200 }} ref={(c) => 
    {
        if(c == null)
            return;
        let plot = new Plotter(c, pio, PlotMode.STACKED, prog0.GetAllPinIndices().concat(prog1.GetAllPinIndices()));
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