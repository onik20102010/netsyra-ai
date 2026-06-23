// app/about/page.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as THREE from "three";

// ── Animation variants ────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 25 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

// ── Data ──────────────────────────────────────────────────
const features = [
  {
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    title: "Intelligent Routing",
    desc: "Real‑time analysis of complexity, cost, latency, and context to select the optimal model for every request.",
  },
  {
    icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    title: "Cost Optimization",
    desc: "Automatically routes routine queries to lightweight models, saving up to 70% on AI costs without sacrificing quality.",
  },
  {
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    title: "Privacy First",
    desc: "Per‑user encryption, secure conversation storage, and intelligent memory that learns about you without compromising privacy.",
  },
  {
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    title: "Real‑Time Web Search",
    desc: "Live queries trigger instant web searches, delivering current information alongside AI reasoning for up‑to‑date answers.",
  },
  {
    icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    title: "Developer‑First API",
    desc: "Clean, RESTful endpoints with drop‑in integration for existing workflows. No complex configuration required.",
  },
  {
    icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z",
    title: "Blazing Fast",
    desc: "Optimized infrastructure and intelligent caching deliver responses in under 7 seconds — often much less.",
  },
];

const stats = [
  { number: "70%", label: "Average Cost Savings" },
  { number: "<7s", label: "Avg. Response Time" },
  { number: "50+", label: "AI Models Integrated" },
  { number: "99.9%", label: "Uptime Reliability" },
];

