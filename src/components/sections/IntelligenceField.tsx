"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { MessageSquare, Code, Search, FileText, Image as ImageIcon, Cpu, Globe, Bot } from "lucide-react";

interface PanelDef {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: string;
  accent: string;
  w: number;
  h: number;
}

interface PanelState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
}

const PANELS: PanelDef[] = [
  { id: "chat", icon: <MessageSquare className="w-3.5 h-3.5 text-blue-400" />, title: "Chat", subtitle: "Summarize this report", status: "Thinking...", accent: "blue", w: 150, h: 80 },
  { id: "research", icon: <FileText className="w-3.5 h-3.5 text-cyan-400" />, title: "Research", subtitle: "23 sources analyzed", status: "Active", accent: "cyan", w: 145, h: 75 },
  { id: "code", icon: <Code className="w-3.5 h-3.5 text-violet-400" />, title: "Code", subtitle: "Component generated", status: "Done", accent: "violet", w: 155, h: 72 },
  { id: "search", icon: <Search className="w-3.5 h-3.5 text-indigo-400" />, title: "Search", subtitle: "Searching web...", status: "Live", accent: "indigo", w: 140, h: 72 },
  { id: "images", icon: <ImageIcon className="w-3.5 h-3.5 text-blue-400" />, title: "Images", subtitle: "4 images generated", status: "Done", accent: "blue", w: 150, h: 85 },
  { id: "agent", icon: <Cpu className="w-3.5 h-3.5 text-violet-400" />, title: "Agent", subtitle: "Running task...", status: "Active", accent: "violet", w: 140, h: 72 },
  { id: "browser", icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />, title: "Browser", subtitle: "Page loaded", status: "Done", accent: "cyan", w: 135, h: 68 },
];

const MOBILE_PANELS = PANELS.slice(0, 4);

function accentColor(accent: string): string {
  const map: Record<string, string> = {
    blue: "rgb(59, 130, 246)",
    cyan: "rgb(34, 211, 238)",
    violet: "rgb(139, 92, 246)",
    indigo: "rgb(99, 102, 241)",
  };
  return map[accent] || "rgb(99, 102, 241)";
}

export default function IntelligenceField({ mobile = false }: { mobile?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const statesRef = useRef<PanelState[]>([]);
  const [ready, setReady] = useState(false);

  const panelList = mobile ? MOBILE_PANELS : PANELS;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Initialize panel states with deterministic positions and velocities
    const speedScale = mobile ? 0.25 : 0.35;
    statesRef.current = panelList.map((p, i) => {
      const cols = Math.ceil(Math.sqrt(panelList.length));
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = cw / cols;
      const cellH = ch / Math.ceil(panelList.length / cols);
      const x = col * cellW + (cellW - p.w) / 2;
      const y = row * cellH + (cellH - p.h) / 2;

      const angle = (i * 137.5) * (Math.PI / 180);
      const speed = speedScale * (0.6 + ((i * 7) % 5) / 10);
      return {
        x: Math.max(0, Math.min(x, cw - p.w)),
        y: Math.max(0, Math.min(y, ch - p.h)),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: p.w,
        h: p.h,
      };
    });

    setReady(true);

    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;
      const w = container.clientWidth;
      const h = container.clientHeight;

      const states = statesRef.current;

      for (let i = 0; i < states.length; i++) {
        const s = states[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // Bounce off edges
        if (s.x <= 0) {
          s.x = 0;
          s.vx = Math.abs(s.vx);
        } else if (s.x + s.w >= w) {
          s.x = w - s.w;
          s.vx = -Math.abs(s.vx);
        }

        if (s.y <= 0) {
          s.y = 0;
          s.vy = Math.abs(s.vy);
        } else if (s.y + s.h >= h) {
          s.y = h - s.h;
          s.vy = -Math.abs(s.vy);
        }

        // Simple separation: push apart if overlapping
        for (let j = i + 1; j < states.length; j++) {
          const o = states[j];
          const dx = s.x + s.w / 2 - (o.x + o.w / 2);
          const dy = s.y + s.h / 2 - (o.y + o.h / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = (s.w + o.w) / 2.5;
          if (dist < minDist && dist > 0.01) {
            const push = (minDist - dist) / dist * 0.5;
            s.x += dx * push * 0.02;
            s.y += dy * push * 0.02;
            o.x -= dx * push * 0.02;
            o.y -= dy * push * 0.02;
          }
        }

        // Apply position via translate3d for GPU acceleration
        const el = panelRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [panelList.length, mobile]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-3xl overflow-hidden border border-white/[0.06] bg-[#0A0A0B]/60 backdrop-blur-sm"
      style={{
        boxShadow: "inset 0 0 80px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.4)",
      }}
    >
      {/* Inner ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] rounded-full blur-[120px] opacity-[0.08] bg-blue-500/20" />
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] rounded-full blur-[100px] opacity-[0.06] bg-violet-500/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[150px] opacity-[0.04] bg-cyan-500/10" />
        {/* Mesh texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, rgba(99,102,241,0.4) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(139,92,246,0.3) 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* Floating Panels */}
      {panelList.map((panel, i) => (
        <div
          key={panel.id}
          ref={(el) => { panelRefs.current[i] = el; }}
          className="absolute top-0 left-0 will-change-transform"
          style={{
            width: panel.w,
            height: panel.h,
            opacity: ready ? 1 : 0,
            transition: "opacity 0.6s ease-out",
          }}
        >
          <div className="w-full h-full bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl p-3 flex flex-col justify-between hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300">
            {/* Header */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                {panel.icon}
              </div>
              <span className="text-[11px] font-medium text-white/70">{panel.title}</span>
            </div>
            {/* Content */}
            <div className="space-y-1">
              <p className="text-[10px] text-white/45 leading-tight truncate">{panel.subtitle}</p>
              <div className="flex items-center space-x-1">
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ background: accentColor(panel.accent), opacity: 0.6 }}
                />
                <span className="text-[9px] text-white/35">{panel.status}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
