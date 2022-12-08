import * as vscode from "vscode";
import { getConstantDefinitionFor, getConstantUsagesFor, getLabelDefinitionFor, getLabelUsagesFor } from "./helpers";

class MipsyDefinitionProvider implements vscode.DefinitionProvider {
    public provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
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
        position: vscode.Position
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

export { MipsyDefinitionProvider, MipsyReferenceProvider };
