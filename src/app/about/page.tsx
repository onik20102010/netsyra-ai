// app/about/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { Menu, X } from "lucide-react";

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
const sections = [
  {
    title: "Why We Built Netsyra",
    content: [
      "Modern AI models are becoming increasingly capable, but different models have different strengths, costs, speeds, and limitations.",
      "A simple question, a difficult programming problem, a large codebase, a complex reasoning task, and a research request should not necessarily be processed in exactly the same way.",
      "Using a frontier model for every request can be unnecessarily expensive and inefficient. Using a lightweight model for every request can sacrifice quality when a problem actually requires deeper reasoning.",
      "We believe the next step is not simply better models, but better systems for using models.",
      "That is why we are building Netsyra.",
    ],
  },
  {
    title: "What Netsyra Does",
    content: [
      "Netsyra acts as an intelligent orchestration layer between users and AI capabilities.",
      "Depending on the request, Netsyra can evaluate factors such as task complexity, reasoning requirements, context, coding difficulty, tool requirements, latency, and computational cost.",
      "It can then determine an appropriate processing strategy.",
      "A simplified view of our approach is:",
      "Understand → Assess → Select → Execute → Verify → Respond",
      "The objective is to match the level of intelligence and processing required to the problem.",
    ],
  },
  {
    title: "A Multi‑Model Approach",
    content: [
      "Netsyra is designed to work with multiple AI models rather than treating one model as the answer to every problem.",
      "Different models can be particularly useful for different workloads.",
      "Some may be optimized for:",
      "• complex reasoning;",
      "• programming and debugging;",
      "• large-context analysis;",
      "• fast everyday tasks;",
      "• research and information retrieval;",
      "• specialized workflows; or",
      "• cost-efficient inference.",
      "Netsyra's role is to intelligently coordinate these capabilities.",
      "We are building toward a system where users do not need to understand which model is best for every individual request.",
      "Netsyra should handle that complexity for them.",
    ],
  },
  {
    title: "Intelligence With Efficiency",
    content: [
      "We believe AI should be both capable and efficient.",
      "When a request is straightforward, an efficient model may be sufficient.",
      "When a request is difficult, Netsyra can allocate stronger capabilities where they provide meaningful value.",
      "This approach is intended to improve the balance between:",
      "Quality · Intelligence · Speed · Reliability · Cost",
      "The goal is not to minimize AI usage at the expense of quality.",
      "The goal is to minimize unnecessary computation while preserving the intelligence required to solve the problem well.",
    ],
  },
  {
    title: "Built for More Than Conversation",
    content: [
      "Netsyra is designed to extend beyond conventional question‑and‑answer interactions.",
      "Our platform can support AI capabilities such as:",
      "• reasoning and problem solving;",
      "• software development;",
      "• code analysis and debugging;",
      "• large‑context processing;",
      "• web and information retrieval;",
      "• tool‑assisted workflows;",
      "• automated tasks;",
      "• AI agents; and",
      "• intelligent model orchestration.",
      "As the platform evolves, these capabilities can become increasingly interconnected rather than functioning as isolated features.",
    ],
  },
  {
    title: "Our Approach to AI",
    content: [
      "We believe useful AI requires more than raw model capability.",
      "A strong AI system also needs to understand:",
      "what the user wants, how difficult the task is, what information is required, which capabilities are appropriate, when additional processing is necessary, and when the result should be verified.",
      "That is why Netsyra focuses on the system surrounding the models, not only the models themselves.",
      "Models are the engines.",
      "Netsyra is building the intelligence layer that decides how to use them.",
    ],
  },
  {
    title: "Designed to Evolve",
    content: [
      "AI technology changes rapidly.",
      "New models are released, existing models improve, providers introduce new capabilities, and the economics of inference continue to change.",
      "Netsyra is therefore designed around an adaptable, model‑agnostic architecture.",
      "We do not want the future of Netsyra to depend permanently on one model, one provider, or one generation of AI technology.",
      "As the ecosystem evolves, Netsyra can evolve with it.",
    ],
  },
  {
    title: "Our Long‑Term Vision",
    content: [
      "Our long‑term vision is to build an AI system capable of dynamically determining how a problem should be solved before deciding which intelligence should solve it.",
      "We envision a system that can increasingly:",
      "• understand user intent;",
      "• estimate task difficulty;",
      "• select appropriate models;",
      "• coordinate multiple models when useful;",
      "• choose and use tools;",
      "• allocate computational effort intelligently;",
      "• verify important results;",
      "• recover from failures;",
      "• learn from system performance; and",
      "• continuously improve its orchestration strategies.",
      "The ultimate objective is not to create another interface around existing AI models.",
      "It is to build a smarter way of using AI itself.",
    ],
  },
  {
    title: "Our Principle",
    content: [
      "We believe intelligence should be available when it matters, efficient when it doesn't, and adaptable to whatever comes next.",
      "Netsyra is being built around that principle.",
      "Right intelligence.",
      "Right task.",
      "Right time.",
      "",
      "Netsyra AI",
      "Intelligence, intelligently orchestrated.",
    ],
  },
];

