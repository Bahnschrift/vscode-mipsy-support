import * as vscode from "vscode";
import { allInstructions, directives, registers } from "./constants";
import { getConstantDefinitions, getLabelDefinitions, positionValid } from "./helpers";

class MipsyCompletionItemProvider implements vscode.CompletionItemProvider {
    private sortOrders = {
        instruction: 0,
        directive: 3,
        register: 4,
        label: 1,
        constant: 2,
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
            }
        }

        return this.getInstructionCompletionItems()
            .concat(this.getDirectiveCompletionItems(true))
            .concat(this.getRegisterCompletionItems(true))
            .concat(this.getLabelCompletionItems(document))
            .concat(this.getConstantCompletionItems(document));
    }

    private getInstructionCompletionItems(): vscode.CompletionItem[] {
        const autoIndent = vscode.workspace.getConfiguration("mipsy-support").autoIndentAfterInstructionCompletion;

        return Object.keys(allInstructions).map((instruction) => {
            return {
                label: instruction,
                kind: vscode.CompletionItemKind.Function,
                detail: allInstructions[instruction],
                insertText: instruction + (autoIndent ? "\t" : ""),
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
}

export { MipsyCompletionItemProvider };
