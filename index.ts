import express = require("express"); 
import { PIO, ProgramConfig } from "./PIO/PIO";
import fs = require("fs");
import { Assert, sleep } from "./utils";

console.log("123"); 

let pio = new PIO();

let buf = fs.readFileSync("temp/pwm");

Assert(buf.length % 2 == 0);

let dt: Uint16Array = new Uint16Array(buf.length/2);

for(let i = 0; i < buf.length; i+=2)
{
    dt[i/2] = buf.readUInt16LE(i);
}

let instructions = pio.DecodeProgram(dt);
let conf = new ProgramConfig(instructions);
conf.sideset_n = 1;
conf.sideset_opt_en = false;
conf.sideset_base = 7;
conf.pins_n = 1;
conf.pins_base = 6;

let progp = pio.GetFreeBlockAndMachine(conf.length);

pio.AddProgram(progp.block_index, progp.machine_index, progp.offset, conf);
pio.StartProgram(progp.block_index, progp.machine_index);
pio.Clock(10);
pio.PushData(progp.block_index, progp.machine_index, 122);
pio.Clock(10);
while(true)
{
    pio.Clock(1);   
    sleep(1);
}