export default function AboutPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Three.js Particle Nebula Background ──────────────
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

      {/* ── Top Bar (responsive with mobile hamburger) ── */}
      <header className="fixed top-0 left-0 right-0 z-20 px-4 sm:px-6 md:px-10 py-3 sm:py-4 bg-black/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="hidden md:flex items-center gap-6 flex-wrap justify-center">
          <Link
            href="https://netsyraai.com/chat"
            target="_blank"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Chat
          </Link>
          <Link
            href="https://netsyraai.com/cv-builder/index.html"
            target="_blank"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            CV Builder
          </Link>
          <Link href="/legal" className="text-sm text-gray-400 hover:text-white transition">
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

        <div className="flex md:hidden items-center justify-between w-full">
          <span className="text-sm font-bold text-white">Netsyra AI</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 right-0 mx-4 mt-1 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-lg overflow-hidden"
            >
              <div className="flex flex-col p-2 gap-1">
                <Link href="https://netsyraai.com/chat" target="_blank" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">Chat</Link>
                <Link href="https://netsyraai.com/cv-builder/index.html" target="_blank" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">CV Builder</Link>
                <Link href="/legal" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">Legal</Link>
                <Link href="/goal" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">Goal</Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-white font-medium hover:bg-white/10 transition">About</Link>
                <Link href="#" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">Contact</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 sm:pb-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-12"
        >
          {/* ── Header ── */}
          <motion.div variants={item} className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-200 via-white to-[#6c5ce7] bg-clip-text text-transparent">
              About Netsyra
            </h1>
            <div className="w-16 h-1 mx-auto rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#00b4d8]" />
          </motion.div>

          {/* ── Intro ── */}
          <motion.div
            variants={item}
            className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition space-y-4"
          >
            <p className="text-gray-300 text-base leading-relaxed">
              Netsyra AI is building an intelligent AI orchestration platform designed to make advanced artificial intelligence more efficient, capable, and accessible.
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              Instead of depending on a single AI model for every task, Netsyra brings together different models and capabilities and intelligently determines how a request should be handled.
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              Our central idea is simple:
            </p>
            <p className="text-gray-200 text-base md:text-lg font-medium border-l-3 border-[#6c5ce7] pl-4 py-2 bg-[#6c5ce7]/5 rounded-r-xl">
              The best AI system is not necessarily the one that uses the most powerful model. It is the one that knows when powerful intelligence is needed—and when it isn't.
            </p>
          </motion.div>

          {/* ── Sections ── */}
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              variants={item}
              className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition space-y-3"
            >
              <h2 className="text-xl md:text-2xl font-semibold text-white">
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.content.map((line, i) => {
                  // Bullet points
                  if (line.startsWith("•")) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed flex items-start gap-3">
                        <span className="text-[#6c5ce7] mt-1">•</span>
                        <span>{line.replace("• ", "")}</span>
                      </p>
                    );
                  }
                  // Arrow sequences (e.g., "Understand → Assess → ...")
                  if (line.includes("→")) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed font-mono text-[#00b4d8]">
                        {line}
                      </p>
                    );
                  }
                  // The line with "Quality · Intelligence · Speed · Reliability · Cost"
                  if (line.includes("·")) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed text-center text-[#6c5ce7] font-medium">
                        {line}
                      </p>
                    );
                  }
                  // Empty line (skip)
                  if (line === "") {
                    return null;
                  }
                  // Default paragraph
                  return (
                    <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed">
                      {line}
                    </p>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* ── Back to Home ── */}
          <motion.div variants={item} className="text-center">
            <Link
              href="/"
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