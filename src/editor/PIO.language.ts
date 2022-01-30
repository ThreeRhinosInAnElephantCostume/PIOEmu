import { parser } from "./PIO.grammar.js";
import { foldNodeProp, foldInside, indentNodeProp } from "@codemirror/language";
import { styleTags, tags as t } from "@codemirror/highlight";
import { LanguageSupport } from "@codemirror/language";
import { LRLanguage } from "@codemirror/language";
import { completeFromList } from "@codemirror/autocomplete";

let parserWithMetadata = parser.configure(
    {
        props:
            [
                styleTags(
                    {
                        "Comment": t.comment,
                        "Directive/Opcode": t.macroName,
                        "Instruction/Opcode": t.keyword,
                        "Label/WordParam": t.labelName,
                        "Sideset": t.definitionKeyword,
                        "Value": t.number,
                        "Operator": t.operator,
                        "WordParam": t.attributeValue,
                    }),
                indentNodeProp.add(
                    {
                        Application: context => context.column(context.node.from) + context.unit
                    }),
                foldNodeProp.add(
                    {
                        Application: foldInside
                    })
            ]
    });

export const PIOLanguage = LRLanguage.define(
    {
        parser: parserWithMetadata,
        languageData: {
            commentTokens: { line: ";" }
        }
    });

export const PIOCompletion = PIOLanguage.data.of(
    {
        autocomplete: completeFromList([
            { label: "jmp", type: "keyword" },
            { label: "mov", type: "keyword" },
        ])
    });

export function PIOASM()
{
    return new LanguageSupport(PIOLanguage, [PIOCompletion]);
}