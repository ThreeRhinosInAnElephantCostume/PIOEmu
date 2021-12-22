import { tokenToString } from "typescript";
import { Assert } from "../utils";
import { AssemblerOutput } from "./AssemblerOutput";

export enum TokenOperators
{
    OR,
    ANY,
    OPTIONAL,
    ATLEAST,
    ENDLINE,
    STARTLINE,
}
export class IndirTokenRefernece
{
    name: string;
    GetToken(): Token
    {
        var tok = eval(this.name);
        Assert(tok instanceof Token);
        return tok;
    }
    constructor(name: string)
    {
        this.name = name;
    }
}
export class Expression
{
    match!: (RegExp | TokenOperators | Token | Expression | IndirTokenRefernece)[];
}

export class Token
{
    name: string;
    content: ((string | Token)[] | string);
    expression: Expression;
    IsKindOf(other: Token): boolean
    {
        return other.name == this.name;
    }
    Match(data: string, index: number, expression: Expression = this.expression)
    {
        let ret = { found: false, token: new Token(this.name, this.expression), index: index };
        let search_token = (token: Token) =>
        {

        };
        let search_regex = (reg: RegExp) => 
        {

        };
        let search_expression = (ex: Expression) => 
        {

        };

        return ret;
    }
    constructor(name: string, expression: Expression, content: ((string | Token)[] | string) = [])
    {
        this.expression = expression;
        this.name = name;
        this.content = content;
    }
}
export var WordParamToken = new Token("WordParamToken", { match: [/([A-Z]|[a-z]|=|!)+(--)?/] });
export var NumberToken = new Token("NumberToken", { match: [/(::)?-?(0x|0b|0o)?[0-9]+/] });
export var OperatorToken = new Token("OperatorToken", { match: [/\+-\*\//] });
export var NumberParamToken = new Token("NumberParamToken",
    {
        match: [/\[/, NumberToken,
            {
                match: [OperatorToken, NumberToken, TokenOperators.OR, new IndirTokenRefernece("NumberParamToken")]
            }, TokenOperators.ANY, /\]/]
    });
export var ParamToken = new Token("ParamToken", { match: [WordParamToken, TokenOperators.OR, NumberParamToken] });
export var DirectiveToken = new Token("DirectiveToken",
    { match: [TokenOperators.STARTLINE, /\./, ParamToken, TokenOperators.ANY, TokenOperators.ENDLINE] });
export var InstructionToken = new Token("InstructionToken",
    { match: [TokenOperators.STARTLINE, ParamToken, TokenOperators.ANY, TokenOperators.ENDLINE] });

export var TokenOrder: Token[] = [InstructionToken, DirectiveToken, ParamToken, NumberParamToken, NumberToken, WordParamToken, OperatorToken];

var SolvedIndirections = false;

function ResolveIndirections(exp: Expression)
{
    for(let i = 0; i < exp.match.length; i++)
    {
        if(exp.match[i] instanceof IndirTokenRefernece)
        {
            exp.match[i] = (exp.match[i] as IndirTokenRefernece).GetToken();
        }
        else if(exp.match[i] instanceof Expression)
        {
            ResolveIndirections(exp.match[i] as Expression);
        }
    }
}

export function Tokenize(co: AssemblerOutput, program: string): Token[]
{
    if(!SolvedIndirections)
    {
        for(let tok of TokenOrder)
        {
            ResolveIndirections(tok.expression);
        }
    }
    let tokens: Token[] = [];

    return tokens;
}

