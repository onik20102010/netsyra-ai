// app/goal/page.tsx
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
    title: "Intelligence That Matches the Task",
    content: [
      "Netsyra AI is built around a simple idea: not every problem requires the same amount of intelligence.",
      "A simple question should not require the computational cost of a frontier reasoning model. A complex software architecture problem should not be handled by a lightweight model simply because it is faster.",
      "Netsyra is designed to intelligently determine what a request requires and which AI capabilities are best suited to solve it.",
      "Our goal is to build an AI system that can dynamically balance intelligence, accuracy, speed, reliability, and computational cost for every request.",
    ],
  },
  {
    title: "Intelligent Model Selection",
    content: [
      "Instead of relying on a single model for everything, Netsyra can work with multiple specialized AI models and providers.",
      "For each request, the system can evaluate factors such as:",
      "• task complexity;",
      "• reasoning requirements;",
      "• coding difficulty;",
      "• context size;",
      "• required knowledge;",
      "• ambiguity;",
      "• tool requirements;",
      "• expected output complexity;",
      "• latency requirements; and",
      "• computational cost.",
      "Based on these factors, Netsyra can select an appropriate model or model strategy.",
      "Simple tasks can be handled efficiently. Complex tasks can receive substantially stronger reasoning and processing.",
      "The objective is not to use the largest model every time.",
      "The objective is to use the right intelligence for the task.",
    ],
  },
  {
    title: "More Than Model Routing",
    content: [
      "Netsyra is designed to go beyond simply choosing a model based on a fixed list of rules.",
      "Our long-term goal is an intelligent orchestration layer capable of determining:",
      "What is the user asking? → How difficult is it? → What capabilities are required? → Which model is best suited? → What tools are needed? → Is additional reasoning or verification required? → Is the result reliable enough to return?",
      "This allows Netsyra to treat different requests differently rather than applying the same processing strategy to every conversation.",
    ],
  },
  {
    title: "Quality Where It Matters",
    content: [
      "Cost optimization is only useful when it preserves the quality users need.",
      "Netsyra therefore aims to prioritize task-appropriate quality, rather than blindly optimizing for the lowest possible inference cost.",
      "A lightweight model may be sufficient for a straightforward request.",
      "A stronger reasoning model may be selected when a task involves:",
      "• complex reasoning;",
      "• difficult mathematics;",
      "• multi-step planning;",
      "• advanced programming;",
      "• debugging;",
      "• large-scale code analysis;",
      "• security analysis;",
      "• architectural decisions;",
      "• ambiguous requirements; or",
      "• tasks where mistakes carry a higher cost.",
      "The system can therefore allocate greater computational capability when the problem actually requires it.",
    ],
  },
  {
    title: "Efficiency by Design",
    content: [
      "Running every request through the most expensive model is inefficient.",
      "Netsyra's architecture is designed to reduce unnecessary computational expenditure by matching model capability to task requirements.",
      "This can improve:",
      "• Cost efficiency — expensive models are reserved for tasks that benefit from them.",
      "• Latency — simpler requests can be processed through faster models.",
      "• Scalability — intelligent distribution of workloads can help support a larger number of users and requests.",
      "• Model utilization — different models can be used according to their relative strengths instead of treating every model as interchangeable.",
    ],
  },
  {
    title: "Specialized Intelligence",
    content: [
      "Different models can have different strengths.",
      "One model may be particularly effective at reasoning. Another may excel at software development. Another may efficiently process large contexts. Another may provide fast responses at a lower computational cost.",
      "Netsyra's goal is to take advantage of these differences.",
      "Rather than asking:",
      "\"Which model is the best?\"",
      "Netsyra asks:",
      "\"Which model is best for this task?\"",
      "That distinction is fundamental to our architecture.",
    ],
  },
  {
    title: "Dynamic Escalation",
    content: [
      "Netsyra is designed with the concept of intelligence escalation.",
      "A request may begin with an efficient processing strategy and, when the system determines that additional capability is necessary, move toward a stronger model or a more sophisticated processing path.",
      "This creates a more efficient architecture than permanently assigning every request to the same model.",
      "The goal is to make stronger intelligence available when it is needed—not simply because it exists.",
    ],
  },
  {
    title: "Verification and Reliability",
    content: [
      "Selecting a model is only one part of solving a difficult problem.",
      "For applicable tasks, Netsyra aims to incorporate additional safeguards such as:",
      "• structured reasoning;",
      "• tool use;",
      "• result validation;",
      "• consistency checks;",
      "• error detection;",
      "• code analysis;",
      "• test execution where available;",
      "• model-to-model verification; and",
      "• retry or escalation strategies.",
      "These mechanisms are intended to improve reliability without unnecessarily increasing processing costs for simple requests.",
    ],
  },
  {
    title: "A Multi‑Model AI System",
    content: [
      "Netsyra is not intended to be defined by a single underlying model.",
      "Models evolve rapidly. New capabilities appear, providers change their systems, and different models become better suited to different workloads.",
      "Our architecture is therefore designed to remain model-agnostic and adaptable.",
      "As better models and technologies become available, Netsyra can incorporate them into its orchestration layer rather than requiring the entire product to depend on a single model.",
    ],
  },
  {
    title: "Our Long‑Term Vision",
    content: [
      "Our long-term goal is to build an adaptive AI system that understands the requirements of a task before deciding how to solve it.",
      "Instead of treating AI as:",
      "User → One Model → Response",
      "we envision:",
      "User → Understanding → Difficulty Assessment → Capability Selection → Model & Tool Selection → Execution → Verification → Response",
      "The system should continuously become better at determining how much intelligence a problem requires, where that intelligence should come from, and how to use it efficiently.",
    ],
  },
  {
    title: "Intelligence Should Be Efficient",
    content: [
      "We believe the future of AI is not simply about making models larger.",
      "It is also about making AI systems smarter about how they use intelligence.",
      "A powerful model should be available when a difficult problem demands it.",
      "A fast and efficient model should handle work that does not require frontier-level computation.",
      "And the system connecting them should understand the difference.",
      "That is the problem Netsyra is built to solve.",
    ],
  },
  {
    title: "Our Goal",
    content: [
      "Build an AI orchestration system that dynamically matches intelligence to the task—maximizing useful capability while minimizing unnecessary cost, latency, and computation.",
    ],
  },
];

