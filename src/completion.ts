import * as vscode from "vscode";
import { allInstructions, directives, registers } from "./constants";
import { getConstantDefinitions, getLabelDefinitions, positionValid } from "./helpers";

class MipsyCompletionItemProvider implements vscode.CompletionItemProvider {
    public static readonly triggerCharacters = [".", "$", "("];

    private sortOrders = {
        instruction: 1,
        directive: 4,
        register: 5,
        label: 2,
        constant: 3,
        snippet: 0,
    };

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        if (!positionValid(document, position)) {
            return [];
        }

        const line = document.lineAt(position.line);
        const lineText = line.text;
        const wordRange = document.getWordRangeAtPosition(position);
        let firstCharOfWord = wordRange ? wordRange.start.character : position.character;
        if (firstCharOfWord > 0) {
            const charBefore = lineText.charAt(firstCharOfWord - 1);
            if (charBefore === ".") {
                return this.getDirectiveCompletionItems(false);
            } else if (charBefore === "$") {
                return this.getRegisterCompletionItems(false);
            } else if (charBefore === "(") {
                return this.getRegisterCompletionItems(true);
            }
        }

        return this.getInstructionCompletionItems(document)
            .concat(this.getDirectiveCompletionItems(true))
            .concat(this.getRegisterCompletionItems(true))
            .concat(this.getLabelCompletionItems(document))
            .concat(this.getConstantCompletionItems(document))
            .concat(this.getSnippetCompletionItems(document));
    }

    private getInstructionCompletionItems(document: vscode.TextDocument): vscode.CompletionItem[] {
        const autoIndent = vscode.workspace.getConfiguration(
            "mipsy-support",
            document
        ).autoIndentAfterInstructionCompletion;

        return Object.keys(allInstructions).map((instruction) => {
            return {
                label: instruction,
                kind: vscode.CompletionItemKind.Function,
                detail: allInstructions[instruction],
                insertText:
                    instruction + (autoIndent && !["syscall", "begin", "end"].includes(instruction) ? "\t" : ""),
                sortText: this.sortOrders.instruction.toString(),
            };
        });
    }

    private getDirectiveCompletionItems(prependSymbol: boolean): vscode.CompletionItem[] {
        return Object.keys(directives).map((directive) => {
            return {
                label: "." + directive,
                kind: vscode.CompletionItemKind.Field,
                detail: directives[directive],
                insertText: prependSymbol ? "." + directive : directive,
                sortText: prependSymbol ? this.sortOrders.directive.toString() : "." + directive,
            };
        });
    }

    private getRegisterCompletionItems(prependSymbol: boolean): vscode.CompletionItem[] {
        return Object.keys(registers).map((register) => {
            return {
                label: "$" + register,
                kind: vscode.CompletionItemKind.Value,
                detail: registers[register],
                insertText: prependSymbol ? "$" + register : register,
                sortText: prependSymbol ? this.sortOrders.register.toString() : "$" + register,
            };
        });
    }

    private getLabelCompletionItems(document: vscode.TextDocument): vscode.CompletionItem[] {
        const items = [];
        const labels = getLabelDefinitions(document);
        for (const label of labels) {
            items.push({
                label: label.name,
                kind: vscode.CompletionItemKind.Variable,
                sortText: this.sortOrders.label.toString(),
            });
        }
        return items;
    }

    private getConstantCompletionItems(document: vscode.TextDocument): vscode.CompletionItem[] {
        const items = [];
        const constants = getConstantDefinitions(document);
        for (const constant of constants) {
            items.push({
                label: constant.name,
                kind: vscode.CompletionItemKind.Constant,
                sortText: this.sortOrders.constant.toString(),
            });
        }
        return items;
    }

    private getSnippetCompletionItems(document: vscode.TextDocument): vscode.CompletionItem[] {
        // Returns tab characters required to uniformly indent the start of comments.
        function requiredCommentIndent(line: string, tabSize: number, targetColumn: number) {
            let currentColumn = 0;
            for (let i = 0; i < line.length; i++) {
                if (line[i] === "\t") {
                    currentColumn += tabSize - (currentColumn % tabSize);
                } else {
                    currentColumn++;
                }
            }

            const requiredTabCount = Math.ceil((targetColumn - currentColumn) / tabSize);
            return "\t".repeat(requiredTabCount);
        }

        let tabSize = vscode.workspace.getConfiguration("editor", document).tabSize;
        let commentColumn = vscode.workspace.getConfiguration("mipsy-support", document).snippetCommentColumn ?? 32;

        // Ideally I would like to abstract this to something similar to objects in constants.ts, but things get
        // complicated with with that need to be evaluated at runtime.
        let text;
        let text2;
        return [
            {
                label: "print int",
                kind: vscode.CompletionItemKind.Snippet,
                detail: "Print an integer from a register",
                insertText: new vscode.SnippetString()
                    .appendText((text = "li\t$v0, 1"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# syscall 1: print_int\n")
                    .appendText("move\t$a0, $")
                    .appendChoice(Object.keys(registers))
                    .appendText("\n")
                    .appendText((text = "syscall"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# print $")
                    .appendVariable("1", "register"),
                sortText: this.sortOrders.snippet.toString(),
            },
            {
                label: "print string",
                kind: vscode.CompletionItemKind.Snippet,
                detail: "Print a string from an address",
                insertText: new vscode.SnippetString()
                    .appendText((text = "li\t$v0, 4"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# syscall 4: print_string\n")
                    .appendText("la\t$a0, ")
                    .appendChoice(getLabelDefinitions(document).map((label) => label.name))
                    .appendText("\n")
                    .appendText((text = "syscall"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# print ")
                    .appendVariable("1", "variable"),
                sortText: this.sortOrders.snippet.toString(),
            },
            {
                label: "print char",
                kind: vscode.CompletionItemKind.Snippet,
                detail: "Print a character from a register",
                insertText: new vscode.SnippetString()
                    .appendText((text = "li\t$v0, 11"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# syscall 11: print_character\n")
                    .appendText("move\t$a0, $")
                    .appendChoice(Object.keys(registers))
                    .appendText("\n")
                    .appendText((text = "syscall"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# print $")
                    .appendVariable("1", "register"),
                sortText: this.sortOrders.snippet.toString(),
            },
            {
                label: "read int",
                kind: vscode.CompletionItemKind.Snippet,
                detail: "Read an integer into a register",
                insertText: new vscode.SnippetString()
                    .appendText((text = "li\t$v0, 5"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# syscall 5: read_int\n")
                    .appendText("syscall\n")
                    .appendText((text = "move\t$"))
                    .appendChoice(Object.keys(registers))
                    .appendText((text2 = ", $v0"))
                    .appendText(requiredCommentIndent(text + text2 + "t0", tabSize, commentColumn))
                    .appendText("# read into $")
                    .appendVariable("1", "register"),
                sortText: this.sortOrders.snippet.toString(),
            },
            {
                label: "read string",
                kind: vscode.CompletionItemKind.Snippet,
                detail: "Read n bytes of a string into an address",
                insertText: new vscode.SnippetString()
                    .appendText((text = "li\t$v0, 8"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# syscall 8: read_string\n")
                    .appendText("la\t$a0, ")
                    .appendChoice(getLabelDefinitions(document).map((label) => label.name))
                    .appendText("\n")
                    .appendText("li\t$a1, ")
                    .appendChoice(getConstantDefinitions(document).map((constant) => constant.name))
                    .appendText("\n")
                    .appendText((text = "syscall"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# read ")
                    .appendVariable("2", "variable")
                    .appendText(" bytes into ")
                    .appendVariable("1", "variable"),
                sortText: this.sortOrders.snippet.toString(),
            },
            {
                label: "read char",
                kind: vscode.CompletionItemKind.Snippet,
                detail: "Read a single character into a register",
                insertText: new vscode.SnippetString()
                    .appendText((text = "li\t$v0, 12"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# syscall 12: read_character\n")
                    .appendText("syscall\n")
                    .appendText((text = "move\t$"))
                    .appendChoice(Object.keys(registers))
                    .appendText((text2 = ", $v0"))
                    .appendText(requiredCommentIndent(text + text2 + "t0", tabSize, commentColumn))
                    .appendText("# read into $")
                    .appendVariable("1", "register"),
                sortText: this.sortOrders.snippet.toString(),
            },
            {
                label: "sbrk",
                kind: vscode.CompletionItemKind.Snippet,
                detail: "Extends .data segment by n bytes",
                insertText: new vscode.SnippetString()
                    .appendText((text = "li\t$v0, 9"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# syscall 9: sbrk\n")
                    .appendText("li\t$a0, ")
                    .appendChoice(getConstantDefinitions(document).map((constant) => constant.name))
                    .appendText("\n")
                    .appendText((text = "syscall"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# extend .data by ")
                    .appendVariable("1", "variable")
                    .appendText(" bytes"),
                sortText: this.sortOrders.snippet.toString(),
            },
            {
                label: "exit",
                kind: vscode.CompletionItemKind.Snippet,
                detail: "Exit the program with code 0",
                insertText: new vscode.SnippetString()
                    .appendText((text = "li\t$v0, 10"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# syscall 10: exit\n")
                    .appendText("syscall"),
                sortText: this.sortOrders.snippet.toString(),
            },
            {
                label: "exit with code",
                kind: vscode.CompletionItemKind.Snippet,
                detail: "Exit the program with a code",
                insertText: new vscode.SnippetString()
                    .appendText((text = "li\t$v0, 17"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# syscall 17: exit2\n")
                    .appendText("li\t$a0, ")
                    .appendChoice(getConstantDefinitions(document).map((constant) => constant.name))
                    .appendText("\n")
                    .appendText((text = "syscall"))
                    .appendText(requiredCommentIndent(text, tabSize, commentColumn))
                    .appendText("# exit with code ")
                    .appendVariable("1", "variable"),
                sortText: this.sortOrders.snippet.toString(),
            },
        ];
    }
}

export { MipsyCompletionItemProvider };
