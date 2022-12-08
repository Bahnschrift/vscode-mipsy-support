import * as vscode from "vscode";

type keyword = { name: string; location: vscode.Location };
type keywordUsages = { name: string; locations: vscode.Location[] };

function getLabelDefinitions(document: vscode.TextDocument): keyword[] {
    const labels: keyword[] = [];
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const matches = line.text.matchAll(/\b[a-zA-Z_][a-zA-Z0-9_]*\s*:/g);
        for (const m of matches) {
            const startPosition = new vscode.Position(i, m.index!);
            if (!positionValid(document, startPosition)) {
                continue;
            }

            labels.push({
                name: m[0].slice(0, -1).trim(),
                location: new vscode.Location(document.uri, new vscode.Range(i, m.index!, i, m.index! + m[0].length)),
            });
        }
    }
    return labels;
}

function getLabelDefinitionFor(document: vscode.TextDocument, label: string): vscode.Location | undefined {
    const labels = getLabelDefinitions(document);
    const found = labels.find((l) => l.name === label);
    return found?.location;
}

function getLabelUsages(document: vscode.TextDocument): keywordUsages[] {
    const usages = [];
    const labelDefinitions = getLabelDefinitions(document);
    for (const { name, location } of labelDefinitions) {
        usages.push({ name, locations: getLabelUsagesFor(document, name) });
    }

    return usages;
}

function getLabelUsagesFor(document: vscode.TextDocument, label: string): vscode.Location[] {
    const usages: vscode.Location[] = [];
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const matches = line.text.matchAll(new RegExp(`\\b${label}\\b`, "g"));
        for (const m of matches) {
            const startPosition = new vscode.Position(i, m.index!);
            if (!positionValid(document, startPosition)) {
                continue;
            }
            usages.push(new vscode.Location(document.uri, new vscode.Range(i, m.index!, i, m.index! + m[0].length)));
        }
    }
    return usages;
}

function getConstantDefinitions(document: vscode.TextDocument): keyword[] {
    const constants: keyword[] = [];
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const matches = line.text.matchAll(/\b[a-zA-Z_][a-zA-Z0-9_]*\s*=/g);
        for (const m of matches) {
            const startPosition = new vscode.Position(i, m.index!);
            if (!positionValid(document, startPosition)) {
                continue;
            }

            constants.push({
                name: m[0].split("=")[0].trim(),
                location: new vscode.Location(document.uri, new vscode.Range(i, m.index!, i, m.index! + m[0].length)),
            });
        }
    }
    return constants;
}

function getConstantDefinitionFor(document: vscode.TextDocument, constant: string): vscode.Location | undefined {
    const constants = getConstantDefinitions(document);
    const found = constants.find((l) => l.name === constant);
    if (found) {
        return found.location;
    }
}

function getConstantUsages(document: vscode.TextDocument): keywordUsages[] {
    const usages = [];
    const constantDefinitions = getConstantDefinitions(document);
    for (const { name, location } of constantDefinitions) {
        usages.push({ name, locations: getConstantUsagesFor(document, name) });
    }

    return usages;
}

function getConstantUsagesFor(document: vscode.TextDocument, constant: string): vscode.Location[] {
    const usages: vscode.Location[] = [];
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const matches = line.text.matchAll(new RegExp(`\\b${constant}\\b`, "g"));
        for (const m of matches) {
            const startPosition = new vscode.Position(i, m.index!);
            if (!positionValid(document, startPosition)) {
                continue;
            }
            usages.push(new vscode.Location(document.uri, new vscode.Range(i, m.index!, i, m.index! + m[0].length)));
        }
    }
    return usages;
}

// Ensure that a position is not in a string literal, character, or comment
// Note that comments are indicated by an octothorpe (#)
// Comments
function positionValid(document: vscode.TextDocument, position: vscode.Position) {
    const line = document.lineAt(position.line);
    const lineText = line.text;
    const textBefore = lineText.slice(0, position.character);

    let inString = false;
    let inChar = false;
    let inComment = false;

    for (const char of textBefore) {
        if (inComment) {
            continue;
        }
        if (inString) {
            if (char === "\\") {
                // Skip the next character if it is escaped
                continue;
            }
            if (char === '"') {
                inString = false;
            }
            continue;
        }
        if (inChar) {
            if (char === "\\") {
                // Skip the next character if it is escaped
                continue;
            }
            if (char === "'") {
                inChar = false;
            }
            continue;
        }

        if (char === "#") {
            inComment = true;
        } else if (char === '"') {
            inString = true;
        } else if (char === "'") {
            inChar = true;
        }
    }

    return !(inString || inChar || inComment);
}

export {
    getLabelDefinitionFor,
    getLabelUsages,
    getLabelUsagesFor,
    getConstantDefinitionFor,
    getConstantUsages,
    getConstantUsagesFor,
    positionValid
};
