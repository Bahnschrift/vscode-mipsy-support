import * as vscode from "vscode";
import { getConstantUsages, getLabelUsages } from "./helpers";

const tokensLegend = new vscode.SemanticTokensLegend(["label", "constant"], []);

/**
 * A long term goal could be to completely the textmate grammars with semantic tokenisation.
 * For now, all this does is highlight label usages.
 */
class MipsySemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    public provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens> {
        const builder = new vscode.SemanticTokensBuilder(tokensLegend);

        // Label Usages
        const labelUsages = getLabelUsages(document);
        for (const label of labelUsages) {
            for (const labelUsageLocation of label.locations) {
                builder.push(labelUsageLocation.range, "label");
            }
        }

        const constantUsages = getConstantUsages(document);
        for (const constant of constantUsages) {
            for (const constantUsageLocation of constant.locations) {
                builder.push(constantUsageLocation.range, "constant");
            }
        }

        return builder.build();
    }
}

export { tokensLegend, MipsySemanticTokensProvider };
