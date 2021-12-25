import { AssertionError } from "assert";
import { Instruction } from "../instructions/instruction";
import { ProgramConfig } from "../PIO";
import { Token } from "./tokenizer";

export enum EventType
{
    ERROR,
    WARNING,
}
export enum EventCode
{
    ERRORS_START = 0,
    ERROR_NOT_INSIDE_PROGRAM,
    ERROR_INVALID_SYNTAX,
    ERROR_INVALID_EXPRESSION,
    ERROR_UNKNOWN_OPCODE,
    ERROR_UNKNOWN_DIRECTIVE,
    ERROR_INVALID_PARAM,
    ERROR_NOT_ENOUGH_PARAMS,
    ERROR_TOO_MANY_PARAMS,
    ERROR_INVALID_SIDESET,
    ERROR_INVALID_DELAY,
    ERROR_DUPLICATE_LABEL,
    ERROR_UNDEFINED_PARAM,
    ERRORS_END,

    WARNINGS_START,
    WARNING_PROGRAM_NAME_NOT_SPECIFIED,
    WARNING_PINS_OUT_OF_RANGE,
    WARNING_DUPLICATE_PROGRAM_NAME,
    WARNING_INVALID_CUSTOM_INSTRUCTION,
    WARNING_OUT_OF_MEMORY,
    WARNINGS_END,
}
export class Event
{
    type: EventType;
    code: EventCode;
    note: string;
    critical: boolean;
    line?: number;
    column?: number;
    length?: number;

    constructor(type: EventType, code: EventCode, info: string, critical: boolean, line?: number, column?: number, length?: number)
    {
        this.type = type;
        this.code = code;
        this.note = info;
        this.critical = critical;
        this.line = line;
        this.column = column;
        this.length = length;
    }
}
export class AssemblerException extends Error
{
    code: EventCode;
    line?: number;
    column?: number;
    length?: number;
    constructor(code: EventCode, message: string, line?: number, column?: number, length?: number)
    {
        super(message);
        this.name = "AssemblerException";
        this.code = code;
        this.line = line;
        this.column = column;
        this.length = length;
    }
}
export class AssemblerOutput
{
    LastEvent: Event | null = null;
    Events: Event[] = [];
    Warnings: Event[] = [];
    Errors: Event[] = [];

    Success: boolean = false;

    Program: string = "";
    Tokens: Token[] = [];
    Raw: Int16Array = new Int16Array();
    Config?: ProgramConfig;
    Instructions: Instruction[] = [];

    Name: string = "";

    CalculateEventType(code: EventCode): EventType
    {
        const ic = Number(code);
        if(ic > Number(EventCode.ERRORS_START) && ic < Number(EventCode.ERRORS_END))
            return EventType.ERROR;
        if(ic > Number(EventCode.WARNINGS_START) && ic < Number(EventCode.WARNINGS_END))
            return EventType.WARNING;
        throw ("INVALID ASSEMBLER EVENT CODE");
    }
    LogEvent(code: EventCode, note: string, line?: number, column?: number, length?: number, critical: boolean = false)
    {
        const tp = this.CalculateEventType(code);
        const ev = new Event(tp, code, note, critical, line, column, length);
        if(tp == EventType.ERROR)
            this.Errors.push(ev);
        else if(tp == EventType.WARNING)
            this.Warnings.push(ev);
        this.Events.push(ev);
        this.LastEvent = ev;
    }
    LogCritical(code: EventCode, note: string, line?: number, column?: number, length?: number)
    {
        this.LogEvent(code, note, line, column, length, true);
    }
    LogException(ex: AssemblerException)
    {
        this.LogCritical(ex.code, ex.message, ex.line, ex.column, ex.length);
    }
}