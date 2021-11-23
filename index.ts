
import * as fs from "fs";
import express from "express";
import * as path from "path";

import { PIO, ProgramConfig } from "./src/PIO/PIO";
import { PIOAPI, PIOProgram } from "./src/PIO/API";
import { Assert, sleep } from "./src/PIO/utils";

function quicktest()
{
    var pio = new PIO();
    
    let filename = "examples/pwm";
    
    
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
    prog.clock_divider = 100;
    prog.PushInput(16);
    prog.PushInput(4);
    const d = 133;
    prog.clock_divider = d;
    api.AdvanceCycles(d);
    api.Advancems(1);
    dbshow();
}

quicktest();

console.log("123"); 
console.log(__dirname);

let app = express();

let exdir = path.join(__dirname,  "/examples");

let builddir = path.join(__dirname,  "/build");
let pubdir = path.join(__dirname, "/public");
let nodedir = path.join(__dirname, "/node_modules");
let srcdir = path.join(__dirname, "/src");

app.use(express.static(exdir));

app.use(express.static(builddir));
app.use(express.static(pubdir));
app.use(express.static(nodedir));
app.use(express.static(srcdir));
//app.use("/", express.static(path.join(htmldir, "index.html")));
app.use(express.static(path.join(pubdir, "/HTML")));
app.use(express.static(path.join(pubdir, "/JS")));
app.use(express.static(path.join(pubdir, "/CSS")));
app.use(express.static(path.join(nodedir, "/webgl-plot/dist")));

app.use("/webgl-plot/dist/*",express.static(path.join(nodedir, "/webgl-plot/dist")));
app.use("/webgl-plot/dist/webglplot/",express.static(path.join(nodedir, "/webgl-plot/dist/webglplot.js")));


app.use("*", (request, response) =>
{
    let p: string = (request.params as any[])[0];
    console.log("GET: " + p);
    if(p == "/")
    {
        let res = path.join(pubdir, "/HTML", "/index.html");
        console.log("=:", res);
        response.sendFile(res);
        return;
    }
    if(p.match("/examples"))
    {
        let res = path.join(__dirname, p);
        if(fs.existsSync(res))
        {
            console.log("=: ", res);
            response.sendFile(res);
            return;
        }
    }
    if(p.match("/webgl-plot/dist/"))
    {
        let l = path.basename(p)
        if(p == "/webgl-plot/dist/webglplot/")
            l = "webglplot";
        let res = path.join(nodedir, "webgl-plot/dist", l);
        if(res[res.length-1] == "/")
            res = res.substring(0, res.length-1);
        if(path.extname(res) != ".js" && path.extname(res) != ".map")
            res += ".js";
        console.log("=: ", res);
        response.sendFile(res);
        return;
    }
    function TryFindMatching(bp: string, p: string): string | null
    {
        let res = path.join(bp, p);
        if(res[res.length-1] == "/")
            res = res.substring(0, res.length-1);
        let rres = res;
        if(!fs.existsSync(rres = res))
            if(!fs.existsSync(rres = (res + ".js")))
                if(!fs.existsSync(rres = (res + ".ts")))
                    return null;
        return rres;

    }
    let rres: string | null = null;
    const trypaths: string[] = [builddir, __dirname, srcdir];
    for(let it of trypaths)
    {
        rres = TryFindMatching(it, p);
        if(rres != null)
            break;
    }
    if(rres != null)
    {
        response.sendFile(rres);
        console.log("=: ", rres);
    }
    else
    {
        console.log("=: 404");
        response.status(404).send(null);
    }
})

app.listen(8080);

// import { PIO, ProgramConfig } from "../src/PIO/PIO";
// import { PIOAPI, PIOProgram } from "../src/PIO/API";
// import { Assert, sleep } from "../src/PIO/utils";
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// import { isPostfixUnaryExpression } from "typescript";

// const __filename = fileURLToPath(import.meta.url);
// let __dirname = dirname(__filename);

//__dirname = path.join(__dirname,  "/../..");



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

// let pio = new PIO();

// let buf = fs.readFileSync("examples/pwm", "utf-8");

// let dt: Uint16Array = new Uint16Array(buf.length/4);

// let ii = 0;
// for(let i = 0; i+3 < buf.length; i+=5)
// {
//     let s = buf.substring(i, i+4);
//     dt[ii] = Number.parseInt(s, 16);
//     ii++;
// }
// dt = dt.slice(0, ii);

// let instructions = pio.DecodeProgram(dt);
// let config = new ProgramConfig(instructions);
// config.sideset_n = 1;
// config.sideset_opt_en = true;
// config.sideset_base = 1;
// pio.SetPinDir(1, true);

// let progp = pio.GetFreeBlockAndMachine(config.length);

// function dbshow()
// {
//     console.log(pio.log.GetWaveformForPin(1).GetSamples());
// }

// let api = new PIOAPI(pio);

// let prog = new PIOProgram(pio, config);
// api.AddProgram("prog0", prog, true, true);
// prog.PushInput(16);
// prog.PushInput(4);
// const d = 133;
// prog.clock_divider = d;
// api.AdvanceCycles(d);
// while(true)
// {
//     api.Advancems(1);
//     dbshow();
//     sleep(1000);
// }