"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { Copy, Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

// ── Suppress ALL Mermaid console noise (warn + error) ──
const originalWarn = console.warn;
const originalError = console.error;
console.warn = (msg: any, ...args: any[]) => {
  if (typeof msg === "string" && /mermaid|syntax error/i.test(msg)) return;
  originalWarn(msg, ...args);
};
console.error = (msg: any, ...args: any[]) => {
  if (typeof msg === "string" && /mermaid|syntax error/i.test(msg)) return;
  originalError(msg, ...args);
};

// ── One‑time, crisp Mermaid config ─────────────────
let mermaidInitialized = false;
if (!mermaidInitialized) {
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "loose",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    fontSize: 16,
    flowchart: { useMaxWidth: false },
    themeVariables: {
      primaryColor: "#4A90D9",
      primaryTextColor: "#ffffff",
      primaryBorderColor: "#2C5F8A",
      lineColor: "#F39C12",
      secondaryColor: "#27AE60",
      tertiaryColor: "#E74C3C",
      nodeBorder: "#F39C12",
      edgeLabelBackground: "#FFF3E0",
      clusterBkg: "#F4F6F8",
      clusterBorder: "#BDC3C7",
      mainBkg: "#F4F6F8",
      nodeTextColor: "#2C3E50",
    },
  });
  mermaidInitialized = true;
}

// ── Sanitize AI‑generated Mermaid ──────────
function sanitizeMermaid(code: string): string {
  return code
    .replace(/subgraph\s+(\w+)\s*\(([^)]*)\)/g, 'subgraph $1["$2"]')
    .replace(/`/g, "")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[()]/g, "")
    .trim();
}

// ── SVG processing: make it scalable & crisp ───────
function processSvg(svgString: string): string {
  const div = document.createElement("div");
  div.innerHTML = svgString;
  const svg = div.querySelector("svg");
  if (svg) {
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.maxWidth = "100%";
    svg.style.height = "auto";
    svg.style.minWidth = "480px";
    svg.style.width = "100%";
    svg.style.imageRendering = "auto";
    svg.setAttribute("shape-rendering", "geometricPrecision");
    svg.setAttribute("text-rendering", "optimizeLegibility");
    // Explicit background prevents transparent-SVG flashing during scroll repaints
    svg.style.backgroundColor = "#0f0f0f";
  }
  return div.innerHTML;
}

// ── Main component ─────────────────────────────────
export default function MermaidDiagram({ chart }: { chart: string }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const [svgCode, setSvgCode] = useState<string>("");
  const lastChartRef = useRef("");

  // ── Remove any stray Mermaid error divs from the DOM (one-shot, no observer) ──
  useEffect(() => {
    document.querySelectorAll(".mermaid-error").forEach((el) => el.remove());
  }, [chart]);

  // ── DOM transform (no state re‑render) ─────────────
  const applyTransform = useCallback(() => {
    if (!innerRef.current) return;
    const { x, y } = translateRef.current;
    const s = scaleRef.current;
    innerRef.current.style.transform = `scale(${s}) translate(${x / s}px, ${y / s}px)`;
  }, []);

  // ── Zoom in / out (buttons) ────────────────────────
  const zoomIn = useCallback(() => {
    scaleRef.current = Math.min(3, scaleRef.current + 0.2);
    applyTransform();
  }, [applyTransform]);

  const zoomOut = useCallback(() => {
    scaleRef.current = Math.max(0.3, scaleRef.current - 0.2);
    applyTransform();
  }, [applyTransform]);

  // ── Reset view ────────────────────────────────────
  const resetView = useCallback(() => {
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
    applyTransform();
  }, [applyTransform]);

  // ── Wheel handler – zoom only with Ctrl/Cmd, otherwise allow normal scroll ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      scaleRef.current = Math.min(3, Math.max(0.3, scaleRef.current + (e.deltaY > 0 ? -0.1 : 0.1)));
      applyTransform();
    });
  }, [applyTransform]);

  // ── Mouse pan ──────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    if (outerRef.current) outerRef.current.style.cursor = "grabbing";
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      translateRef.current = {
        x: translateRef.current.x + dx,
        y: translateRef.current.y + dy,
      };
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(applyTransform);
    },
    [applyTransform]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (outerRef.current) outerRef.current.style.cursor = "grab";
  }, []);

  // ── Touch handlers (pan + pinch) ───────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastMouse.current = { x: dist, y: 0 };
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Only preventDefault for pinch-zoom (2 fingers), NOT single-finger pan
      // This allows normal chat scrolling on mobile when finger is over the diagram
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / lastMouse.current.x;
        scaleRef.current = Math.min(3, Math.max(0.3, scaleRef.current * ratio));
        lastMouse.current = { x: dist, y: 0 };
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(applyTransform);
      }
    },
    [applyTransform]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Copy Mermaid code ──────────────────────────────
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(chart).catch(() => {});
  }, [chart]);

  // ── Download SVG ──────────────────────────────────
  const downloadSvg = useCallback(() => {
    if (!svgCode) return;
    const blob = new Blob([svgCode], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [svgCode]);

  // ── Render diagram ─────────────────────────────────
  useEffect(() => {
    if (chart === lastChartRef.current) return;
    lastChartRef.current = chart;
    setSvgCode("");
    if (!innerRef.current) return;

    const sanitized = sanitizeMermaid(chart.trim());
    const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    mermaid
      .render(id, sanitized)
      .then(({ svg }) => {
        const processed = processSvg(svg);
        if (innerRef.current) {
          innerRef.current.innerHTML = processed;
          setSvgCode(processed);
          resetView();
        }
      })
      .catch(() => {
        // Silent fail – no output, no console noise
        setSvgCode("");
      });
  }, [chart, resetView]);

  // ── DeepSeek‑style diagram container ───────────────
  return (
    <div
      className="my-4 rounded-xl overflow-hidden border border-gray-700/50 bg-[#0f0f0f] shadow-2xl"
      style={{
        contain: "layout style paint",
        isolation: "isolate",
        transform: "translateZ(0)",
      }}
    >
      {/* Toolbar with zoom in/out */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/60 border-b border-gray-700/30">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          For Example
        </span>
        <div className="flex gap-1">
          <button
            onClick={copyCode}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            title="Copy Mermaid code"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={downloadSvg}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            title="Download SVG"
          >
            <Download size={14} />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            title="Reset zoom & pan"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Pan/zoom viewport — NO nested scrolling */}
      <div
        ref={outerRef}
        className="cursor-grab relative"
        style={{
          minHeight: "200px",
          maxHeight: "600px",
          overflow: "hidden",
          touchAction: "pan-y pinch-zoom",
          background: "#0f0f0f",
          contain: "layout style paint",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={innerRef}
          className="mermaid-container inline-block origin-top-left"
        />
      </div>
    </div>
  );
}