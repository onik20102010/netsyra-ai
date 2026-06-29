"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { Copy, Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

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

// ── Robust AI‑generated Mermaid sanitizer ──────────
function sanitizeMermaid(code: string): string {
  return code
    .replace(/subgraph\s+(\w+)\s*\(([^)]*)\)/g, 'subgraph $1["$2"]')
    .replace(/`/g, "")
    .replace(/“|”/g, '"')
    .replace(/‘|’/g, "'")
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
  const [error, setError] = useState<string | null>(null);
  const [svgCode, setSvgCode] = useState<string>("");
  const lastChartRef = useRef("");

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
const handleWheel = useCallback(
  (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // do nothing → allow page scroll
    e.preventDefault(); // prevent page scroll only when zooming
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      scaleRef.current = Math.min(
        3,
        Math.max(0.3, scaleRef.current + (e.deltaY > 0 ? -0.1 : 0.1))
      );
      applyTransform();
    });
  },
  [applyTransform]
);

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
      e.preventDefault();
      if (e.touches.length === 1 && isDragging.current) {
        const dx = e.touches[0].clientX - lastMouse.current.x;
        const dy = e.touches[0].clientY - lastMouse.current.y;
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        translateRef.current = {
          x: translateRef.current.x + dx,
          y: translateRef.current.y + dy,
        };
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(applyTransform);
      } else if (e.touches.length === 2) {
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

  // ── Render & attach wheel listener ─────────────────
  useEffect(() => {
    if (chart === lastChartRef.current) return;
    lastChartRef.current = chart;
    setError(null);
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
      .catch((err) => {
        console.error("Mermaid render error:", err);
        setError(chart);
      });

    const outerEl = outerRef.current;
    if (outerEl) {
      outerEl.addEventListener("wheel", handleWheel, { passive: false });
      return () => outerEl.removeEventListener("wheel", handleWheel);
    }
  }, [chart, handleWheel, resetView]);

  // ── Error fallback (DeepSeek dark panel) ───────────
  if (error) {
    return (
      <div className="my-4 rounded-xl overflow-hidden border border-amber-600/40 bg-[#1a1a1a] shadow-xl">
        <div className="px-4 py-2 bg-amber-900/30 border-b border-amber-600/40 text-xs font-medium text-amber-400 uppercase tracking-wide flex items-center gap-2">
          <span>⚠ Mermaid Diagram (invalid syntax – raw code)</span>
          <button
            onClick={copyCode}
            className="ml-auto text-amber-400/80 hover:text-amber-300 transition-colors"
            title="Copy raw code"
          >
            <Copy size={14} />
          </button>
        </div>
        <pre className="text-sm text-gray-300 p-4 whitespace-pre-wrap font-mono">{error}</pre>
      </div>
    );
  }

  // ── DeepSeek‑style diagram container ───────────────
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-700/50 bg-[#0f0f0f] shadow-2xl backdrop-blur-sm">
      {/* Toolbar with zoom in/out */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/60 border-b border-gray-700/30">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          Mermaid Diagram
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
          {/* ── Zoom buttons ── */}
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
          {/* ── Reset ── */}
          <button
            onClick={resetView}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            title="Reset zoom & pan"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Pan/zoom viewport */}
      <div
        ref={outerRef}
        className="overflow-auto cursor-grab relative"
        style={{
          maxHeight: "800px",
          touchAction: "none",
          willChange: "transform",
          background: "radial-gradient(circle at center, #1a1a1a 0%, #0f0f0f 70%)",
        }}
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
          style={{ willChange: "transform" }}
        />
      </div>
    </div>
  );
}