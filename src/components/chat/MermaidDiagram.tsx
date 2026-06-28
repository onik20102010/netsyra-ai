"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";

// ── Large, crisp, colourful theme ──────────────────
mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  fontSize: 18,                     // even larger text
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

// ── Sanitise AI‑generated Mermaid ─────────────────
function sanitizeMermaid(code: string): string {
  return code
    // subgraph UI_Layer (UI Layer) → subgraph UI_Layer["UI Layer"]
    .replace(/subgraph\s+(\w+)\s*\(([^)]*)\)/g, 'subgraph $1["$2"]')
    .replace(/"([^"]*)"/g, "$1")    // remove double quotes inside labels
    .replace(/`/g, "");            // remove stray backticks
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const lastChartRef = useRef("");

  // ── Apply transform to DOM (no state re‑render) ──
  const applyTransform = useCallback(() => {
    if (!innerRef.current) return;
    const { x, y } = translateRef.current;
    const s = scaleRef.current;
    innerRef.current.style.transform = `scale(${s}) translate(${x / s}px, ${y / s}px)`;
  }, []);

  // ── Wheel zoom (throttled) ────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        scaleRef.current = Math.min(3, Math.max(0.5, scaleRef.current + (e.deltaY > 0 ? -0.1 : 0.1)));
        applyTransform();
      });
    },
    [applyTransform]
  );

  // ── Mouse pan ─────────────────────────────────────
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

  // ── Touch handlers (pan + pinch) ──────────────────
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
        scaleRef.current = Math.min(3, Math.max(0.5, scaleRef.current * ratio));
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(applyTransform);
      }
    },
    [applyTransform]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Render SVG once, then make it sharp & large ────
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
        if (innerRef.current) {
          innerRef.current.innerHTML = svg;

          const svgEl = innerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.removeAttribute("width");
            svgEl.removeAttribute("height");
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
            svgEl.style.minWidth = "500px";            // ensure it's never too small
            svgEl.style.width = "100%";
            svgEl.style.imageRendering = "auto";       // crisp vectors
            svgEl.setAttribute("shape-rendering", "geometricPrecision");
            svgEl.setAttribute("text-rendering", "optimizeLegibility");
          }

          scaleRef.current = 1;
          translateRef.current = { x: 0, y: 0 };
          applyTransform();
        }
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
        setError(chart);
      });
  }, [chart, applyTransform]);

  // ── Error fallback ────────────────────────────────
  if (error) {
    return (
      <div className="my-4 rounded-xl overflow-hidden border border-amber-500 bg-[#1e1e1e]">
        <div className="px-4 py-2 bg-amber-900/30 border-b border-amber-500 text-xs font-medium text-amber-400 uppercase">
          Mermaid Diagram (invalid syntax – showing raw code)
        </div>
        <pre className="text-sm text-gray-300 p-4 whitespace-pre-wrap font-mono">{error}</pre>
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      className="overflow-auto cursor-grab relative"
      style={{ maxHeight: "800px", touchAction: "none", willChange: "transform" }}
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
        style={{ willChange: "transform" }}
      />
    </div>
  );
}