export default function GoalPage() {
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
          <Link href="https://netsyraai.com/chat" target="_blank" className="text-sm text-gray-400 hover:text-white transition">Chat</Link>
          <Link href="https://netsyraai.com/cv-builder/index.html" target="_blank" className="text-sm text-gray-400 hover:text-white transition">CV Builder</Link>
          <Link href="/legal" className="text-sm text-gray-400 hover:text-white transition">Legal</Link>
          <Link href="/goal" className="text-sm text-white font-medium">Goal</Link>
          <Link href="/about" className="text-sm text-gray-400 hover:text-white transition">About</Link>
          <Link href="#" className="text-sm px-4 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition">Contact</Link>
        </div>
        <div className="flex md:hidden items-center justify-between w-full">
          <span className="text-sm font-bold text-white">Netsyra AI</span>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white" aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="md:hidden absolute top-full left-0 right-0 mx-4 mt-1 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-lg overflow-hidden">
              <div className="flex flex-col p-2 gap-1">
                <Link href="https://netsyraai.com/chat" target="_blank" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">Chat</Link>
                <Link href="https://netsyraai.com/cv-builder/index.html" target="_blank" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">CV Builder</Link>
                <Link href="/legal" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">Legal</Link>
                <Link href="/goal" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-white font-medium hover:bg-white/10 transition">Goal</Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">About</Link>
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
              Our Goal
            </h1>
            <div className="w-16 h-1 mx-auto rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#00b4d8]" />
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
                  if (line.startsWith("•")) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed flex items-start gap-3">
                        <span className="text-[#6c5ce7] mt-1">•</span>
                        <span>{line.replace("• ", "")}</span>
                      </p>
                    );
                  }
                  // Check for quoted text or arrows
                  if (line.startsWith('"') || line.startsWith('“') || line.startsWith('"')) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed italic border-l-2 border-[#6c5ce7] pl-4">
                        {line}
                      </p>
                    );
                  }
                  // Check for arrow sequences (→)
                  if (line.includes("→")) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed font-mono text-[#00b4d8]">
                        {line}
                      </p>
                    );
                  }
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