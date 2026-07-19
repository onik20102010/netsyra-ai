// app/terms/page.tsx
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
const sections = [
  {
    title: "1. INTRODUCTION",
    content: [
      'Welcome to Netsyra AI ("Company," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the Netsyra AI website, platform, AI orchestration services, and any related tools or features (collectively, the "Services").',
      "By accessing or using the Services, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Services.",
      "These Terms constitute a legally binding agreement between you (\"User\" or \"you\") and Netsyra AI. Our Privacy Policy explains how we collect, use, and protect your personal information.",
    ],
  },
  {
    title: "2. ELIGIBILITY",
    content: [
      "You must be at least 13 years of age to use the Services. If you are under the age of majority in your jurisdiction, you must have the consent of a parent or legal guardian. By using the Services, you represent and warrant that you meet these eligibility requirements and that you will comply with all applicable laws and regulations.",
    ],
  },
  {
    title: "3. ACCOUNT TERMS",
    content: [
      "3.1 Account Creation. To access certain features, you must create an account by providing accurate, current, and complete information, including a valid email address. You may also sign up using third‑party authentication services such as Google.",
      "3.2 Account Security. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.",
      "3.3 Responsibility for Account Activity. You are fully responsible for all actions taken through your account, including any content generated, messages sent, or configurations made. Netsyra AI is not liable for any loss or damage arising from your failure to safeguard your account.",
    ],
  },
  {
    title: "4. ACCEPTABLE USE",
    content: [
      "You agree not to use the Services for any unlawful purpose or in violation of these Terms. Prohibited conduct includes, but is not limited to:",
      "• Engaging in fraud, scams, identity theft, money laundering, or any criminal activity.",
      "• Generating, uploading, or distributing content that promotes violence, terrorism, exploitation of minors, harassment, hate speech, or other harmful material.",
      "• Uploading malware, viruses, ransomware, or other malicious code.",
      "• Sending mass unsolicited messages, spam, or using the Services for automated abuse.",
      "• Infringing upon copyrights, trademarks, patents, trade secrets, or other intellectual property rights of any third party.",
      "• Circumventing rate limits, scraping, using automated scripts, reselling access without explicit written permission, or attempting to gain unauthorized access to our systems.",
      "• Probing, scanning, or testing the vulnerability of any system or network connected to the Services.",
    ],
  },
  {
    title: "5. AI OUTPUT DISCLAIMER",
    content: [
      "Netsyra AI is an artificial intelligence platform. You acknowledge and agree that:",
      "5.1 No Guaranteed Accuracy. AI-generated content may contain errors, inaccuracies, or outdated information. The output should not be relied upon as factual or complete without independent verification.",
      "5.2 No Professional Advice. The Services do not provide legal, medical, financial, accounting, engineering, or other professional advice. Any AI-generated content related to these fields is provided for informational purposes only.",
      "5.3 User Responsibility. You are solely responsible for evaluating the accuracy, completeness, and appropriateness of any AI-generated content. Decisions made based on such content are at your own risk.",
      "5.4 No High‑Risk Use. You may not use the Services for high‑risk applications, including medical diagnosis, emergency response, life‑support systems, critical infrastructure, autonomous weapons, or any application where failure could result in death, personal injury, or catastrophic damage.",
    ],
  },
  {
    title: "6. INTELLECTUAL PROPERTY",
    content: [
      "6.1 Our IP. All rights, title, and interest in and to the Services, including the Netsyra AI name, logo, branding, website, software, APIs, algorithms, models, documentation, and any related materials, are and will remain the exclusive property of Netsyra AI and its licensors.",
      "6.2 Restrictions. You may not copy, modify, distribute, sell, lease, reverse engineer, decompile, or create derivative works of the Services or any part thereof without our express written permission.",
      "6.3 User Content. You retain all ownership rights to the content you submit, upload, or generate through the Services. By using the Services, you grant us a limited, non‑exclusive, worldwide license to process, store, and transmit your content solely as necessary to provide the Services to you.",
    ],
  },
  {
    title: "7. LIMITATION OF LIABILITY",
    content: [
      "To the maximum extent permitted by applicable law, Netsyra AI, its officers, directors, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, use, goodwill, or other intangible losses, arising from or related to your use of the Services.",
      "Our total aggregate liability for any claims arising from these Terms or the Services shall not exceed the amount you have paid us, if any, in the twelve months preceding the claim.",
    ],
  },
  {
    title: "8. ACCOUNT SUSPENSION AND TERMINATION",
    content: [
      "We reserve the right to suspend or terminate your access to the Services, in whole or in part, without prior notice, if we determine that you have violated these Terms, engaged in abusive, fraudulent, or illegal conduct, or created a security risk for our systems.",
      "Upon termination, all rights granted to you under these Terms will immediately end, and you must cease all use of the Services.",
    ],
  },
  {
    title: "9. CHANGES TO THESE TERMS",
    content: [
      'We may modify these Terms at any time by posting the updated version on our website. The updated Terms will be effective as of the "Last Updated" date indicated at the top. Your continued use of the Services after any changes constitutes your acceptance of the revised Terms.',
    ],
  },
  {
    title: "10. CHILDREN'S PRIVACY",
    content: [
      "The Services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected such information, we will delete it promptly.",
    ],
  },
  {
    title: "11. CONTACT INFORMATION",
    content: [
      "If you have any questions, concerns, or feedback regarding these Terms, please contact us at:",
      "Email: netsyraai@gmail.com",
    ],
  },
];

export default function TermsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

      {/* ── Top Bar (no logo, centered) ── */}
      <header className="fixed top-0 left-0 right-0 z-20 px-6 md:px-10 py-4 bg-black/60 backdrop-blur-md border-b border-white/5 flex items-center justify-center">
        <div className="flex items-center gap-6 flex-wrap justify-center">
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
          <Link href="/about" className="text-sm text-gray-400 hover:text-white transition">
            About
          </Link>
          <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-white font-medium">
            Terms
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
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-12"
        >
          {/* ── Header ── */}
          <motion.div variants={item} className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-200 via-white to-[#6c5ce7] bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-gray-400 text-sm">
              Last Updated: <span className="text-white">June 23, 2026</span>
            </p>
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
                  // Check if line starts with a bullet
                  if (line.startsWith("•")) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed flex items-start gap-3">
                        <span className="text-[#6c5ce7] mt-1">•</span>
                        <span>{line.replace("• ", "")}</span>
                      </p>
                    );
                  }
                  // Check if line is an email
                  if (line.startsWith("Email:")) {
                    const email = line.replace("Email: ", "");
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed">
                        {line.replace(email, "")}
                        <a
                          href={`mailto:${email}`}
                          className="text-[#6c5ce7] hover:text-[#8b7cf7] transition"
                        >
                          {email}
                        </a>
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