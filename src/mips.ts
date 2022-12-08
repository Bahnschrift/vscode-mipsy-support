import * as vscode from "vscode";
import { allInstructions, directives } from "./constants";
import {
    getConstantDefinitionFor,
    getConstantUsagesFor,
    getLabelDefinitionFor,
    getLabelUsagesFor,
    positionValid,
} from "./helpers";
import { MipsySemanticTokensProvider, tokensLegend } from "./semanticTokens";

class MipsyCompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        if (!positionValid(document, position)) {
            return [];
        }

        // If the line starts with a tab, we expect either a directive or an instruction
        return this.getInstructionCompletionItems().concat(this.getDirectiveCompletionItems(document, position));
    }

    private getInstructionCompletionItems(): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        for (const instruction in allInstructions) {
            items.push({
                label: instruction,
                kind: vscode.CompletionItemKind.Function,
                detail: allInstructions[instruction],
                insertText: instruction + "\t",
            });
        }
        return items;
    }

    private getDirectiveCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.CompletionItem[] {
        let prependDot = true;

        const line = document.lineAt(position.line);
        const lineText = line.text;
        const wordRange = document.getWordRangeAtPosition(position);
        let firstCharOfWord = wordRange ? wordRange.start.character : position.character;
        if (firstCharOfWord > 0) {
            if (lineText[firstCharOfWord - 1] === ".") {
                prependDot = false;
            }
        }

        const items: vscode.CompletionItem[] = [];
        for (const directive in directives) {
            items.push({
                label: "." + directive,
                kind: vscode.CompletionItemKind.Field,
                detail: directives[directive],
                insertText: prependDot ? "." + directive : directive,
            });
        }
        return items;
    }
}

class MipsyDefinitionProvider implements vscode.DefinitionProvider {
    public provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return;
        }

        const word = document.getText(wordRange);
        const labelDefinition = getLabelDefinitionFor(document, word);
        if (labelDefinition) {
            // If we are at specifically the definition of the label, return the definition AND all usages
            if (labelDefinition.range.start.line === position.line) {
                const usages = getLabelUsagesFor(document, word);
                return usages;
            }

            return labelDefinition;
        }

        const constantDefinition = getConstantDefinitionFor(document, word);
        if (constantDefinition) {
            if (constantDefinition.range.start.line === position.line) {
                const usages = getLabelUsagesFor(document, word);
                return usages;
            }

            return constantDefinition;
        }
    }
}

class MipsyReferenceProvider implements vscode.ReferenceProvider {
    public provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Location[]> {
        // Get word at cursor
        const wordRange = document.getWordRangeAtPosition(position);
        if (wordRange) {
            const word = document.getText(wordRange);
            const labelUsages = getLabelUsagesFor(document, word);
            if (labelUsages) {
                return labelUsages;
            }

            const constantUsages = getConstantUsagesFor(document, word);
            if (constantUsages) {
                return constantUsages;
            }
        }
    }
}

vscode.languages.registerCompletionItemProvider("mips", new MipsyCompletionItemProvider(), ".");
vscode.languages.registerDefinitionProvider("mips", new MipsyDefinitionProvider());
vscode.languages.registerReferenceProvider("mips", new MipsyReferenceProvider());
vscode.languages.registerDocumentSemanticTokensProvider("mips", new MipsySemanticTokensProvider(), tokensLegend);
