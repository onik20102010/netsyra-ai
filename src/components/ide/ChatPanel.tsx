// src/components/ide/ChatPanel.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, File, GitCommit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import FileApprovalCard, { PendingFile } from "./FileApprovalCard";
import CommandApprovalCard, { CommandBlock } from "./CommandApprovalCard";
import RenamePreviewCard from "./RenamePreviewCard";
import ImpactViewCard from "./ImpactViewCard";
import CommitCard from "./CommitCard";
import ErrorFixCard from "./ErrorFixCard";
import ReviewCard, { ReviewResult } from "./ReviewCard";
import { createClient } from "@/lib/supabase/client";
import AgentPipeline, { AgentStep } from "./AgentPipeline";
import { buildExportIndexFromFiles, autoImportFile, cleanupImports } from "@/lib/ide/brain/auto-import";
import { validatePatch, ValidationError } from "@/lib/ide/brain/patch-validator";
import { getChanges, storeCommit, storeSnapshot, Commit } from "@/lib/ide/brain/commit-tracker";

// ── Diff applicator ────────────────────────────────
function applyDiff(original: string, diff: string): string | null {
  try {
    const originalLines = original.split("\n");
    const resultLines: string[] = [];
    let diffIndex = 0;
    const diffLines = diff.split("\n");

    while (diffIndex < diffLines.length) {
      const line = diffLines[diffIndex];
      const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunkMatch) {
        const originalStart = parseInt(hunkMatch[1]) - 1;
        const newStart = parseInt(hunkMatch[2]) - 1;
        while (resultLines.length < originalStart && resultLines.length < originalLines.length) {
          resultLines.push(originalLines[resultLines.length] || "");
        }
        diffIndex++;
        let currentLine = originalStart;
        while (diffIndex < diffLines.length && !diffLines[diffIndex].startsWith("@@")) {
          const diffLine = diffLines[diffIndex];
          if (diffLine.startsWith("+")) {
            resultLines.push(diffLine.substring(1));
            currentLine++;
          } else if (diffLine.startsWith("-")) {
            currentLine++;
          } else if (diffLine.startsWith(" ")) {
            resultLines.push(diffLine.substring(1));
            currentLine++;
          }
          diffIndex++;
        }
      } else {
        diffIndex++;
      }
    }

    while (resultLines.length < originalLines.length) {
      resultLines.push(originalLines[resultLines.length]);
    }

    return resultLines.join("\n");
  } catch (e) {
    console.error("Failed to apply diff:", e);
    return null;
  }
}

// ── Types ────────────────────────────────────────
interface ChatPanelProps {
  activeFile: string | null;
  fileContent: string;
  onFileWrite: (path: string, content: string) => void;
  onImmediateSave?: (path: string, content: string) => void;
  allFiles?: Record<string, string>;
  openFiles?: string[];
  recentEdits?: { path: string; timestamp: number }[];
  cursorPosition?: { line: number; column: number } | null;
  currentErrors?: string[];
}

type Mode = "ask" | "plan" | "agent";

interface FileBlock {
  path: string;
  content: string;
  status: "pending" | "accepted" | "rejected" | "error";
  errors?: ValidationError[];
  _needsRename?: boolean;
  type?: "file" | "diff";
}

const USER_FACING_STEPS: AgentStep[] = [
  { key: "scanning",   label: "Analyzing workspace…",  status: "pending" },
  { key: "detecting",  label: "Detecting intent…",     status: "pending" },
  { key: "planning",   label: "Planning…",             status: "pending" },
  { key: "writing",    label: "Writing code…",         status: "pending" },
  { key: "checking",   label: "Reviewing…",            status: "pending" },
  { key: "done",       label: "Complete",              status: "pending" },
];

