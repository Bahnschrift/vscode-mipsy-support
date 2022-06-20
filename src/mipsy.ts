import { resolve } from "path";
import * as vscode from "vscode";

const tokenTypes = new Map<string, number>();

const legend = (function () {
    const tokenTypesLegend = [
        "comment",
        "string",
        "keyword",
        "number",
        "regexp",
        "operator",
        "namespace",
        "type",
        "struct",
        "class",
        "interface",
        "enum",
        "typeParameter",
        "function",
        "method",
        "decorator",
        "macro",
        "variable",
        "parameter",
        "property",
        "label",
    ];
    tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

    return new vscode.SemanticTokensLegend(tokenTypesLegend);
})();

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: "mips" },
            new DocumentSemanticTokensProvider(),
            legend
        )
    );
}

interface IParsedToken {
    line: number;
    startCharacter: number;
    length: number;
    tokenType: string;
}

class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    async provideDocumentSemanticTokens(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.SemanticTokens> {
        const allTokens = this._parseText(document.getText());
        const builder = new vscode.SemanticTokensBuilder();
        allTokens.forEach((token) => {
            builder.push(token.line, token.startCharacter, token.length, this._encodeTokenType(token.tokenType));
        });
        return builder.build();
    }

    private _encodeTokenType(tokenType: string): number {
        if (tokenTypes.has(tokenType)) {
            return tokenTypes.get(tokenType)!;
        } else if (tokenType === "notInLegend") {
            return tokenTypes.size + 2;
        }
        return 0;
    }

    private _parseText(text: string): IParsedToken[] {
        const r: IParsedToken[] = [];
        const lines = text.split(/\r\n|\r|\n/);

        const constants: string[] = [];
        const labels: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = this._removeComments(this._removeStrings(lines[i]));
            const constantRegexInfo = /^\s*([A-z][A-z0-9]*)\s*=/.exec(line);
            if (constantRegexInfo) {
                constants.push(constantRegexInfo[1]);
                constants.sort().reverse();
            }

            const labelRegexInfo = /^\s*([A-z][A-z0-9]*)\s*:/.exec(line);
            if (labelRegexInfo) {
                labels.push(labelRegexInfo[1]);
                labels.sort().reverse();
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = this._removeComments(this._removeStrings(lines[i]));

            for (let constant of constants) {
                const index = line.indexOf(constant);
                if (index !== -1) {
                    r.push({
                        line: i,
                        startCharacter: index,
                        length: constant.length,
                        tokenType: "function",
                    });
                }
                // const constantRegex = new RegExp(`^(.*)\\b(${constant})\\b`);
                // const constantRegexInfo = constantRegex.exec(line);
                // if (constantRegexInfo) {
                //     r.push({
                //         line: i,
                //         startCharacter: constantRegexInfo[1].length,
                //         length: constantRegexInfo[2].length,
                //         tokenType: "function",
                //     });
                // }
            }

            for (let label of labels) {
                if (line.indexOf(label) !== -1) {
                    r.push({
                        line: i,
                        startCharacter: line.indexOf(label),
                        length: label.length,
                        tokenType: "enum",
                    });
                }
            }
        }

        return r;
    }

    private _removeStrings(line: string): string {
        return line.replace(/"(?:[^"\\]|\\.)*"/g, "").replace(/'(?:[^'\\]|\\.)*'/g, "");
    }

    private _removeComments(line: string): string {
        if (line.indexOf("#") !== -1) {
            return line.slice(0, line.indexOf("#"));
        }

        return line;
    }

    private _parseTextToken(text: string): { tokenType: string; tokenModifiers: string[] } {
        const parts = text.split(".");
        return {
            tokenType: parts[0],
            tokenModifiers: parts.slice(1),
        };
    }
}
