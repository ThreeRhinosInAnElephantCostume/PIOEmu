import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup/"
//import { javascript } from "@codemirror/lang-javascript";

import { pio } from "./globals.js";
import { ProgramConfig } from "./PIO/PIO.js";
import { sleep } from "./utils.js";
 


const jscode = "";

let timer;

var progp: {found: boolean; block_index: number; machine_index: number, offset: number}; 

const evaluateCode = async (code:string) =>
{
    console.clear();
    let buf = code;
    let dt: Uint16Array = new Uint16Array(buf.length/4);

    let ii = 0;
    for(let i = 0; i+3 < buf.length; i+=5)
    {
        let s = buf.substring(i, i+4);
        dt[ii] = Number.parseInt(s, 16);
        ii++;
    }
    dt = dt.slice(0, ii);
    try
    {
        let instructions = pio.DecodeProgram(dt);
        if(progp == undefined || progp == null || progp.found == undefined || progp.found == false)
        {
            progp = pio.GetFreeBlockAndMachine(instructions.length);
        }
        let conf = new ProgramConfig(instructions);
        conf.sideset_n = 1;
        conf.sideset_opt_en = true;
        conf.sideset_base = 1;
        pio.SetPinDir(1, true);
        pio.AddProgram(progp.block_index, progp.machine_index, progp.offset, conf);
        pio.StartProgram(progp.block_index, progp.machine_index);
        pio.PushData(progp.block_index, progp.machine_index, 16);
        pio.PushData(progp.block_index, progp.machine_index, 4);
        pio.Clock(1);
        while(true)
        {
            pio.Clock(10);
            console.log(pio.log.GetWaveformForPin(1).GetSamples());
            sleep(1);
        }
    } catch (err)
    {
        console.error(err);
    }
};

let editor = new EditorView({
    state: EditorState.create({
        extensions: [
            basicSetup,
            //javascript(),
            
            EditorView.updateListener.of((v: any) =>
            {
                if (v.docChanged)
                {
                    var el = document.getElementById("Compile");
                    el?.addEventListener("click", function ()
                    {
                        evaluateCode(editor.state.doc.toString());
                    });
                }
            }),
        ],
        doc: jscode,
    }),
    parent: document.body,
});
