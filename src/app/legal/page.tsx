// app/legal/page.tsx
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
    title: "1. Intellectual Property",
    content: [
      "Unless otherwise stated, the Netsyra name, brand identity, website content, original software, source code, documentation, graphics, interface designs, original written materials, logos, and other proprietary materials made available by Netsyra are owned by or licensed to Netsyra and are protected by applicable intellectual-property laws.",
      "This may include, where legally protectable:",
      "• software and source code;",
      "• original website and application content;",
      "• original interface elements and visual assets;",
      "• documentation;",
      "• original written materials;",
      "• logos and branding;",
      "• trademarks and service marks;",
      "• proprietary algorithms and implementations;",
      "• AI orchestration and routing implementations;",
      "• proprietary system configurations;",
      "• proprietary prompts and instructions;",
      "• proprietary datasets and internal resources; and",
      "• other original materials created or lawfully licensed by Netsyra.",
      "The existence of an element on the Netsyra website does not by itself mean that every underlying concept, method, functional element, or general design principle is exclusively owned by Netsyra. Intellectual-property rights apply only to the extent provided by applicable law.",
    ],
  },
  {
    title: "2. Netsyra Trademarks",
    content: [
      "\"Netsyra,\" \"Netsyra AI,\" associated logos, product names, service names, and other marks identified as Netsyra branding may constitute trademarks or service marks of Netsyra or their respective owners.",
      "You may not use Netsyra trademarks, logos, or branding in a manner that:",
      "• suggests an unauthorized affiliation or endorsement;",
      "• causes confusion about the source of a product or service;",
      "• falsely implies a partnership or sponsorship; or",
      "• otherwise violates applicable trademark law.",
      "Nothing on this website grants you a license to use Netsyra trademarks except where expressly authorized in writing.",
    ],
  },
  {
    title: "3. Software and Service",
    content: [
      "Access to the Netsyra software and services does not transfer ownership of the underlying software or intellectual property to you.",
      "Subject to the Terms of Service, Netsyra grants users only the rights necessary to access and use the Service for its intended purpose.",
      "You may not copy, reproduce, distribute, sell, sublicense, lease, modify, or create derivative works from proprietary Netsyra software except where expressly permitted by the applicable license, Terms of Service, or applicable law.",
      "Nothing in this section restricts rights that cannot legally be restricted.",
    ],
  },
  {
    title: "4. AI Models and Third-Party Technology",
    content: [
      "Netsyra is an AI orchestration platform and may integrate or interact with AI models, APIs, search services, infrastructure, authentication systems, payment providers, software libraries, and other technologies operated by third parties.",
      "Third-party technologies remain the property of their respective owners.",
      "Netsyra does not claim ownership of third-party models, trademarks, APIs, libraries, or other materials merely because they are accessible through or integrated with the Service.",
      "The availability of a third-party model or service through Netsyra does not necessarily indicate an endorsement, partnership, or ownership relationship unless expressly stated.",
      "Third-party services may be governed by separate terms, licenses, and privacy policies.",
    ],
  },
  {
    title: "5. Open-Source Software",
    content: [
      "Netsyra may use open-source software and third-party software components.",
      "Such components remain subject to their respective licenses.",
      "Where required by an applicable open-source license, the relevant license terms, notices, copyright statements, or attribution information will govern the applicable component.",
      "Nothing in this Legal Notice is intended to restrict rights granted to you under an applicable open-source license.",
    ],
  },
  {
    title: "6. User Content",
    content: [
      "Users retain ownership of content they submit to Netsyra to the extent they possess applicable rights in that content.",
      "Submitting content to Netsyra does not automatically transfer ownership of that content to Netsyra.",
      "However, Netsyra may need limited rights to process submitted content in order to provide the Service, operate requested features, maintain security, and perform other activities described in the Terms of Service and Privacy Policy.",
      "You are responsible for ensuring that you have the necessary rights, permissions, and legal authority to submit content to the Service.",
      "You must not submit content that you do not have the right to process or that would cause Netsyra to violate applicable law or third-party rights.",
    ],
  },
  {
    title: "7. AI-Generated Output",
    content: [
      "AI-generated output may be produced using third-party models and technologies.",
      "Netsyra does not automatically claim ownership of every output generated through the Service.",
      "The ownership, copyright status, licensing, and permitted use of AI-generated content may depend on applicable law, the nature of the output, the rights in the input material, and the terms applicable to the underlying AI provider.",
      "Users are responsible for determining whether their intended use of AI-generated output is lawful and appropriate.",
      "Netsyra does not guarantee that generated output is unique or free from third-party intellectual-property claims.",
    ],
  },
  {
    title: "8. Copyright and Infringement",
    content: [
      "Netsyra respects intellectual-property rights and expects users of the Service to do the same.",
      "If you believe that material available through the Netsyra Service infringes your copyright or other intellectual-property rights, you may contact us at:",
      "supportnetsyra@gmail.com",
      "A copyright complaint should contain sufficient information for us to identify:",
      "1. the copyrighted work or other protected material;",
      "2. the allegedly infringing material and its location;",
      "3. your contact information;",
      "4. a statement explaining your good-faith belief that the use is unauthorized; and",
      "5. any additional information required by applicable law.",
      "Submitting a notice does not guarantee removal of the reported material. Netsyra may evaluate notices according to applicable law and may request additional information.",
      "Where legally required, Netsyra may maintain procedures for receiving and responding to valid copyright notices and counter-notices.",
    ],
  },
  {
    title: "9. Unauthorized Use",
    content: [
      "You may not use Netsyra proprietary materials in a manner that infringes applicable intellectual-property rights.",
      "Examples of potentially prohibited conduct include:",
      "• copying proprietary source code without authorization;",
      "• reproducing proprietary documentation substantially without permission;",
      "• distributing proprietary assets without authorization;",
      "• impersonating Netsyra;",
      "• using Netsyra branding to create a misleading affiliation;",
      "• extracting proprietary materials through unauthorized means; or",
      "• bypassing technical controls specifically intended to protect proprietary resources.",
      "Nothing in this section prohibits lawful activities such as independent development, interoperability, criticism, commentary, research, fair use, fair dealing, or other rights protected by applicable law.",
    ],
  },
  {
    title: "10. Confidential and Proprietary Information",
    content: [
      "Certain Netsyra information may constitute confidential or proprietary information even if it is not formally registered as intellectual property.",
      "Examples may include non-public:",
      "• technical architecture;",
      "• security information;",
      "• internal processes;",
      "• system configurations;",
      "• business information;",
      "• product roadmaps;",
      "• proprietary algorithms;",
      "• internal prompts;",
      "• pricing arrangements; and",
      "• other information that is reasonably understood to be confidential.",
      "Unauthorized disclosure, extraction, or use of confidential information may violate contractual obligations or applicable law.",
    ],
  },
  {
    title: "11. No Implied License",
    content: [
      "Except for the limited rights expressly granted through the Terms of Service or another written agreement, nothing on the Netsyra website or within the Service grants any license or other right to Netsyra's intellectual property.",
      "Any rights not expressly granted are reserved.",
    ],
  },
  {
    title: "12. Third-Party Content and Links",
    content: [
      "The Netsyra website or Service may contain links, references, integrations, or content provided by third parties.",
      "Netsyra does not necessarily control or endorse third-party content.",
      "Third-party websites and services are governed by their own terms and policies.",
      "Netsyra is not responsible for the accuracy, availability, security, or intellectual-property practices of third-party websites or services that it does not control.",
    ],
  },
  {
    title: "13. Accuracy of Legal and Product Information",
    content: [
      "We attempt to keep information on the Netsyra website accurate and current.",
      "However, product capabilities, AI models, providers, pricing, technical architecture, and other information may change.",
      "Nothing on the website should be interpreted as a guarantee that a particular model, feature, provider, integration, or capability will remain available indefinitely.",
      "Where legally binding terms apply, the applicable Terms of Service, order terms, subscription terms, or written agreement will control.",
    ],
  },
  {
    title: "14. No Professional Advice",
    content: [
      "Information provided through Netsyra or its website is not intended to constitute legal, financial, medical, accounting, security, or other professional advice.",
      "AI-generated information should be independently evaluated before being relied upon for consequential decisions.",
      "For professional matters, consult an appropriately qualified professional.",
    ],
  },
  {
    title: "15. Legal Compliance",
    content: [
      "Netsyra operates its Service subject to applicable laws and regulations.",
      "Users are responsible for ensuring that their use of the Service complies with the laws applicable to them.",
      "Nothing on this website authorizes conduct that is unlawful in the user's jurisdiction.",
    ],
  },
  {
    title: "16. Reservation of Rights",
    content: [
      "Netsyra reserves all rights in its proprietary materials and intellectual property that are not expressly granted to users.",
      "Where Netsyra believes its legally protected rights have been infringed, it may take appropriate action available under applicable law, which may include requesting removal of infringing material, seeking injunctive relief, pursuing damages, or taking other lawful measures.",
      "Any enforcement action will be subject to applicable law and available legal remedies.",
    ],
  },
  {
    title: "17. Relationship to Other Legal Documents",
    content: [
      "This Legal Notice should be read together with the Netsyra AI:",
      "• Terms of Service, which govern use of the Service;",
      "• Privacy Policy, which explains how personal information is processed; and",
      "• Acceptable Use Policy, where applicable, which establishes additional restrictions concerning prohibited or abusive use.",
      "If there is a conflict between this Legal Notice and a specific contractual agreement, the applicable contractual agreement will control to the extent provided by that agreement.",
    ],
  },
  {
    title: "18. Changes to This Legal Notice",
    content: [
      "We may update this Legal Notice from time to time to reflect changes to our business, Service, intellectual-property rights, legal requirements, or other relevant circumstances.",
      'The "Last Updated" date at the beginning of this page indicates when this notice was most recently revised.',
    ],
  },
  {
    title: "19. Contact",
    content: [
      "For legal, intellectual-property, copyright, or trademark matters:",
      "Netsyra AI",
      "Legal: supportnetsyra@gmail.com",
      "Support: supportnetsyra@gmail.com",
      "Website: https://www.netsyraai.com",
      "Legal Entity: [LEGAL ENTITY NAME]",
      "Registered Address: [LEGAL BUSINESS ADDRESS]",
    ],
  },
];

