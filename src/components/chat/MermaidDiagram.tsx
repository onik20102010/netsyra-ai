"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
});

function sanitizeMermaid(code: string): string {
  return code
    .replace(/\[([^\]]*)\]/g, "($1)")
    .replace(/"([^"]*)"/g, "$1")
    .replace(/\(\(/g, "(")
    .replace(/\)\)/g, ")");
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null); // inner div where SVG lives
  const outerRef = useRef<HTMLDivElement>(null);     // zoom/pan container
  const [error, setError] = useState<string | null>(null);
  const lastChartRef = useRef<string>("");

  // ── Zoom & Pan state ────────────────────────────────
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);
  const baseScale = useRef(1);

  // Reset transform when chart changes
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [chart]);

  // Render Mermaid SVG
  useEffect(() => {
    if (chart === lastChartRef.current) return;
    lastChartRef.current = chart;
    setError(null);

    if (!containerRef.current) return;

    const sanitized = sanitizeMermaid(chart.trim());
    const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    mermaid
      .render(id, sanitized)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
        setError(chart);
      });
  }, [chart]);

  // ── Wheel zoom ───────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(3, Math.max(0.5, prev + delta)));
  }, []);

  // ── Mouse pan ────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    if (outerRef.current) outerRef.current.style.cursor = "grabbing";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (outerRef.current) outerRef.current.style.cursor = "grab";
  }, []);

  // ── Touch handlers (pan + pinch) ──────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Pan
      isDragging.current = true;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Pinch
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDist.current = dist;
      baseScale.current = scale;
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / lastTouchDist.current;
      setScale(Math.min(3, Math.max(0.5, baseScale.current * ratio)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Error fallback ────────────────────────────────────
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
      className="overflow-hidden cursor-grab relative"
      style={{ maxHeight: "400px", touchAction: "none" }}
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
        ref={containerRef}
        className="mermaid-container inline-block"
        style={{
          transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
          transformOrigin: "0 0",
        }}
      />
    </div>
  );
}