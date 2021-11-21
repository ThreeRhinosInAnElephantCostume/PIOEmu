import express from "express";
import { PIO, ProgramConfig } from "../public/JS/PIO/PIO";
import { PIOAPI, PIOProgram } from "../public/JS/PIO/API";
import * as fs from "fs";
import { Assert, sleep } from "../public/JS/utils";
import * as path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { isPostfixUnaryExpression } from "typescript";

// const __filename = fileURLToPath(import.meta.url);
// let __dirname = dirname(__filename);

__dirname = path.join(__dirname,  "/../..");

console.log("123"); 

// let builddir = path.join(__dirname,  "/build/public");
// let pubdir = path.join(__dirname, "public");
// let exdir = path.join(__dirname, "/examples");
// let nodedir = path.join(__dirname, "/node_modules");
// let rootdir = __dirname;

// let app = express();

// app.use(express.static(rootdir));
// app.use(express.static(nodedir));
// app.use(express.static(pubdir));
// app.use(express.static(builddir));
// app.use("/examples", express.static(exdir));
// app.use("/", express.static(pubdir + "/HTML"));

// app.listen(8080);

let pio = new PIO();

let buf = fs.readFileSync("examples/pwm", "utf-8");

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

let prog = new PIOProgram(pio, config);
api.AddProgram("prog0", prog, true, true);
prog.PushInput(16);
prog.PushInput(4);
const d = 133;
prog.clock_divider = d;
api.AdvanceCycles(d);
while(true)
{
    api.Advancems(1);
    dbshow();
    sleep(1000);
}

// pio.AddProgram(progp.block_index, progp.machine_index, progp.offset, conf);
// pio.StartProgram(progp.block_index, progp.machine_index);
// pio.PushData(progp.block_index, progp.machine_index, 16);
// pio.PushData(progp.block_index, progp.machine_index, 4);
// pio.Clock(1);
// dbshow();
// pio.Clock(1);
// dbshow();
// pio.Clock(1);
// pio.Clock(10);
// dbshow();
// while(true)
// {
//     pio.Clock(100);   
//     dbshow();
//     sleep(1);
// }
