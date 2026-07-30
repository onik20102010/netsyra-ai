// public/ast.worker.js
// TypeScript AST parser running in a Web Worker.
// Loads the TypeScript compiler from CDN to parse files into AST.
// Extracts symbols (functions, classes, interfaces, variables, React components)
// and import declarations.

self.onmessage = (event) => {
  const { filePath, content } = event.data;

  try {
    // Load TypeScript compiler from CDN (loaded once, cached by browser)
    if (typeof ts === 'undefined') {
      importScripts('https://cdn.jsdelivr.net/npm/typescript@5.5.4/lib/typescript.min.js');
    }

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const symbols = [];
    const imports = [];
    const relations = [];

    // Track imported names to resolve call expressions back to their source files
    const importedNames = new Map(); // name -> moduleSpecifier

    function visit(node) {
      // Detect Import Declarations
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
          ? node.moduleSpecifier.text
          : null;
        if (moduleSpecifier) {
          imports.push(moduleSpecifier);

          // Track imported named bindings for relation graph
          if (node.importClause) {
            // Default import
            if (node.importClause.name) {
              importedNames.set(node.importClause.name.text, moduleSpecifier);
              relations.push({
                symbolName: node.importClause.name.text,
                callerFilePath: filePath,
                calleeFilePath: moduleSpecifier,
                calleeSymbolName: node.importClause.name.text,
                calleeKind: 'Import',
              });
            }
            // Named imports
            if (node.importClause.namedBindings) {
              if (ts.isNamedImports(node.importClause.namedBindings)) {
                for (const element of node.importClause.namedBindings.elements) {
                  const importedName = element.propertyName || element.name.text;
                  const localName = element.name.text;
                  importedNames.set(localName, moduleSpecifier);
                  relations.push({
                    symbolName: localName,
                    callerFilePath: filePath,
                    calleeFilePath: moduleSpecifier,
                    calleeSymbolName: importedName,
                    calleeKind: 'Import',
                  });
                }
              } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                // import * as foo from 'module'
                const nsName = node.importClause.namedBindings.name.text;
                importedNames.set(nsName, moduleSpecifier);
                relations.push({
                  symbolName: nsName,
                  callerFilePath: filePath,
                  calleeFilePath: moduleSpecifier,
                  calleeSymbolName: '*',
                  calleeKind: 'NamespaceImport',
                });
              }
            }
          }
        }
      }

      // Detect Export Declarations (re-exports)
      if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        const moduleSpecifier = ts.isStringLiteral(node.moduleSpecifier)
          ? node.moduleSpecifier.text
          : null;
        if (moduleSpecifier) {
          imports.push(moduleSpecifier);
        }
      }

      // Detect Function Declarations
      if (ts.isFunctionDeclaration(node) && node.name) {
        const pos = ts.getLineAndCharacterOfPosition(sourceFile, node.name.pos);
        symbols.push({
          name: node.name.text,
          kind: 'Function',
          filePath,
          line: pos.line + 1,
          column: pos.character + 1,
        });
      }

      // Detect Class Declarations
      if (ts.isClassDeclaration(node) && node.name) {
        const pos = ts.getLineAndCharacterOfPosition(sourceFile, node.name.pos);
        symbols.push({
          name: node.name.text,
          kind: 'Class',
          filePath,
          line: pos.line + 1,
          column: pos.character + 1,
        });
      }

      // Detect Interface Declarations
      if (ts.isInterfaceDeclaration(node) && node.name) {
        const pos = ts.getLineAndCharacterOfPosition(sourceFile, node.name.pos);
        symbols.push({
          name: node.name.text,
          kind: 'Interface',
          filePath,
          line: pos.line + 1,
          column: pos.character + 1,
        });
      }

      // Detect Type Alias Declarations
      if (ts.isTypeAliasDeclaration(node) && node.name) {
        const pos = ts.getLineAndCharacterOfPosition(sourceFile, node.name.pos);
        symbols.push({
          name: node.name.text,
          kind: 'Type',
          filePath,
          line: pos.line + 1,
          column: pos.character + 1,
        });
      }

      // Detect Enum Declarations
      if (ts.isEnumDeclaration(node) && node.name) {
        const pos = ts.getLineAndCharacterOfPosition(sourceFile, node.name.pos);
        symbols.push({
          name: node.name.text,
          kind: 'Enum',
          filePath,
          line: pos.line + 1,
          column: pos.character + 1,
        });
      }

      // Detect Variable Declarations (const, let, var)
      // This catches React components defined as const MyComponent = () => { ... }
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (declaration.name && ts.isIdentifier(declaration.name)) {
            const pos = ts.getLineAndCharacterOfPosition(sourceFile, declaration.name.pos);
            const name = declaration.name.text;

            // Determine if it's a React component (starts with uppercase)
            const isComponent = /^[A-Z]/.test(name);
            const kind = isComponent ? 'Component' : 'Variable';

            symbols.push({
              name,
              kind,
              filePath,
              line: pos.line + 1,
              column: pos.character + 1,
            });
          }
        }
      }

      // Detect Arrow Functions and Function Expressions assigned to variables
      if (ts.isVariableDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
        if (node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
          const pos = ts.getLineAndCharacterOfPosition(sourceFile, node.name.pos);
          const name = node.name.text;
          const isComponent = /^[A-Z]/.test(name);

          // Only add if not already added by VariableStatement handler
          const exists = symbols.some(s => s.name === name && s.line === pos.line + 1);
          if (!exists) {
            symbols.push({
              name,
              kind: isComponent ? 'Component' : 'Function',
              filePath,
              line: pos.line + 1,
              column: pos.character + 1,
            });
          }
        }
      }

      // Detect Methods inside classes
      if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
        const pos = ts.getLineAndCharacterOfPosition(sourceFile, node.name.pos);
        symbols.push({
          name: node.name.text,
          kind: 'Method',
          filePath,
          line: pos.line + 1,
          column: pos.character + 1,
        });
      }

      // Detect Function Calls (Call Expressions)
      if (ts.isCallExpression(node)) {
        const expr = node.expression;

        // Simple identifier call: fetchUsers()
        if (ts.isIdentifier(expr)) {
          const calleeName = expr.text;
          const sourceModule = importedNames.get(calleeName);
          relations.push({
            symbolName: calleeName,
            callerFilePath: filePath,
            calleeFilePath: sourceModule || filePath,
            calleeSymbolName: calleeName,
            calleeKind: 'FunctionCall',
          });
        }

        // Property access call: foo.bar() or importedNs.func()
        if (ts.isPropertyAccessExpression(expr)) {
          const objectExpr = expr.expression;
          const methodName = expr.name.text;

          // Check if it's a namespace import call: Utils.something()
          if (ts.isIdentifier(objectExpr)) {
            const nsName = objectExpr.text;
            const sourceModule = importedNames.get(nsName);
            if (sourceModule) {
              relations.push({
                symbolName: methodName,
                callerFilePath: filePath,
                calleeFilePath: sourceModule,
                calleeSymbolName: methodName,
                calleeKind: 'FunctionCall',
              });
            } else {
              // Local method call: this.method() or object.method()
              relations.push({
                symbolName: methodName,
                callerFilePath: filePath,
                calleeFilePath: filePath,
                calleeSymbolName: methodName,
                calleeKind: 'MethodCall',
              });
            }
          }
        }

        // JSX component usage: <MyComponent /> or <MyComponent.Comp />
        if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
          const tagName = node.tagName;
          if (ts.isIdentifier(tagName)) {
            const compName = tagName.text;
            const sourceModule = importedNames.get(compName);
            if (sourceModule) {
              relations.push({
                symbolName: compName,
                callerFilePath: filePath,
                calleeFilePath: sourceModule,
                calleeSymbolName: compName,
                calleeKind: 'JSXUsage',
              });
            }
          }
        }
      }

      // Detect JSX element usage (self-closing and opening)
      if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        const tagName = node.tagName;
        if (ts.isIdentifier(tagName)) {
          const compName = tagName.text;
          const sourceModule = importedNames.get(compName);
          if (sourceModule) {
            relations.push({
              symbolName: compName,
              callerFilePath: filePath,
              calleeFilePath: sourceModule,
              calleeSymbolName: compName,
              calleeKind: 'JSXUsage',
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    self.postMessage({ filePath, symbols, imports, relations });
  } catch (err) {
    self.postMessage({
      filePath,
      symbols: [],
      imports: [],
      relations: [],
      error: err.message,
    });
  }
};