export default function ChatPanel({
  activeFile,
  fileContent,
  onFileWrite,
  onImmediateSave,
  allFiles,
  openFiles,
  recentEdits,
  cursorPosition,
  currentErrors,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("ask");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [pendingFiles, setPendingFiles] = useState<FileBlock[]>([]);
  const [showApproval, setShowApproval] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [confirmingFile, setConfirmingFile] = useState<string | null>(null);
  const [planSummary, setPlanSummary] = useState<string>("");

  const [renamePreview, setRenamePreview] = useState<{
    oldName: string; newName: string; totalFiles: number; totalOccurrences: number;
    importChanges: number; exportChanges: number;
  } | null>(null);

  const [impactData, setImpactData] = useState<{
    dependencyTree: string; riskLevel: "Low" | "Medium" | "High";
    filesAffected: number; breakingAreas: string[]; unchangedFiles: string[];
  } | null>(null);

  const [errorScanData, setErrorScanData] = useState<{
    totalErrors: number;
    errors: { file: string; line: number; message: string }[];
    fixPlan: { file: string; action: string }[];
  } | null>(null);

  const [reviewData, setReviewData] = useState<ReviewResult | null>(null);

  const [showCommit, setShowCommit] = useState(false);
  const [commitMessages, setCommitMessages] = useState<{
    main: string; alternatives: string[];
  } | null>(null);

  const [pendingCommands, setPendingCommands] = useState<CommandBlock[]>([]);
  const [showCommands, setShowCommands] = useState(false);

  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>(USER_FACING_STEPS);
  const [pipelineExpanded, setPipelineExpanded] = useState(true);
  const stepsRef = useRef(pipelineSteps);
  stepsRef.current = pipelineSteps;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, pipelineSteps]);

  // ── Handlers ──────────────────────────────────────
  const handleConfirmFile = (path: string) => setConfirmingFile(path);

  const handleAcceptFile = (path: string, content: string) => {
    setPendingFiles(prev =>
      prev.map(f => {
        if (f.path !== path) return f;
        if (f.type === "diff") {
          const existingContent = allFiles?.[path] || "";
          const patchedContent = applyDiff(existingContent, content);
          if (patchedContent !== null) {
            onFileWrite(path, patchedContent);
            if (onImmediateSave) onImmediateSave(path, patchedContent);
          }
          return { ...f, content: patchedContent || f.content, status: "accepted" as const };
        }
        return { ...f, status: "accepted" as const };
      })
    );
    setConfirmingFile(null);
  };

  const handleRejectFile = (path: string) => {
    setPendingFiles(prev =>
      prev.map(f => (f.path === path ? { ...f, status: "rejected" as const } : f))
    );
    setConfirmingFile(null);
  };

  const handleCommit = () => {
    const acceptedFiles = pendingFiles.filter(f => f.status === "accepted");
    if (acceptedFiles.length === 0) return;

    const { errors } = validatePatch(
      acceptedFiles.map(f => ({ path: f.path, content: f.content })),
      allFiles || {}
    );

    if (errors.length > 0) {
      setValidationErrors(errors);
      setPendingFiles(prev =>
        prev.map(f => {
          const fileErrors = errors.filter(e => e.file === f.path);
          return fileErrors.length > 0 ? { ...f, errors: fileErrors, status: "error" as const } : f;
        })
      );
      return;
    }

    for (const file of acceptedFiles) {
      if (file.type !== "diff") {
        onFileWrite(file.path, file.content);
        if (onImmediateSave) onImmediateSave(file.path, file.content);
      }
    }

    setShowApproval(false);
    setValidationErrors([]);
    setPendingFiles([]);
    setConfirmingFile(null);
    setPlanSummary("");
    setRenamePreview(null);
    setImpactData(null);
    setErrorScanData(null);
    setReviewData(null);
  };

  // ── Commit message generation ──────────────────────
  const handleGenerateCommit = async () => {
    if (!allFiles) return;
    const changes = await getChanges(allFiles);
    if (!changes.added.length && !changes.modified.length && !changes.deleted.length) {
      alert("No changes to commit.");
      return;
    }
    const commitPrompt = buildCommitPrompt(changes.diffSummary);

    const response = await fetch("/api/ide-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: commitPrompt }],
        mode: "ask",
        activeFile: null,
        fileContent: "",
        files: allFiles,
        projectFiles: Object.keys(allFiles),
      }),
    });

    if (!response.ok) {
      console.error("Commit generation failed");
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value);
    }

    const mainMatch = fullText.match(/Main:\s*\n?([\s\S]*?)(?=\n\nAlternatives:|$)/);
    const altMatch = fullText.match(/Alternatives:\s*\n([\s\S]*)$/);
    const main = mainMatch?.[1]?.trim() || "chore: update project files";
    const alternatives = altMatch
      ? altMatch[1].split("\n").filter(line => line.trim()).map(line => line.replace(/^-\s*/, "").trim())
      : [];
    setCommitMessages({ main, alternatives });
    setShowCommit(true);
  };

  const handleSelectCommit = async (message: string) => {
    const changes = await getChanges(allFiles || {});
    const commit: Commit = {
      id: crypto.randomUUID(),
      message,
      timestamp: Date.now(),
      added: changes.added,
      modified: changes.modified,
      deleted: changes.deleted,
      filesSnapshot: { ...allFiles },
    };
    await storeCommit(commit);
    await storeSnapshot(allFiles || {});
    setShowCommit(false);
    setCommitMessages(null);
  };

  const advanceUserFacingPipeline = useCallback((charCount: number, foundFileBlocks: boolean) => {
    setPipelineSteps(prev => {
      const newSteps = [...prev];
      if (charCount > 10 && newSteps[0].status === "working") {
        newSteps[0] = { ...newSteps[0], status: "done" };
        newSteps[1] = { ...newSteps[1], status: "working" };
      }
      if (charCount > 50 && newSteps[1].status === "working") {
        newSteps[1] = { ...newSteps[1], status: "done" };
        newSteps[2] = { ...newSteps[2], status: "working" };
      }
      if (charCount > 200 && newSteps[2].status === "working") {
        newSteps[2] = { ...newSteps[2], status: "done" };
        newSteps[3] = { ...newSteps[3], status: "working" };
      }
      if ((foundFileBlocks || charCount > 600) && newSteps[3].status === "working") {
        newSteps[3] = { ...newSteps[3], status: "done" };
        newSteps[4] = { ...newSteps[4], status: "working" };
      }
      return newSteps;
    });
  }, []);

  // ── Main send handler ────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsThinking(true);

    setPipelineSteps(USER_FACING_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "working" : "pending" })));
    setPipelineExpanded(true);
    setPlanSummary("");
    setRenamePreview(null);
    setImpactData(null);
    setErrorScanData(null);
    setReviewData(null);
    setValidationErrors([]);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Session expired. Please reload the page to log in again." }]);
          setIsLoading(false);
          setIsThinking(false);
          setPipelineSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
          return;
        }
      }

      const response = await fetch("/api/ide-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          activeFile,
          fileContent,
          mode,
          projectFiles: Object.keys(allFiles || {}),
          files: allFiles || {},
          workspaceState: {
            openFiles,
            recentEdits,
            cursorPosition,
            currentErrors,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(response.status === 401 ? "Unauthorized" : await response.text());
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantContent += chunk;
        const cleanContent = assistantContent.replace(/<think[\s\S]*?<\/think>/g, "").trim();
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: cleanContent };
          return updated;
        });
        const hasFileBlocks = /```(?:file|diff)/.test(assistantContent);
        advanceUserFacingPipeline(assistantContent.length, hasFileBlocks);
      }

      setPipelineSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
      setIsThinking(false);

      assistantContent = assistantContent.replace(/<think[\s\S]*?<\/think>/g, "").trim();

      // Extract Implementation Plan
      const planMatch = assistantContent.match(/## Implementation Plan\n([\s\S]*?)(?=\n## |\n```file|\n```diff|$)/);
      if (planMatch) {
        const planText = planMatch[1].trim();
        setPlanSummary(planText);
        assistantContent = assistantContent.replace(planMatch[0], "").trim();
      }

      // Extract Rename Preview
      let extractedRename: { oldName: string; newName: string; totalFiles: number; totalOccurrences: number; importChanges: number; exportChanges: number; } | null = null;
      const renameMatch = assistantContent.match(/## Rename Preview\n([\s\S]*?)(?=\n## |\n```|$)/);
      if (renameMatch) {
        const previewText = renameMatch[1];
        const oldMatch = previewText.match(/Old name:\s*(\S+)/);
        const newMatch = previewText.match(/New name:\s*(\S+)/);
        const filesMatch = previewText.match(/Files affected:\s*(\d+)/);
        const refsMatch = previewText.match(/References found:\s*(\d+)/);
        if (oldMatch && newMatch) {
          extractedRename = {
            oldName: oldMatch[1],
            newName: newMatch[1],
            totalFiles: parseInt(filesMatch?.[1] || "0"),
            totalOccurrences: parseInt(refsMatch?.[1] || "0"),
            importChanges: 0,
            exportChanges: 0,
          };
          assistantContent = assistantContent.replace(renameMatch[0], "").trim();
        }
      }
      setRenamePreview(extractedRename);

      // Extract Impact Analysis
      let extractedImpact: { dependencyTree: string; riskLevel: "Low" | "Medium" | "High"; filesAffected: number; breakingAreas: string[]; unchangedFiles: string[]; } | null = null;
      const impactMatch = assistantContent.match(/## Impact Analysis\n([\s\S]*?)(?=\n## |\n```file|\n```diff|$)/);
      if (impactMatch) {
        const impactText = impactMatch[1];
        const treeMatch = impactText.match(/### Dependency Tree\n```\n([\s\S]*?)```/);
        const riskMatch = impactText.match(/Risk Level:\s*(Low|Medium|High)/i);
        const filesMatch = impactText.match(/Files Affected:\s*(\d+)/);
        const breakingMatch = impactText.match(/### Possible Breaking Areas?\n([\s\S]*?)(?=\n###|\n$)/);
        const unchangedMatch = impactText.match(/### Files That Will NOT Change\n([\s\S]*?)$/);

        const dependencyTree = treeMatch?.[1]?.trim() || "";
        const riskLevel = (riskMatch?.[1] as "Low" | "Medium" | "High") || "Medium";
        const filesAffected = parseInt(filesMatch?.[1] || "0");
        const breakingAreas = breakingMatch
          ? breakingMatch[1].split("\n").filter(line => line.trim().startsWith("✓")).map(line => line.replace(/^✓\s*/, "").trim())
          : [];
        const unchangedFiles = unchangedMatch
          ? unchangedMatch[1].split("\n").filter(line => line.trim().startsWith("-")).map(line => line.replace(/^-\s*/, "").trim())
          : [];

        if (dependencyTree || filesAffected > 0) {
          extractedImpact = { dependencyTree, riskLevel, filesAffected, breakingAreas, unchangedFiles };
          assistantContent = assistantContent.replace(impactMatch[0], "").trim();
        }
      }
      setImpactData(extractedImpact);

      // ── Extract Error Scan section ───────────
      let extractedErrorScan: { totalErrors: number; errors: { file: string; line: number; message: string }[]; fixPlan: { file: string; action: string }[] } | null = null;
      const errorScanMatch = assistantContent.match(/## Error Scan\n([\s\S]*?)(?=\n## |\n```|$)/);
      if (errorScanMatch) {
        const scanText = errorScanMatch[1];
        const totalMatch = scanText.match(/Total errors found:\s*(\d+)/);
        const errorListMatch = scanText.match(/### Error List?\n([\s\S]*?)(?=\n###|\n##|$)/);
        const fixPlanMatch = scanText.match(/### Fix Plan?\n([\s\S]*?)$/);

        const errors: { file: string; line: number; message: string }[] = [];
        if (errorListMatch) {
          const lines = errorListMatch[1].split("\n");
          for (const line of lines) {
            const match = line.match(/-\s*\[([^:]+):(\d+)\]\s*(.+)/);
            if (match) errors.push({ file: match[1], line: parseInt(match[2]), message: match[3].trim() });
          }
        }

        const fixPlan: { file: string; action: string }[] = [];
        if (fixPlanMatch) {
          const lines = fixPlanMatch[1].split("\n");
          for (const line of lines) {
            const match = line.match(/\d+\.\s*\*\*(.+?)\*\*\s*→\s*(.+)/);
            if (match) fixPlan.push({ file: match[1].trim(), action: match[2].trim() });
          }
        }

        const totalErrors = parseInt(totalMatch?.[1] || "0");
        if (totalErrors > 0 || errors.length > 0) {
          extractedErrorScan = { totalErrors, errors, fixPlan };
          assistantContent = assistantContent.replace(errorScanMatch[0], "").trim();
        }
      }
      setErrorScanData(extractedErrorScan);

      // ── Extract Code Review section ───────────
      const reviewMatch = assistantContent.match(/## Code Review Results\n([\s\S]*?)(?=\n## |\n```|$)/);
      let extractedReview: ReviewResult | null = null;
      if (reviewMatch) {
        const text = reviewMatch[1];
        const securityMatch = text.match(/Security\s+(\d+)/);
        const perfMatch = text.match(/Performance\s+(\d+)/);
        const archMatch = text.match(/Architecture\s+(\d+)/);
        const maintMatch = text.match(/Maintainability\s+(\d+)/);
        const overallMatch = text.match(/Overall Score:\s*(\d+)/);
        const issueLines = text.match(/### Issues Found\n([\s\S]*?)$/);

        const issues: { type: "warning" | "suggestion" | "info"; message: string }[] = [];
        if (issueLines) {
          const lines = issueLines[1].split("\n");
          for (const line of lines) {
            const warnMatch = line.match(/\*\*Warning:\*\*\s*(.+)/);
            const suggMatch = line.match(/\*\*Suggestion:\*\*\s*(.+)/);
            const infoMatch = line.match(/\*\*Info:\*\*\s*(.+)/);
            if (warnMatch) issues.push({ type: "warning", message: warnMatch[1] });
            else if (suggMatch) issues.push({ type: "suggestion", message: suggMatch[1] });
            else if (infoMatch) issues.push({ type: "info", message: infoMatch[1] });
          }
        }

        extractedReview = {
          security: parseInt(securityMatch?.[1] || "0"),
          performance: parseInt(perfMatch?.[1] || "0"),
          architecture: parseInt(archMatch?.[1] || "0"),
          maintainability: parseInt(maintMatch?.[1] || "0"),
          overall: parseInt(overallMatch?.[1] || "0"),
          issues,
        };
        assistantContent = assistantContent.replace(reviewMatch[0], "").trim();
      }
      setReviewData(extractedReview);

      // Extract file blocks
      const fileRegex = /```file\npath: (.*?)\ncontent:\n([\s\S]*?)```/g;
      const rawFileBlocks: { path: string; content: string }[] = [];
      let match;
      while ((match = fileRegex.exec(assistantContent)) !== null) {
        rawFileBlocks.push({ path: match[1].trim(), content: match[2].trim() });
      }

      // Extract diff blocks
      const diffRegex = /```diff\npath: (.*?)\ncontent:\n([\s\S]*?)```/g;
      const rawDiffBlocks: { path: string; content: string }[] = [];
      while ((match = diffRegex.exec(assistantContent)) !== null) {
        rawDiffBlocks.push({ path: match[1].trim(), content: match[2].trim() });
      }

      // Fallback code fence extraction
      if (rawFileBlocks.length === 0 && rawDiffBlocks.length === 0) {
        const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let codeMatch;
        let codeIndex = 0;
        while ((codeMatch = codeRegex.exec(assistantContent)) !== null) {
          const language = codeMatch[1] || 'txt';
          const content = codeMatch[2].trim();
          if (content.split('\n').length > 3) {
            rawFileBlocks.push({
              path: `generated_code_${codeIndex + 1}.${language}`,
              content,
            });
            codeIndex++;
          }
        }
      }

      // Merge file and diff blocks into a single typed array
      const allBlocks: FileBlock[] = [
        ...rawFileBlocks.map(f => ({ path: f.path, content: f.content, status: "pending" as const, type: "file" as const })),
        ...rawDiffBlocks.map(d => ({ path: d.path, content: d.content, status: "pending" as const, type: "diff" as const })),
      ];

      // Auto‑import & cleanup (only for full file blocks; skip diffs)
      const exportIndex = buildExportIndexFromFiles(allFiles || {});
      const processedBlocks: FileBlock[] = allBlocks.map(block => {
        if (block.type === "diff") return block;
        const { content: importedContent } = autoImportFile(block.content, block.path, exportIndex);
        const cleaned = cleanupImports(importedContent);
        return { ...block, content: cleaned };
      });

      // Validate full file blocks (diffs are excluded from this check)
      const fullBlocksToValidate = processedBlocks.filter(b => b.type !== "diff").map(b => ({ path: b.path, content: b.content }));
      const { errors } = validatePatch(fullBlocksToValidate, allFiles || {});
      setValidationErrors(errors);
      const finalBlocks = processedBlocks.map(block => {
        if (block.type === "diff") return block;
        const blockErrors = errors.filter(e => e.file === block.path);
        return blockErrors.length > 0
          ? { ...block, status: "error" as const, errors: blockErrors }
          : block;
      });

      // Detect placeholder filenames
      const placeholderPattern = /^(generated_|code_|new_file|file_|untitled_)/i;
      const renamedBlocks = finalBlocks.map(f => {
        const name = f.path.split("/").pop() || "";
        if (placeholderPattern.test(name)) {
          return { ...f, path: `⚠️ Please rename: ${f.path}`, _needsRename: true };
        }
        return f;
      });

      // Extract shell commands
      const commandRegex = /```bash\n# risk: (low|medium|high|blocked)\n([\s\S]*?)```/g;
      const extractedCommands: CommandBlock[] = [];
      let cmdMatch;
      while ((cmdMatch = commandRegex.exec(assistantContent)) !== null) {
        extractedCommands.push({
          command: cmdMatch[2].trim(),
          risk: cmdMatch[1] as "low" | "medium" | "high" | "blocked",
          status: "pending",
        });
      }
      if (extractedCommands.length > 0) {
        setPendingCommands(extractedCommands);
        setShowCommands(true);
        assistantContent = assistantContent.replace(/```bash\n# risk: .*\n[\s\S]*?```/g, "").trim();
      }

      if (renamedBlocks.length > 0) {
        setPendingFiles(renamedBlocks);
        setShowApproval(true);

        const cleanContent = assistantContent
          .replace(/```(file|diff)[\s\S]*?```/g, "")
          .replace(/```[\s\S]*?```/g, "[Code moved to approval card]")
          .trim();

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: cleanContent };
          return updated;
        });
      } else {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
      }
    } catch (error: any) {
      console.error(error);
      setIsThinking(false);
      setPipelineSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
      if (error.message === "Unauthorized") {
        setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Session expired. Please reload the page." }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Request failed. Please try again." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const userMsgs = messages.filter(m => m.role === "user");
    const lastUserMsg = userMsgs[userMsgs.length - 1];
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
      handleSend();
    }
  };

  const shellCodeBlock = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      if (!inline && match && ["sh", "bash", "powershell", "zsh"].includes(match[1])) {
        const codeString = String(children).replace(/\n$/, "");
        return (
          <div className="relative my-2 rounded-md bg-[#2d2d2d] p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 uppercase">{match[1]}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeString)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Copy
              </button>
            </div>
            <pre className="code-block text-gray-200 font-mono whitespace-pre-wrap">{codeString}</pre>
          </div>
        );
      }
      return <code className={className} {...props}>{children}</code>;
    },
  };

  const modes: Mode[] = ["ask", "plan", "agent"];

  return (
    <div className="h-full flex flex-col border-l border-gray-700 bg-[#1e1e1e]">
      <style>{`
        .chat-message { font-size: 14px; line-height: 1.7; color: #d4d4d4; }
        .chat-input { font-size: 14px; }
        .chat-header { font-size: 12px; font-weight: 600; }
        .code-block { font-size: 13px; font-family: Consolas, Monaco, monospace; }
      `}</style>

      <div className="h-8 border-b border-[#2d2d2d] flex items-center px-3 bg-[#181818] text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        AI Agent
        <button
          onClick={handleGenerateCommit}
          className="ml-auto px-2 py-1 text-xs bg-[#2d2d3d] text-gray-400 hover:text-white rounded"
          title="Generate commit message"
        >
          <GitCommit size={14} />
        </button>
      </div>

      <div className="chat-header flex gap-1 p-2 border-b border-gray-700">
        {modes.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded text-xs font-medium capitalize ${
              mode === m ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, i) => {
          const isLastAssistant = msg.role === "assistant" && i === messages.length - 1;

          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-blue-600 text-white text-sm">
                  <ReactMarkdown components={shellCodeBlock}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            );
          }

          const isError = msg.content.startsWith("⚠️");
          return (
            <div key={i} className="chat-message my-2 max-w-full text-sm text-gray-200">
              {mode === "plan" ? (
                <div className="w-full p-4 bg-[#252526] border border-[#3c3c3c] rounded-lg">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Plan</h3>
                  <ReactMarkdown components={shellCodeBlock}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <ReactMarkdown components={shellCodeBlock}>{msg.content}</ReactMarkdown>
              )}
              {isError && (
                <button onClick={handleRetry} className="mt-1 text-xs text-blue-400 hover:underline">
                  Retry
                </button>
              )}

              {/* Cards in order: Review → Error Scan → Impact → Rename → Plan → File Approval */}
              {isLastAssistant && reviewData && (
                <ReviewCard review={reviewData} onDismiss={() => setReviewData(null)} />
              )}

              {isLastAssistant && errorScanData && (
                <ErrorFixCard
                  totalErrors={errorScanData.totalErrors}
                  errors={errorScanData.errors}
                  fixPlan={errorScanData.fixPlan}
                  onApprove={() => setErrorScanData(null)}
                  onReject={() => setErrorScanData(null)}
                />
              )}

              {isLastAssistant && impactData && (
                <ImpactViewCard
                  dependencyTree={impactData.dependencyTree}
                  riskLevel={impactData.riskLevel}
                  filesAffected={impactData.filesAffected}
                  breakingAreas={impactData.breakingAreas}
                  unchangedFiles={impactData.unchangedFiles}
                />
              )}

              {isLastAssistant && renamePreview && (
                <RenamePreviewCard
                  oldName={renamePreview.oldName}
                  newName={renamePreview.newName}
                  totalFiles={renamePreview.totalFiles}
                  totalOccurrences={renamePreview.totalOccurrences}
                  importChanges={renamePreview.importChanges}
                  exportChanges={renamePreview.exportChanges}
                  onApprove={() => setRenamePreview(null)}
                  onReject={() => {
                    setRenamePreview(null);
                    setPendingFiles([]);
                    setShowApproval(false);
                  }}
                />
              )}

              {isLastAssistant && showApproval && planSummary && (
                <div className="mt-2 p-3 bg-[#1a1a2e] border border-[#3c3c4c] rounded-lg text-sm text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <File size={16} className="text-blue-400" />
                    <span className="font-medium">Implementation Plan</span>
                  </div>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-gray-400 text-xs my-1">{children}</p>,
                      li: ({ children }) => <li className="text-gray-300 text-xs ml-4 list-disc">{children}</li>,
                    }}
                  >
                    {planSummary}
                  </ReactMarkdown>
                </div>
              )}

              {isLastAssistant && showApproval && (
                <FileApprovalCard
                  files={pendingFiles}
                  onAcceptFile={handleAcceptFile}
                  onRejectFile={handleRejectFile}
                  onConfirmFile={handleConfirmFile}
                  confirmingFile={confirmingFile}
                  onCommit={handleCommit}
                  commitEnabled={pendingFiles.some(f => f.status === "accepted")}
                  validationErrors={validationErrors}
                />
              )}
            </div>
          );
        })}

        {showCommit && commitMessages && (
          <CommitCard
            mainMessage={commitMessages.main}
            alternatives={commitMessages.alternatives}
            onSelect={handleSelectCommit}
            onCancel={() => setShowCommit(false)}
          />
        )}

        {showCommands && pendingCommands.length > 0 && (
          <CommandApprovalCard
            commands={pendingCommands}
            onApprove={(cmd) => {
              navigator.clipboard.writeText(cmd);
              setPendingCommands(prev => prev.map(c => c.command === cmd ? { ...c, status: "approved" } : c));
            }}
            onReject={(cmd) => {
              setPendingCommands(prev => prev.map(c => c.command === cmd ? { ...c, status: "rejected" } : c));
            }}
          />
        )}

        {(isLoading || isThinking) && (
          <AgentPipeline
            steps={pipelineSteps}
            expanded={pipelineExpanded}
            onToggle={() => setPipelineExpanded(!pipelineExpanded)}
          />
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="p-2 border-t border-gray-700">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Ask ${mode === "plan" ? "to plan" : mode === "agent" ? "agent to act" : "a question"}...`}
            className="chat-input min-h-[40px] bg-gray-800 border-gray-700 text-white resize-none"
            rows={1}
          />
          <Button onClick={handleSend} disabled={isLoading} size="icon" className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Local commit prompt generator ────────────────
function buildCommitPrompt(changes: string): string {
  return `You are a coding assistant generating a Git commit message.

## Project Changes
${changes}

## Instructions
- Generate ONE concise semantic commit message following the format:
  type(scope): brief description
- Types: feat, fix, refactor, style, docs, test, chore
- Keep the subject line under 72 characters.
- If needed, add a body with bullet points of key changes.
- Then provide 2-3 alternative commit messages with different wording or scope.

## Output Format
Main:
feat(auth): add JWT authentication flow

Alternatives:
feat(security): implement JWT session handling
feat(auth): add login and register endpoints

Return EXACTLY in this format. No other text.`;
}