import { AssertionError } from "assert";
import { ProgramConfig } from "../PIO";
import { Assert, AssertBits } from "../utils";
import { AssemblerException, AssemblerOutput, EventCode } from "./assembler_output";
import { Token, Tokenize, TokenType } from "./tokenizer";


function AssembleFromTokens(co: AssemblerOutput): boolean
{
    co.Config = new ProgramConfig([]);
    const defines = new Map<string, Token>();
    let maintok: Token | null = null;
    let argtoks: Token[] = [];
    function evaluate_expression(str: string, line: number, column: number): number | null
    {
        let parts: RegExpMatchArray = str.match(/((0x|0b|0o)?[0-9])|(([\+\-\*\/])|(\:\:))|(\(.*\))/)!;
        if(parts == null || parts.length == 0)
        {
            co.LogCritical(EventCode.ERROR_INVALID_EXPRESSION, "EMPTY EXPRESSION", line, column);
            return null;
        }
        let exp = parts.join();
        try
        {
            return eval(exp);
        }
        catch(ex)
        {
            co.LogCritical(EventCode.ERROR_INVALID_EXPRESSION, "Could not parse expression " + str, line, column, str.length);
            return null;
        }
    }
    function compute_number(tok: Token): number | null
    {
        let data = tok.content;
        data = data.replace(/\[\]/, "");
        try
        {
            data.replace(/[a-z]+[0-9]*/, (it) => 
            {
                if(!defines.has(it))
                {
                    co.LogCritical(EventCode.ERROR_UNDEFINED_PARAM, it + " IS UNDEFINED");
                    throw null;
                }
                const ntok = defines.get(it);
                if(ntok?.type != TokenType.NUMPARAM)
                {
                    co.LogCritical(EventCode.ERROR_INVALID_EXPRESSION, "INVALID EXPRESSION: " + it);
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
    function check_args(name: string, argtoks: Token[], minargs: number, firstopt?: boolean, ...types: TokenType[])
    {
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
        let start = 0;
        if(firstopt && argtoks.length == minargs)
            start = 1;
        for(let i = 0; i < argtoks.length; i++)
        {
            if(argtoks[i].type != types[start + i])
            {
                throw new AssemblerException(EventCode.ERROR_INVALID_PARAM,
                    name + " expected a" + (types[start + i] == TokenType.NUMPARAM) ? " numeric expression " : " literal expression as parameter " + i,
                    argtoks[i].line, argtoks[i].column, argtoks[i].content.length);
            }
        }
    }
    function process_instruction(name: string, argtoks: Token[]): number
    {
        let encoded = 0;
        function encode_bits(dt: number, first: number, last: number): number
        {
            Assert(last > first);
            AssertBits(dt, last - first);
            return dt << first;
        }
        let sideset_set = false;
        let delay_set = false;
        let args: Token[] = [];
        for(let it of argtoks)
        {
            Assert(it.type != TokenType.OPCODE && it.type == TokenType.DIRECTIVE);
            if(it.type == TokenType.SIDESET)
            {
                if(sideset_set)
                    throw new AssemblerException(EventCode.ERROR_INVALID_SIDESET, "Duplicate sideset", it.line, it.column, it.content.length);

                sideset_set = true;
            }
            else if(it.type == TokenType.DELAY)
            {
                if(delay_set)
                    throw new AssemblerException(EventCode.ERROR_INVALID_DELAY, "Duplicate delay", it.line, it.column, it.content.length);
                delay_set = true;
            }
            else
                args.push(it);
        }

        switch(name)
        {
            case "jmp":
                {
                    check_args(name, args, 1, true, TokenType.WORDPARAM, TokenType.NUMPARAM);
                    encoded |= encode_bits(0b000, 13, 15);
                    if()
                        encoded |= encode_bits(argtoks);
                    break;
                }
        }
        return encoded;
    }
    function process_directive(name: string, argtoks: Token[])
    {

    }
    function process_tokens(maintok: Token, argtoks: Token[])
    {
        Assert(maintok.type == TokenType.OPCODE || maintok.type == TokenType.DIRECTIVE);
        let ident = compute_word(maintok);
        if(ident == null)
            ident = "";
        if(maintok.type == TokenType.OPCODE)
            process_instruction(ident, argtoks);
        else
            process_directive(ident, argtoks);
    }
    for(let tok of co.Tokens)
    {
        if(maintok == null)
        {
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
    return true;
}

export function Assemble(program: string): AssemblerOutput
{
    const co = new AssemblerOutput();
    co.Success = false;
    try
    {
        const tokout = Tokenize(co, program);
        co.Tokens = tokout.tokens;
        if(!tokout.success)
        {
            return co;
        }
    }
    catch(ex)
    {
        if(ex instanceof AssemblerException)
        {
            co.LogException(ex);
            return co;
        }
        else
            throw ex;
    }
    try
    {
        if(!AssembleFromTokens(co))
            return co;
    }
    catch(ex)
    {
        if(ex instanceof AssemblerException)
        {
            co.LogException(ex);
            return co;
        }
        else
            throw ex;
    }
    co.Success = co.Errors.length == 0;
    return co;
}