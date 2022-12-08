import * as vscode from "vscode";
import { allInstructions, directives, registers } from "./constants";
import { getConstantDefinitionFor, positionValid } from "./helpers";

class MipsyHoverProvider implements vscode.HoverProvider {
    public provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
        if (!positionValid(document, position)) {
            return;
        }

        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return;
        }

        const word = document.getText(wordRange);
        if (word in allInstructions) {
            return new vscode.Hover(allInstructions[word]);
        }

        if (word in directives) {
            return new vscode.Hover(directives[word]);
        }

        if (word in registers) {
            return new vscode.Hover(registers[word]);
        }

        const constantDefinition = getConstantDefinitionFor(document, word);
        if (constantDefinition) {
            const definitionLineText = document.lineAt(constantDefinition.range.start.line).text;
            return new vscode.Hover(new vscode.MarkdownString().appendCodeblock(definitionLineText, "mips"));
        }
    }
}

export { MipsyHoverProvider };
