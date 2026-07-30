// scripts/eslint-worker-entry.js
// Entry point for esbuild to bundle ESLint Linter into a browser-compatible Web Worker.
// Uses ESLint's Linter class with the built-in espree parser (browser-safe).
// For TypeScript type checking, Monaco's built-in TS worker handles that.

import { Linter } from "eslint";

const linter = new Linter();

const lintConfig = {
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  rules: {
    "no-unused-vars": "warn",
    "no-undef": "error",
    "no-dupe-keys": "error",
    "no-unreachable": "error",
    "no-cond-assign": "error",
    "no-constant-condition": "warn",
    "no-debugger": "warn",
    "no-duplicate-case": "error",
    "no-empty": "warn",
    "no-extra-semi": "warn",
    "no-irregular-whitespace": "error",
    "no-sparse-arrays": "error",
    "no-unexpected-multiline": "warn",
    "use-isnan": "error",
    "valid-typeof": "error",
    "no-control-regex": "error",
    "no-dupe-args": "error",
    "no-duplicate-imports": "warn",
    "no-self-compare": "warn",
    "no-shadow-restricted-names": "error",
    "no-unused-labels": "error",
    "no-useless-catch": "error",
    "no-with": "error",
    "eqeqeq": ["warn", "smart"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-console": "off",
  },
};

self.onmessage = async (event) => {
  const { fileId, path, content, language } = event.data;

  let diagnostics = [];

  const isJS = language === "javascript" || language === "jsx";
  const isTS = language === "typescript" || language === "tsx";

  if (isJS || isTS) {
    try {
      const messages = linter.verify(content, lintConfig);

      diagnostics = messages.map((msg) => ({
        fileId,
        line: msg.line || 1,
        column: msg.column || 1,
        message: msg.message,
        severity: msg.severity === 2 ? "error" : "warning",
        source: msg.ruleId || "eslint",
        endLine: msg.endLine || msg.line,
        endColumn: msg.endColumn || (msg.column + 1),
        fix: msg.fix ? {
          range: msg.fix.range,
          text: msg.fix.text,
        } : undefined,
      }));
    } catch (err) {
      // Parser error — report as a single error
      diagnostics = [{
        fileId,
        line: 1,
        column: 1,
        message: `Lint error: ${err.message}`,
        severity: "error",
        source: "parser",
      }];
    }
  } else if (language === "json") {
    try {
      JSON.parse(content);
    } catch (e) {
      const msg = e.message;
      const posMatch = msg.match(/position (\d+)/);
      const pos = posMatch ? parseInt(posMatch[1]) : 0;
      const before = content.substring(0, pos);
      const line = before.split("\n").length;
      const lastLine = before.split("\n").pop() || "";
      const col = lastLine.length + 1;
      diagnostics = [{
        fileId,
        line,
        column: col,
        message: `Invalid JSON: ${msg}`,
        severity: "error",
        source: "json",
      }];
    }
  }

  self.postMessage(diagnostics);
};
