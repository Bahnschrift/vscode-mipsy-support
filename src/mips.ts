import * as vscode from "vscode";
import { MipsyCompletionItemProvider } from "./completion";
import { MipsyDefinitionProvider, MipsyReferenceProvider } from "./definitions";
import { MipsyHoverProvider } from "./hover";
import { MipsySemanticTokensProvider, tokensLegend } from "./semanticTokens";

vscode.languages.registerHoverProvider("mips", new MipsyHoverProvider());
vscode.languages.registerCompletionItemProvider(
    "mips",
    new MipsyCompletionItemProvider(),
    ...MipsyCompletionItemProvider.triggerCharacters
);
vscode.languages.registerDefinitionProvider("mips", new MipsyDefinitionProvider());
vscode.languages.registerReferenceProvider("mips", new MipsyReferenceProvider());
vscode.languages.registerDocumentSemanticTokensProvider("mips", new MipsySemanticTokensProvider(), tokensLegend);
