import { AssertionError } from "assert";
import { isLabeledStatement } from "typescript";
import { PIO, ProgramConfig } from "../PIO";
import { Assert, AssertBits } from "../utils";
import { AssemblerException, AssemblerOutput, EventCode } from "./assembler_output";
import { Token, Tokenize, TokenType } from "./tokenizer";


function AssembleFromTokens(co: AssemblerOutput): boolean
{
    enum ParamType
    {
        NUMBER,
        NUMBER_OPT,
        WORD,
        WORD_OPT,
        ANY,
        ANY_OPT,
    }
    co.Config = new ProgramConfig([]);
    const defines = new Map<string, Token>();
    const labels = new Map<string, number>();
    let curaddr = 0;
    let maintok: Token | null = null;
    let argtoks: Token[] = [];
    let raw_instructions: number[] = [];
    function evaluate_expression(str: string, line: number, column: number): number | null
    {
        try
        {
            return eval(str);
        }
        catch(ex)
        {
            return null;
        }
    }
    function compute_number(tok: Token, throwonerror: boolean = false): number | null
    {
        let data = tok.content;
        data = data.replace(/\[\]/g, "");
        try
        {
            data = data.replace(/[a-z]+[0-9]*/g, (it) => 
            {
                if(!defines.has(it))
                {
                    if(throwonerror)
                        throw new AssemblerException(EventCode.ERROR_UNDEFINED_PARAM, it + " IS UNDEFINED", tok);
                    throw null;
                }
                const ntok = defines.get(it);
                if(ntok?.type != TokenType.NUMPARAM)
                {
                    if(throwonerror)
                        throw new AssemblerException(EventCode.ERROR_INVALID_EXPRESSION, "INVALID EXPRESSION: " + it, tok);
                    throw null;
                }
                return ntok.content;
            });
        }
        catch(ex)
        {
            if(ex != null)
                throw ex;
            return null;
        }
        return evaluate_expression(data, tok.line, tok.column);
    }
    function compute_word(tok: Token): string | null
    {
        if(defines.has(tok.content))
        {
            const ntok = defines.get(tok.content);
            if(ntok == null || ntok.type != TokenType.WORDPARAM)
                return null;
            return ntok?.content;
        }
        return tok.content;
    }
    function check_bits(n: number, bits: number): boolean
    {
        try
        {
            AssertBits(n, bits);
        }
        catch(ex)
        {
            if(ex instanceof Error)
                return false;
            throw ex;
        }
        return true;
    }
    function check_args(name: string, argtoks: Token[], ...types: ParamType[])
    {
        function is_opt(tp: ParamType)
        {
            return tp == ParamType.ANY_OPT || tp == ParamType.NUMBER_OPT || tp == ParamType.WORD_OPT;
        }
        function is_tp(pt: ParamType, tt: TokenType)
        {
            if(pt == ParamType.ANY || pt == ParamType.ANY_OPT)
                return true;
            if((pt == ParamType.NUMBER || pt == ParamType.NUMBER_OPT) && tt == TokenType.NUMPARAM)
                return true;
            if((pt == ParamType.WORD || pt == ParamType.WORD_OPT) && tt == TokenType.WORDPARAM)
                return true;
            return false;
        }
        let minargs = 0;
        types.forEach(it => minargs += +!is_opt(it));
        if(argtoks.length < minargs)
        {
            throw new AssemblerException(EventCode.ERROR_NOT_ENOUGH_PARAMS, name + " expects at least " + minargs + " parameters",
                argtoks[0]?.line, argtoks[0]?.column);
        }
        if(argtoks.length > types.length)
        {
            throw new AssemblerException(EventCode.ERROR_TOO_MANY_PARAMS, name + " expects at most " + types.length + " parameters",
                argtoks[0]?.line, argtoks[0]?.column);
        }
        while(types.length > argtoks.length)
        {
            for(let i = types.length - 1; i >= 0; i--)
            {
                if(is_opt(types[i]))
                {
                    types.splice(i, 1);
                    break;
                }
            }
        }
        Assert(types.length == argtoks.length);
        for(let i = 0; i < argtoks.length; i++)
        {
            if(!is_tp(types[i], argtoks[i].type))
            {
                if(argtoks[i].type == TokenType.WORDPARAM && (types[i] == ParamType.NUMBER || types[i] == ParamType.NUMBER_OPT))
                {
                    let n = compute_number(argtoks[i], false);
                    if(n != null)
                    {
                        argtoks[i].type = TokenType.NUMPARAM;
                        continue;
                    }
                }
                throw new AssemblerException(EventCode.ERROR_INVALID_PARAM,
                    name + " expected a" + (types[i] == ParamType.NUMBER || types[i] == ParamType.NUMBER_OPT) ? " numeric expression " : " literal expression as parameter " + i,
                    argtoks[i].line, argtoks[i].column, argtoks[i].content.length);
            }
        }
    }
    function process_instruction(mtok: Token, argtoks: Token[]): number
    {
        let name = compute_word(mtok);
        Assert(name != null);
        let encoded = 0;
        function encode_bits(dt: number, first: number, last: number): number
        {
            Assert(last >= first);
            AssertBits(dt, (last - first) + 1);
            return dt << first;
        }
        let sideset_set = false;
        let delay_set = false;
        let delayn = 0;
        let sidesetn = 0;
        let args: Token[] = [];
        for(let i = 0; i < argtoks.length; i++)
        {
            const it = argtoks[i];
            Assert(it.type != TokenType.OPCODE, "Repeated opcode tokentype");
            Assert(it.type != TokenType.DIRECTIVE, "Unexpected directive inside an instruction");
            if(it.type === TokenType.SIDESET)
            {
                if(sideset_set)
                    throw new AssemblerException(EventCode.ERROR_INVALID_SIDESET, "Duplicate sideset", it.line, it.column, it.content.length);
                if(argtoks[i + 1] == undefined)
                    throw new AssemblerException(EventCode.ERROR_INVALID_SIDESET, "Missing value for the sideset", it.line, it.column, it.content.length);
                sidesetn = compute_number(argtoks[i + 1]!, false)!;
                if(sidesetn === null)
                {
                    throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Could not parse sideset", it.line, it.column, it.content.length);
                }
                if(!co.Config?.sideset_n)
                {
                    throw new AssemblerException(EventCode.ERROR_INVALID_SIDESET, "Attempting to use sideset, even though it's not defined", it.line, it.column, it.content.length);
                }
                try
                {
                    AssertBits(sidesetn, co.Config?.sideset_n!);
                }
                catch(ex)
                {
                    throw new AssemblerException(EventCode.ERROR_INVALID_SIDESET, "The specified sideset value cannot fit in ");
                }
                encoded |= encode_bits(sidesetn, 12 - co.Config?.sideset_n!, 12 - (co.Config?.sideset_opt_en ? 1 : 0));
                sideset_set = true;
                i++;
            }
            else if(it.type === TokenType.DELAY)
            {
                if(delay_set)
                    throw new AssemblerException(EventCode.ERROR_INVALID_DELAY, "Duplicate delay", it.line, it.column, it.content.length);
                delayn = compute_number(it)!;
                if(delayn === null)
                {
                    throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Could not parse delay", it.line, it.column, it.content.length);
                }
                const avalbits = 5 - co.Config?.sideset_n! - (co.Config?.sideset_opt_en ? 1 : 0);
                try
                {
                    AssertBits(delayn, avalbits);
                }
                catch(ex)
                {
                    throw new AssemblerException(EventCode.ERROR_INVALID_DELAY, "The specified delay (" + delayn + ") requires more than the available " +
                        avalbits + " bits to encode");
                }
                encoded |= encode_bits(delayn, 8, 12 - (co.Config?.sideset_opt_en ? 1 : 0) - co.Config?.sideset_n!);
                delay_set = true;
            }
            else
                args.push(it);
        }
        if(co.Config?.sideset_opt_en)
        {
            encoded |= encode_bits(sideset_set ? 1 : 0, 12, 12);
        }
        else if(!sideset_set)
        {
            throw new AssemblerException(EventCode.ERROR_INVALID_SIDESET, "Sideset not set!", mtok.line);
        }
        switch(name)
        {
            case "nop":
                {
                    check_args(name, args);
                    encoded |= encode_bits(0b1010000001000010, 0, 15); // mov y, y
                    break;
                }
            case "jmp":
                {
                    check_args(name, args, ParamType.WORD_OPT, ParamType.ANY);
                    encoded |= encode_bits(0b000, 13, 15);
                    let condition = 0;
                    if(args.length == 2)
                    {
                        const word = compute_word(args[0]);
                        if(word == null)
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Could not parse wordparam '" + args[0].content + "'", args[0]);
                        condition =
                            {
                                "!x": 0b001,
                                "x--": 0b010,
                                "!y": 0b011,
                                "y--": 0b100,
                                "x!=y": 0b101,
                                "pin": 0b110,
                                "!osre": 0b111,
                            }[word]!;
                        if(condition == null)
                            throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Unknown condtion '" + word + "'");
                    }
                    encoded |= encode_bits(condition, 5, 7);
                    const aarg = args[args.length - 1];
                    let addr = compute_number(aarg!);
                    if(addr == null)
                    {
                        if(aarg.type == TokenType.WORDPARAM && labels.has(aarg.content))
                            addr = labels.get(aarg.content)!;
                        else
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Could not parse address '" + aarg.content + "'", aarg);
                    }
                    encoded |= encode_bits(addr, 0, 4);
                    break;
                }
            case "pull":
                {
                    check_args(name, args, ParamType.WORD_OPT, ParamType.WORD_OPT);
                    encoded |= encode_bits(0b100, 13, 15);
                    encoded |= encode_bits(0b1, 7, 7);
                    let blocking_set = false;
                    let ifempty_set = false;
                    for(let it of args)
                    {
                        const word = compute_word(it);
                        if(word == "block" || word == "noblock")
                        {
                            if(blocking_set)
                                throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Duplicate block/noblock option", it);
                            blocking_set = true;
                            if(word == "block")
                                encoded |= encode_bits(0b1, 5, 5);
                        }
                        else if(word == "ifempty")
                        {
                            if(ifempty_set)
                                throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Duplicate ifempty", it);
                            ifempty_set = true;
                            encoded |= encode_bits(0b1, 6, 6);
                        }
                        else
                            throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Unknown option '" + word + "'");
                    }
                    break;
                }
            case "mov":
                {
                    check_args(name, args, ParamType.WORD, ParamType.WORD_OPT, ParamType.WORD);
                    encoded |= encode_bits(0b101, 13, 15);
                    {
                        const a = args[0];
                        const word = compute_word(a);
                        if(word == null)
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Syntax error: " + a.content, a);
                        const destination =
                            {
                                "pins": 0b000,
                                "x": 0b001,
                                "y": 0b010,
                                "exec": 0b100,
                                "pc": 0b101,
                                "isr": 0b110,
                                "osr": 0b111,
                            }[word];
                        if(destination == null)
                            throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Invalid destination '" + word + "'", a);
                        encoded |= encode_bits(destination, 5, 7);
                    }
                    if(args.length == 3)
                    {
                        const a = args[1];
                        const word = compute_word(a);
                        if(word == null)
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Syntax error: " + a.content, a);
                        const operation =
                            {
                                "invert": 0b001,
                                "!": 0b001,
                                "-": 0b001,
                                "bit-reverse": 0b010,
                                "bitreverse": 0b010,
                                "::": 0b010,
                            }[word];
                        if(operation == null)
                            throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Invalid operation '" + word + "'", a);
                        encoded |= encode_bits(operation, 3, 4);
                    }
                    {
                        const a = args[args.length - 1];
                        const word = compute_word(a);
                        if(word == null)
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Syntax error: " + a.content, a);
                        const source =
                            {
                                "pins": 0b000,
                                "x": 0b001,
                                "y": 0b010,
                                "null": 0b011,
                                "status": 0b101,
                                "isr": 0b110,
                                "osr": 0b111,
                            }[word];
                        if(source == null)
                            throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Invalid source '" + word + "'", a);
                        encoded |= encode_bits(source, 0, 2);
                    }
                    break;
                }
            default:
                {
                    throw new AssemblerException(EventCode.ERROR_UNKNOWN_OPCODE, "Unknown opcode: '" + name + "'", mtok);
                }
        }
        return encoded;
    }
    function process_directive(mtok: Token, argtoks: Token[])
    {
        const name = compute_word(mtok);
        Assert(name != null);
        switch(name)
        {
            case "program":
                {
                    check_args(name, argtoks, ParamType.WORD);
                    if(co.Name != "")
                        throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Only one program directive per program");
                    const word = compute_word(argtoks[0])!;
                    Assert(word != null);
                    co.Name = word;
                    break;
                }
            case "side_set":
                {
                    if(co.Name == "")
                        throw new AssemblerException(EventCode.ERROR_NOT_INSIDE_PROGRAM, "Can only set the sideset inside a program", mtok);
                    if(co.Config!.sideset_n)
                        throw new AssemblerException(EventCode.ERROR_DUPLICATE_DIRECTIVE, "Can only set the sideset once", mtok);
                    if(curaddr > 0)
                        throw new AssemblerException(EventCode.ERROR_NOT_AT_BEGINNING, "Can only set the sideset before the first instruction", mtok);
                    check_args(name, argtoks, ParamType.NUMBER, ParamType.WORD_OPT);
                    let opt = false;
                    if(argtoks.length == 2)
                    {
                        const word = compute_word(argtoks[1]);
                        if(word != "opt")
                            throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Expected either `opt` or nothing, got `" +
                                word + "`", argtoks[1]);
                        opt = true;
                    }
                    const num = compute_number(argtoks[0]);
                    if(num == null)
                        throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Expected a number or numeric expression, got `" +
                            argtoks[0].content + "'", argtoks[0]);
                    if(num > 4 && opt)
                        throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Attempting to set sideset of more than 4 bits (opt enabled)", argtoks[0]);
                    else if(num > 5)
                        throw new AssemblerException(EventCode.ERROR_INVALID_PARAM, "Attempting to set sideset of more than 5 bits", argtoks[0]);
                    co.Config!.sideset_n = num;
                    co.Config!.sideset_opt_en = opt;
                    break;
                }
            default:
                {
                    throw new AssemblerException(EventCode.ERROR_UNKNOWN_DIRECTIVE, "Unknown directive: '" + name + "'", mtok);
                }
        }
    }
    function process_tokens(maintok: Token, argtoks: Token[])
    {
        Assert(maintok.type == TokenType.OPCODE || maintok.type == TokenType.DIRECTIVE);
        if(maintok.type == TokenType.OPCODE)
        {
            curaddr++;
            const inst = process_instruction(maintok, argtoks);
            raw_instructions.push(inst);
        }
        else if(maintok.type == TokenType.DIRECTIVE)
            process_directive(maintok, argtoks);
        else
            Assert(false);
    }
    for(let tok of co.Tokens)
    {
        if(tok.type == TokenType.LABEL)
        {
            Assert(maintok == null);
            const word = compute_word(tok);
            if(word == null)
                throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Invalid label name", tok);
            if(labels.has(word))
                throw new AssemblerException(EventCode.ERROR_DUPLICATE_LABEL, "Duplicate label: '" + word + "'");
            labels.set(word, curaddr);
        }
        else if(tok.type == TokenType.OPCODE)
        {
            curaddr++;
        }
    }
    curaddr = 0;
    for(let tok of co.Tokens)
    {
        if(tok.type == TokenType.LABEL)
        {
            continue;
        }
        else if(maintok == null)
        {
            if(tok.type == TokenType.ENDLINE)
                continue;
            Assert(tok.type == TokenType.DIRECTIVE || tok.type == TokenType.OPCODE);
            maintok = tok;
        }
        else if(tok.type == TokenType.ENDLINE)
        {
            process_tokens(maintok, argtoks);
            maintok = null;
            argtoks = [];
        }
        else
        {
            argtoks.push(tok);
        }
    }
    if(maintok != null)
        process_tokens(maintok, argtoks);
    co.Raw = new Uint16Array(raw_instructions);
    co.Instructions = PIO.DecodeProgram(co.Raw);
    co.Config.set_instructions(co.Instructions);
    return true;
}

export function Assemble(program: string): AssemblerOutput
{
    const co = new AssemblerOutput();
    co.Success = false;
    // try
    // {
    const tokout = Tokenize(co, program);
    co.Tokens = tokout.tokens;
    if(!tokout.success)
    {
        return co;
    }
    // }
    // catch(ex)
    // {
    //     if(ex instanceof AssemblerException)
    //     {
    //         co.LogException(ex);
    //         return co;
    //     }
    //     else
    //         throw ex;
    // }
    // try
    // {
    if(!AssembleFromTokens(co))
        return co;
    // }
    // catch(ex)
    // {
    //     if(ex instanceof AssemblerException)
    //     {
    //         co.LogException(ex);
    //         return co;
    //     }
    //     else
    //         throw ex;
    // }
    co.Success = co.Errors.length == 0;
    return co;
}