"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
// const __filename = fileURLToPath(import.meta.url);
// let __dirname = dirname(__filename);
__dirname = path.join(__dirname, "/../..");
console.log("123");
let builddir = path.join(__dirname, "/build/public");
let pubdir = path.join(__dirname, "public");
let exdir = path.join(__dirname, "/examples");
let nodedir = path.join(__dirname, "/node_modules");
let rootdir = __dirname;
let app = (0, express_1.default)();
app.use(express_1.default.static(rootdir));
app.use(express_1.default.static(nodedir));
app.use(express_1.default.static(pubdir));
app.use(express_1.default.static(builddir));
app.use("/examples", express_1.default.static(exdir));
app.use("/", express_1.default.static(pubdir + "/HTML"));
app.listen(8080);
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
// let conf = new ProgramConfig(instructions);
// conf.sideset_n = 1;
// conf.sideset_opt_en = true;
// conf.sideset_base = 1;
// pio.SetPinDir(1, true);
// let progp = pio.GetFreeBlockAndMachine(conf.length);
// function dbshow()
// {
//     console.log(pio.log.GetWaveformForPin(1).GetSamples());
// }
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
//# sourceMappingURL=index.js.map