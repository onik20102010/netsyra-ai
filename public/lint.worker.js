// public/lint.worker.js
// Real ESLint linter running in a Web Worker, fully client-side.
// Loads eslint-linter-browserify from CDN (pre-bundled for browser use).
// For TypeScript type checking, Monaco's built-in TS worker handles that.

importScripts("https://cdn.jsdelivr.net/npm/eslint-linter-browserify@9.18.0/dist/linter.js");

// The CDN exposes the global as 'eslint' (not 'eslintLinter')
// Handle both names safely
const Linter = typeof eslint !== "undefined"
  ? eslint.Linter
  : (typeof eslintLinter !== "undefined" ? eslintLinter.Linter : null);

if (!Linter) {
  console.error("Failed to load ESLint Linter from CDN");
}

const linter = Linter ? new Linter() : null;

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
    "no-var": "warn",
    "prefer-const": "warn",
    "no-throw-literal": "error",
    "no-return-await": "warn",
  },
};

self.onmessage = async (event) => {
  const { fileId, path, content, language } = event.data;

  let diagnostics = [];

  const isJS = language === "javascript" || language === "jsx";
  const isTS = language === "typescript" || language === "tsx";

  if ((isJS || isTS) && !linter) {
    // ESLint failed to load from CDN — return empty instead of crashing
    self.postMessage([]);
    return;
  }

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
      diagnostics = [{
        fileId,
        line: 1,
        column: 1,
        message: `Parse error: ${err.message}`,
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
  } else if (language === "css" || language === "scss") {
    diagnostics = lintCSS(content, fileId);
  }

  self.postMessage(diagnostics);
};

// ── CSS linter (basic, kept for non-JS files) ──────
function lintCSS(content, fileId) {
  const diagnostics = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.includes(':') && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.endsWith(',') && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
      if (/[a-zA-Z-]+\s*:\s*[^;]+$/.test(trimmed)) {
        diagnostics.push({
          fileId,
          line: i + 1,
          column: trimmed.length,
          message: "Missing semicolon at end of declaration",
          severity: 'warning',
          source: 'css'
        });
      }
    }
  }

  return diagnostics;
}
