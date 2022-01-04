import { tokenToString } from "typescript";
import { Assert } from "../utils";
import { Assemble } from "./assembler";
import { AssemblerException, AssemblerOutput, EventCode } from "./assembler_output";

export enum TokenType
{
    ERR,
    LABEL,
    DIRECTIVE,
    OPCODE,
    WORDPARAM,
    NUMPARAM,
    DELAY,
    SIDESET,
    ENDLINE,
}

export class Token
{
    type: TokenType;
    content: string;
    line: number;
    column: number;
    GenerateException(code: EventCode, message: string): AssemblerException
    {
        return new AssemblerException(code, message, this.line, this.column, this.content.length);
    }
    constructor(type: TokenType, content: string, line: number, column: number)
    {
        this.type = type;
        this.content = content;
        this.line = line;
        this.column = column;
    }
}

export function Tokenize(co: AssemblerOutput, program: string): { success: boolean, tokens: Token[]; }
{
    let ret: { success: boolean, tokens: Token[]; } =
    {
        success: false,
        tokens: []
    };


    const trim_whitespace = (str: string) => 
    {
        return str.replace(/$[ \t]*/g, "").replace(/[ \t]*^/g, "");
    };


    program = program.toLowerCase();

    // Replace comments with spaces
    program = program.replace(/;.*\n/g, "\n");
    program = program.replace(/\/\/.*\n/g, "\n");
    program = program.replace(/\/\*.*\*\//g, "\n");


    program = program.replaceAll(",", " ");

    let rawlines: string[] = program.split("\n");
    let lines: string[] = [];

    // Allow for multi-line instructions with '\'
    {
        let continuation = false;
        rawlines.forEach(l => 
        {
            if(continuation)
            {
                continuation = false;
                lines[lines.length - 1] = lines[lines.length - 1] + l.replaceAll("\\", "");
            }
            else
                lines.push(l.replaceAll("\\", ""));
            if(l.endsWith("\\"))
                continuation = true;
        });
    }

    for(let lineoffset = 0; lineoffset < lines.length; lineoffset++)
    {
        let line = lines[lineoffset];
        const rawline = line + "";
        line = trim_whitespace(line);
        if(line.length == 0)
            continue;
        const coffset = rawline.indexOf(line[0]);
        let ttype = TokenType.ERR;
        let tokencontent = "";
        let beginning = true;
        let bracedepth = 0;
        let i = 0;
        const skip_whitespace = () => { while(i < line.length && line[i].match("[ \n\t\r]")?.length) i++; };
        const push_token = (tokentype: TokenType, tokencontent: string) => 
        {
            if(tokentype == TokenType.ERR)
                throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "UNSPECIFIED SYNTAX ERROR!", lineoffset, coffset + i);
            ret.tokens.push(new Token(tokentype, tokencontent, lineoffset, coffset + i - tokencontent.length));
        };
        const push_current_token = () =>
        {
            if(ttype == TokenType.WORDPARAM && tokencontent == "side")
                ttype = TokenType.SIDESET;
            push_token(ttype, tokencontent);
            ttype = TokenType.ERR;
            tokencontent = "";
        };
        while(i < line.length)
        {
            skip_whitespace();
            for(; i < line.length; i++)
            {
                const chr = line[i];
                if(chr == '.')
                {
                    if(ttype != TokenType.ERR || !beginning)
                    {
                        throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "UNEXPECTED '.'", lineoffset, coffset + i);
                    }
                    ttype = TokenType.DIRECTIVE;
                    beginning = false;
                }
                else if(chr == " ")
                {
                    if(ttype != TokenType.ERR && bracedepth == 0)
                    {
                        push_current_token();
                    }
                }
                else
                {
                    if(chr == "[")
                    {
                        if(co.Tokens.length > 0 && co.Tokens[co.Tokens.length - 1].type == TokenType.DELAY)
                        {
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "DUPLICATE '['",
                                lineoffset, coffset + i, 1);
                        }
                        if(ttype != TokenType.ERR)
                        {
                            push_current_token();
                        }
                        ttype = TokenType.DELAY;
                    }
                    else if(chr == "]")
                    {
                        if(ttype != TokenType.DELAY)
                        {
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Unexpected '['", lineoffset, coffset + i, 1);
                        }
                        push_current_token();
                    }
                    else if(chr == ":" && (ttype == TokenType.OPCODE || beginning))
                    {
                        if(beginning)
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "Unexpected ':'", lineoffset, coffset + i, 1);
                        ttype = TokenType.LABEL;
                        push_current_token();
                    }
                    else if(chr.match(/[\(0-9]/))
                    {
                        if(beginning)
                        {
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "UNEXPECTED '" + chr + "', expected an opcode or directive",
                                lineoffset, coffset + i);
                        }
                        if(ttype != TokenType.ERR && (ttype != TokenType.NUMPARAM || (chr == "[" && bracedepth == 0)))
                        {
                            push_current_token();
                            tokencontent = "";
                        }
                        if(chr == "(")
                        {
                            if(ttype)
                                bracedepth++;
                        }
                        ttype = TokenType.NUMPARAM;
                    }
                    else if(chr == ")")
                    {
                        bracedepth--;
                        if(bracedepth < 0 || ttype != TokenType.NUMPARAM || tokencontent == "")
                        {
                            throw new AssemblerException(EventCode.ERROR_INVALID_SYNTAX, "UNEXPECTED ']', did you forget a '['?",
                                lineoffset, coffset + i);
                        }
                        if(bracedepth == 0)
                        {
                            push_current_token();
                            tokencontent = "";
                        }
                    }
                    else if(ttype == TokenType.ERR)
                    {
                        if(beginning)
                        {
                            ttype = TokenType.OPCODE;
                            beginning = false;
                        }
                        else
                        {
                            ttype = TokenType.WORDPARAM;
                        }
                    }
                    tokencontent += chr;
                }
            }
        }
        if(ttype != TokenType.ERR)
            push_current_token();
        push_token(TokenType.ENDLINE, "");
    }

    ret.success = true;
    return ret;
}