export default function AboutPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Three.js 3D Particle Nebula Background ──────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambient = new THREE.AmbientLight(0x222244, 0.3);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0x6c5ce7, 0.6);
    dirLight.position.set(3, 5, 8);
    scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0x00b4d8, 0.4);
    dirLight2.position.set(-4, -2, 6);
    scene.add(dirLight2);

    // Floating geometric shapes
    const shapes: THREE.Mesh[] = [];

    const icoGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const icoMat = new THREE.MeshPhysicalMaterial({
      color: 0x6c5ce7,
      emissive: 0x3d2d8a,
      emissiveIntensity: 0.15,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.25,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    ico.position.set(-3.5, 0.5, -2);
    scene.add(ico);
    shapes.push(ico);

    const torusGeo = new THREE.TorusGeometry(1.4, 0.25, 16, 60);
    const torusMat = new THREE.MeshPhysicalMaterial({
      color: 0x00b4d8,
      emissive: 0x006a8a,
      emissiveIntensity: 0.12,
      metalness: 0.2,
      roughness: 0.5,
      transparent: true,
      opacity: 0.2,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(4, -0.5, -1);
    torus.rotation.x = Math.PI / 3;
    scene.add(torus);
    shapes.push(torus);

    const octGeo = new THREE.OctahedronGeometry(1.0);
    const octMat = new THREE.MeshPhysicalMaterial({
      color: 0xfd79a8,
      emissive: 0x6d2a4a,
      emissiveIntensity: 0.1,
      metalness: 0.1,
      roughness: 0.6,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const oct = new THREE.Mesh(octGeo, octMat);
    oct.position.set(-1.5, -1.8, 2);
    scene.add(oct);
    shapes.push(oct);

    const dodGeo = new THREE.DodecahedronGeometry(0.9);
    const dodMat = new THREE.MeshPhysicalMaterial({
      color: 0xfdcb6e,
      emissive: 0x6d5a2a,
      emissiveIntensity: 0.08,
      metalness: 0.1,
      roughness: 0.5,
      transparent: true,
      opacity: 0.15,
    });
    const dod = new THREE.Mesh(dodGeo, dodMat);
    dod.position.set(2.5, 1.8, 1);
    scene.add(dod);
    shapes.push(dod);

    // Particles (nebula style)
    const particleCount = 2500;
    const posArray = new Float32Array(particleCount * 3);
    const colorsArray = new Float32Array(particleCount * 3);
    const colorPalette = [
      new THREE.Color(0x6c5ce7),
      new THREE.Color(0x00b4d8),
      new THREE.Color(0xfd79a8),
      new THREE.Color(0xfdcb6e),
      new THREE.Color(0x00b894),
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = 6 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      posArray[i * 3 + 2] = radius * Math.cos(phi) * 0.5;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colorsArray[i * 3] = c.r;
      colorsArray[i * 3 + 1] = c.g;
      colorsArray[i * 3 + 2] = c.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Subtle connecting lines
    const lineCount = 80;
    const linePositions = new Float32Array(lineCount * 6);
    for (let i = 0; i < lineCount; i++) {
      const r1 = 4 + Math.random() * 6;
      const t1 = Math.random() * Math.PI * 2;
      const p1 = Math.acos(2 * Math.random() - 1);
      const r2 = 4 + Math.random() * 6;
      const t2 = Math.random() * Math.PI * 2;
      const p2 = Math.acos(2 * Math.random() - 1);

      linePositions[i * 6] = r1 * Math.sin(p1) * Math.cos(t1);
      linePositions[i * 6 + 1] = r1 * Math.sin(p1) * Math.sin(t1) * 0.6;
      linePositions[i * 6 + 2] = r1 * Math.cos(p1) * 0.4;
      linePositions[i * 6 + 3] = r2 * Math.sin(p2) * Math.cos(t2);
      linePositions[i * 6 + 4] = r2 * Math.sin(p2) * Math.sin(t2) * 0.6;
      linePositions[i * 6 + 5] = r2 * Math.cos(p2) * 0.4;
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x6c5ce7, transparent: true, opacity: 0.04 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Mouse tracking
    let mouseX = 0,
      mouseY = 0,
      targetX = 0,
      targetY = 0;

    const handleMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouse);

    const resize = () => {
      const w = window.innerWidth,
        h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", resize);

    let t = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      t += 0.002;
      targetX += (mouseX - targetX) * 0.03;
      targetY += (mouseY - targetY) * 0.03;

      shapes.forEach((shape, i) => {
        shape.rotation.x += 0.002 * (i + 1);
        shape.rotation.y += 0.003 * (i + 1);
        shape.rotation.z += 0.001 * (i + 1);
        shape.position.y += Math.sin(t * 0.5 + i) * 0.0005;
      });

      particles.rotation.y = t * 0.03;
      particles.rotation.x = Math.sin(t * 0.02) * 0.05;
      lines.rotation.y = t * 0.015;
      lines.rotation.x = Math.sin(t * 0.01) * 0.03;

      camera.position.x = targetX * 0.8;
      camera.position.y = -targetY * 0.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300 relative overflow-hidden">
      {/* ── Three.js background canvas ── */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* ── Top Bar (no logo, centered) ── */}
      <header className="fixed top-0 left-0 right-0 z-20 px-6 md:px-10 py-4 bg-black/60 backdrop-blur-md border-b border-white/5 flex items-center justify-center">
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <Link
            href="https://www.netsyraai.com/chat"
            target="_blank"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Chat
          </Link>
          <Link
            href="https://www.netsyraai.com/ide"
            target="_blank"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            IDE
          </Link>
          <Link
            href="https://www.netsyraai.com/cv-builder/index.html"
            target="_blank"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            CV Builder
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
            Legal
          </Link>
          <Link href="/goal" className="text-sm text-gray-400 hover:text-white transition">
            Goal
          </Link>
          <Link href="/about" className="text-sm text-white font-medium">
            About
          </Link>
          <Link
            href="#"
            className="text-sm px-4 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition"
          >
            Contact
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-20"
        >
          {/* ── Hero ── */}
          <motion.div variants={item} className="text-center space-y-6">
            <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#6c5ce7] border border-[#6c5ce7]/20 px-4 py-1.5 rounded-full bg-[#6c5ce7]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] animate-pulse" />
              Who We Are
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-gray-200 via-white to-[#6c5ce7] bg-clip-text text-transparent leading-[1.1]">
              About Netsyra AI
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              We&apos;re building the intelligent orchestration layer that connects every prompt to the perfect AI model — automatically, efficiently, and at scale.
            </p>
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
            </div>
          </motion.div>

          {/* ── About Card ── */}
          <motion.div
            variants={item}
            className="p-6 md:p-12 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition space-y-4"
          >
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              <span className="text-white font-medium">Netsyra AI</span> is an intelligent AI
              orchestration platform that routes every prompt to the smartest and most cost-efficient
              AI model. We combine the power of multiple AI providers into one seamless API, helping
              developers and businesses <span className="text-[#6c5ce7] font-medium">save up to 70%
              on AI costs</span> while improving response quality.
            </p>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              Unlike traditional single‑model services, Netsyra automatically analyses every request
              in real time. A simple factual question is instantly handled by a lightweight, low‑cost
              model. A complex coding problem is automatically escalated to a deep‑reasoning engine.
              A question about current events instantly searches the live web and integrates the
              latest information into the answer. All of this happens behind a single, unified
              interface — the user only sees <span className="text-white font-medium">fast, accurate,
              and context‑aware responses</span>.
            </p>

            <div className="border-l-3 border-[#6c5ce7] pl-6 py-2 my-4 bg-[#6c5ce7]/5 rounded-r-xl">
              <p className="text-gray-200 text-base md:text-lg italic">
                &quot;We believe no single model is perfect for every task — so we built Netsyra to
                route each request to the best model, automatically.&quot;
              </p>
            </div>

            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              Under the hood, Netsyra integrates with leading AI providers as well as local and
              self‑hosted models. Our intelligent router evaluates complexity, latency, token cost,
              and availability across providers, then selects the best model for every single message
              — <span className="text-white font-medium">no manual configuration required</span>. For
              users who want full control, individual model tiers can be selected manually at any time.
            </p>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              The platform is built for <span className="text-white font-medium">speed and
              reliability</span>. A live performance dashboard tracks latency, token usage, cost
              savings, and routing decisions in real time. Conversations are stored securely with
              per‑user encryption, and our context window is also very high level — meaning the
              conversation history maintains natural, flowing dialogue. Intelligent memory systems
              recall important user facts across sessions, so Netsyra learns about you{" "}
              <span className="text-[#6c5ce7] font-medium">without ever compromising privacy</span>.
            </p>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              Netsyra AI is designed for developers, researchers, businesses, and anyone who demands
              the best from artificial intelligence — without the overhead of managing multiple API
              keys, provider contracts, and model benchmarks. From rapid prototyping to production‑grade
              applications, Netsyra delivers <span className="text-white font-medium">the right answer,
              from the right model, at the right cost</span> — every single time.
            </p>
          </motion.div>

          {/* ── Stats ── */}
          <motion.div
            variants={container}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition"
          >
            {stats.map((s, i) => (
              <motion.div key={i} variants={item} className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-[#6c5ce7] bg-clip-text text-transparent">
                  {s.number}
                </div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Features Grid ── */}
          <motion.div variants={container} className="space-y-4">
            <motion.div variants={item} className="text-center">
              <span className="text-xs tracking-[0.2em] uppercase text-gray-500">What We Do</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">Core Capabilities</h2>
              <p className="text-gray-400 text-sm max-w-2xl mx-auto mt-2">
                Netsyra combines intelligent routing, real‑time optimization, and seamless integration
                to deliver the best AI experience.
              </p>
            </motion.div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  variants={item}
                  className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition group"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6c5ce7]/20 to-[#00b4d8]/10 flex items-center justify-center mb-4 group-hover:from-[#6c5ce7]/30 group-hover:to-[#00b4d8]/20 transition">
                    <svg className="w-5 h-5 text-[#00b4d8]" viewBox="0 0 24 24" fill="currentColor">
                      <path d={f.icon} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Back to Home ── */}
          <motion.div variants={item} className="text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}