export default function LegalPage() {
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
          <Link href="/legal" className="text-sm text-white font-medium">Legal</Link>
          <Link href="/goal" className="text-sm text-gray-400 hover:text-white transition">Goal</Link>
          <Link href="/about" className="text-sm text-gray-400 hover:text-white transition">About</Link>
          <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition">Privacy</Link>
          <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition">Terms</Link>
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
                <Link href="/legal" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-white font-medium hover:bg-white/10 transition">Legal</Link>
                <Link href="/goal" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">Goal</Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">About</Link>
                <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">Privacy</Link>
                <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">Terms</Link>
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
              Legal Notice
            </h1>
            <p className="text-gray-400 text-sm">
              Last Updated: <span className="text-white">August 31, 2026</span>
            </p>
            <div className="w-16 h-1 mx-auto rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#00b4d8]" />
          </motion.div>

          {/* ── Intro ── */}
          <motion.div
            variants={item}
            className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition space-y-4"
          >
            <p className="text-gray-300 text-base leading-relaxed">
              This Legal Notice provides general legal information concerning <strong>Netsyra AI</strong> ("Netsyra," "we," "us," or "our"), the Netsyra website, applications, software, services, documentation, and related materials.
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              Netsyra AI is operated by:
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              <strong>Legal Entity:</strong> [LEGAL ENTITY NAME]<br />
              <strong>Business Name:</strong> Netsyra AI<br />
              <strong>Registered Address:</strong> [LEGAL BUSINESS ADDRESS]<br />
              <strong>Legal Contact:</strong> <a href="mailto:supportnetsyra@gmail.com" className="text-[#6c5ce7] hover:text-[#8b7cf7] transition">supportnetsyra@gmail.com</a><br />
              <strong>General Support:</strong> <a href="mailto:supportnetsyra@gmail.com" className="text-[#6c5ce7] hover:text-[#8b7cf7] transition">supportnetsyra@gmail.com</a><br />
              <strong>Website:</strong> <a href="https://www.netsyraai.com" className="text-[#6c5ce7] hover:text-[#8b7cf7] transition">https://www.netsyraai.com</a>
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
                  // Numbered list (e.g., "1. the copyrighted work...")
                  if (/^\d+\./.test(line)) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed flex items-start gap-3">
                        <span className="text-[#6c5ce7] mt-1 font-mono">{line.match(/^\d+\./)?.[0]}</span>
                        <span>{line.replace(/^\d+\.\s*/, "")}</span>
                      </p>
                    );
                  }
                  // Email lines (any that contain @ and are not part of a sentence)
                  if (line.includes("@") && (line.includes("legal@") || line.includes("support@") || line.includes("Legal:") || line.includes("Support:"))) {
                    const email = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
                    if (email) {
                      const before = line.replace(email, "");
                      return (
                        <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed">
                          {before}
                          <a href={`mailto:${email}`} className="text-[#6c5ce7] hover:text-[#8b7cf7] transition">
                            {email}
                          </a>
                        </p>
                      );
                    }
                  }
                  // Website link
                  if (line.includes("https://www.netsyraai.com")) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed">
                        <a href="https://www.netsyraai.com" className="text-[#6c5ce7] hover:text-[#8b7cf7] transition">
                          https://www.netsyraai.com
                        </a>
                      </p>
                    );
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

          {/* ── Important Notice ── */}
          <motion.div
            variants={item}
            className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition space-y-3"
          >
            <h2 className="text-xl md:text-2xl font-semibold text-white">Important Notice</h2>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              This Legal Notice describes Netsyra's general legal and intellectual-property position. It does not replace the Terms of Service or Privacy Policy and does not grant rights beyond those expressly provided in applicable agreements or law.
            </p>
          </motion.div>

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