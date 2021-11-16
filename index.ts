import express = require("express"); 
import { PIO, ProgramConfig } from "./PIO/PIO";
import fs = require("fs");
import { Assert, sleep } from "./utils";

console.log("123"); 

let pio = new PIO();

let buf = fs.readFileSync("temp/pwm", "utf-8");

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
let conf = new ProgramConfig(instructions);
conf.sideset_n = 1;
conf.sideset_opt_en = true;
conf.sideset_base = 1;
pio.SetPinDir(1, true);

let progp = pio.GetFreeBlockAndMachine(conf.length);

function dbshow()
{
    console.log(pio.log.GetWaveformForPin(1).GetSamples());
}

pio.AddProgram(progp.block_index, progp.machine_index, progp.offset, conf);
pio.StartProgram(progp.block_index, progp.machine_index);
pio.PushData(progp.block_index, progp.machine_index, 16);
pio.PushData(progp.block_index, progp.machine_index, 4);
pio.Clock(1);
dbshow();
pio.Clock(1);
dbshow();
pio.Clock(1);
pio.Clock(10);
dbshow();
while(true)
{
    pio.Clock(100);   
    dbshow();
    sleep(1);
}

