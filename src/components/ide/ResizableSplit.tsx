"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeft, PanelRight, PanelBottom, PanelTop, GripVertical, GripHorizontal } from "lucide-react";

type Direction = "horizontal" | "vertical";

interface ResizableSplitProps {
  direction: Direction;
  first: React.ReactNode;
  second: React.ReactNode;
  defaultSplit?: number;
  minFirst?: number;
  minSecond?: number;
  showFirst?: boolean;
  showSecond?: boolean;
  onToggleFirst?: () => void;
  onToggleSecond?: () => void;
  onSplitChange?: (split: number) => void;
  firstPanelName?: string;
  secondPanelName?: string;
}

export function ResizableSplit({
  direction,
  first,
  second,
  defaultSplit = 20,
  minFirst = 10,
  minSecond = 10,
  showFirst = true,
  showSecond = true,
  onToggleFirst,
  onToggleSecond,
  onSplitChange,
  firstPanelName = "Panel",
  secondPanelName = "Panel",
}: ResizableSplitProps) {
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startSplitRef = useRef(split);
  const startPosRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startSplitRef.current = split;
    startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;
  }, [split, direction]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
      const startPos = startPosRef.current;
      const containerSize = direction === "horizontal" ? rect.width : rect.height;
      if (containerSize === 0) return;

      const deltaPct = ((currentPos - startPos) / containerSize) * 100;
      const next = direction === "horizontal" ? startSplitRef.current + deltaPct : startSplitRef.current - deltaPct;
      const clamped = Math.max(minFirst, Math.min(100 - minSecond, next));
      setSplit(clamped);
      onSplitChange?.(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, direction, minFirst, minSecond, onSplitChange]);

  const isHorizontal = direction === "horizontal";
  const firstFlex = showFirst ? split : 0;
  const secondFlex = showSecond ? 100 - split : 0;

  return (
    <div
      ref={containerRef}
      className={`relative flex overflow-hidden ${isHorizontal ? "flex-row" : "flex-col"} w-full h-full`}
      style={{ cursor: isDragging ? (isHorizontal ? "col-resize" : "row-resize") : undefined }}
    >
      <AnimatePresence initial={false}>
        {showFirst && (
          <motion.div
            key="first"
            initial={{ opacity: 0, flexBasis: "0%" }}
            animate={{ opacity: 1, flexBasis: `${firstFlex}%` }}
            exit={{ opacity: 0, flexBasis: "0%" }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex-shrink-0 flex-grow-0 overflow-hidden min-w-0 min-h-0"
          >
            {first}
          </motion.div>
        )}
      </AnimatePresence>

      {showFirst && showSecond && (
        <div
          className={`flex-shrink-0 flex items-center justify-center bg-ide-border/40 hover:bg-ide-border z-ide-panel transition-colors ${
            isHorizontal ? "w-1.5 cursor-col-resize flex-col" : "h-1.5 cursor-row-resize flex-row"
          }`}
          onMouseDown={handleMouseDown}
          title={`Resize ${firstPanelName} / ${secondPanelName}`}
        >
          <div className="text-ide-foreground-dim opacity-50">
            {isHorizontal ? <GripVertical size={10} /> : <GripHorizontal size={10} />}
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {showSecond && (
          <motion.div
            key="second"
            initial={{ opacity: 0, flexBasis: "0%" }}
            animate={{ opacity: 1, flexBasis: `${secondFlex}%` }}
            exit={{ opacity: 0, flexBasis: "0%" }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex-shrink-0 flex-grow-0 overflow-hidden min-w-0 min-h-0"
          >
            {second}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggles */}
      {!showFirst && onToggleFirst && (
        <button
          onClick={onToggleFirst}
          className="absolute z-ide-floating flex items-center justify-center p-1 bg-ide-surface border border-ide-border rounded hover:bg-ide-surface-hover text-ide-foreground-muted"
          style={{ [isHorizontal ? "left" : "top"]: 0, [isHorizontal ? "top" : "left"]: 8 }}
          title={`Show ${firstPanelName}`}
        >
          {isHorizontal ? <PanelLeft size={14} /> : <PanelTop size={14} />}
        </button>
      )}
      {!showSecond && onToggleSecond && (
        <button
          onClick={onToggleSecond}
          className="absolute z-ide-floating flex items-center justify-center p-1 bg-ide-surface border border-ide-border rounded hover:bg-ide-surface-hover text-ide-foreground-muted"
          style={{ [isHorizontal ? "right" : "bottom"]: 0, [isHorizontal ? "top" : "left"]: 8 }}
          title={`Show ${secondPanelName}`}
        >
          {isHorizontal ? <PanelRight size={14} /> : <PanelBottom size={14} />}
        </button>
      )}
    </div>
  );
}
