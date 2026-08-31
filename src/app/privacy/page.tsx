// app/privacy/page.tsx
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
    title: "1. Scope",
    content: [
      "This Privacy Policy applies to personal information processed by Netsyra in connection with the Service.",
      "It does not necessarily apply to third-party websites, applications, AI providers, payment processors, authentication providers, or other services that have their own privacy policies.",
      "Where you use a third-party service through Netsyra, that third party may independently process information according to its own terms and privacy practices.",
    ],
  },
  {
    title: "2. Information We Collect",
    content: [
      "The information we collect depends on how you use the Service.",
      "2.1 Account Information",
      "When you create or use an account, we may collect:",
      "• name;",
      "• email address;",
      "• authentication identifiers;",
      "• account ID;",
      "• profile information you choose to provide;",
      "• account preferences; and",
      "• subscription or account-status information.",
      "If you sign in using Google or another authentication provider, we may receive information that provider makes available to us according to the authorization you provide and the provider's policies.",
      "Netsyra does not request access to Google services such as Gmail, Google Drive, or Google Calendar unless a specific feature clearly requests such access and you authorize it.",
      "2.2 Prompts, Conversations, and User Content",
      "When you use Netsyra, you may provide:",
      "• prompts;",
      "• messages;",
      "• conversation history;",
      "• files;",
      "• documents;",
      "• source code;",
      "• images or other media;",
      "• instructions;",
      "• generated outputs; and",
      "• other content you voluntarily submit.",
      "We process this information to provide the requested Service.",
      "If conversation history or memory is enabled, relevant information may be stored and associated with your account so that Netsyra can provide those features.",
      "Important: You should not submit passwords, authentication secrets, payment-card numbers, private encryption keys, highly sensitive personal information, or other confidential information unless the relevant feature is specifically designed to handle it and you have an appropriate reason to do so.",
      "2.3 Usage and Technical Information",
      "We may automatically receive technical and usage information such as:",
      "• IP address;",
      "• browser type;",
      "• operating system;",
      "• device information;",
      "• approximate location derived from IP address;",
      "• timestamps;",
      "• referring URLs;",
      "• pages or features accessed;",
      "• request metadata;",
      "• usage counts;",
      "• token or model usage;",
      "• performance information;",
      "• error and diagnostic information; and",
      "• security and abuse-prevention information.",
      "We use this information to operate, secure, troubleshoot, analyze, and improve the Service.",
      "2.4 Payment Information",
      "If you purchase a paid subscription, payment information may be processed by our payment processor.",
      "Depending on the payment method and processor, Netsyra may receive information such as:",
      "• transaction identifier;",
      "• subscription status;",
      "• billing country;",
      "• payment status;",
      "• last four digits of a payment card, where provided by the processor; and",
      "• other billing metadata.",
      "We do not intentionally store complete payment-card numbers when payment processing is handled directly by a third-party payment processor.",
      "2.5 Communications",
      "If you contact us, we may collect the information contained in your message, including your email address and any information you voluntarily provide.",
      "We use this information to respond to you, provide support, investigate problems, and maintain appropriate records.",
    ],
  },
  {
    title: "3. How We Use Information",
    content: [
      "We may use personal information for the following purposes:",
      "Providing the Service",
      "To:",
      "• authenticate users;",
      "• maintain accounts;",
      "• process prompts;",
      "• generate AI responses;",
      "• maintain conversation history;",
      "• provide memory features;",
      "• operate model routing;",
      "• provide web-search functionality;",
      "• provide coding and agentic features;",
      "• process API requests;",
      "• provide customer support; and",
      "• deliver requested functionality.",
      "Security and Abuse Prevention",
      "To:",
      "• detect and prevent fraud;",
      "• protect accounts;",
      "• identify abuse;",
      "• investigate security incidents;",
      "• enforce usage restrictions;",
      "• prevent unauthorized access; and",
      "• protect Netsyra, users, providers, and the public.",
      "Service Improvement",
      "We may use appropriate technical and aggregated information to understand performance, reliability, usage patterns, errors, and feature effectiveness.",
      "We will not represent that user content is used for AI training or model improvement unless that practice is actually implemented and accurately disclosed in this Privacy Policy and, where required, supported by an appropriate legal basis or consent.",
      "Communications",
      "We may use contact information to:",
      "• provide service notices;",
      "• respond to support requests;",
      "• communicate about account or billing issues;",
      "• provide security notifications; and",
      "• send marketing communications where permitted by law and where appropriate consent or another lawful basis exists.",
      "You may unsubscribe from marketing communications at any time.",
    ],
  },
  {
    title: "4. AI Processing and Model Providers",
    content: [
      "Netsyra is an AI orchestration platform.",
      "Depending on the request, configuration, feature, model, availability, and routing decision, your input and related context may be transmitted to third-party AI providers.",
      "These providers may include providers such as:",
      "• OpenAI;",
      "• Anthropic;",
      "• Google;",
      "• DeepSeek;",
      "• Groq;",
      "• Cerebras; and",
      "• other providers that Netsyra may add or use in the future.",
      "The actual providers used for a particular request may vary.",
      "We use third-party providers when reasonably necessary to provide AI inference, routing, search, infrastructure, or related functionality.",
      "Before sending information to a third-party provider, Netsyra may process the request to determine which provider or model is appropriate.",
      "Third-Party Provider Data Practices",
      "Third-party providers may process information according to their own agreements and policies.",
      "Where appropriate, Netsyra seeks contractual and technical protections concerning the processing of user information.",
      "Because third-party providers can change their products, infrastructure, retention practices, or terms, the precise processing applicable to a particular request may vary.",
      "We will not knowingly make a blanket statement that third-party providers 'never retain' or 'never use' information unless that statement is contractually and technically accurate.",
    ],
  },
  {
    title: "5. Does Netsyra Train AI Models Using Your Content?",
    content: [
      "Netsyra will only describe user content as being used for model training or model improvement if that practice is actually performed.",
      "Current policy position: Netsyra does not use your private prompts, conversations, files, or outputs to train Netsyra's general-purpose AI models.",
      "Regardless of the option selected, third-party AI providers may have their own data-processing practices that apply when your request is sent to them.",
    ],
  },
  {
    title: "6. Legal Bases for Processing",
    content: [
      "Where the GDPR, UK GDPR, or another law requiring a documented legal basis applies, Netsyra may process personal data on one or more of the following bases:",
      "Contract",
      "Processing may be necessary to provide the Service you requested or to perform our agreement with you.",
      "Legitimate Interests",
      "We may process information where reasonably necessary for legitimate interests such as:",
      "• maintaining and securing the Service;",
      "• preventing fraud and abuse;",
      "• improving reliability;",
      "• troubleshooting;",
      "• protecting our systems;",
      "• defending legal claims; and",
      "• operating our business,",
      "provided those interests are not overridden by applicable rights and interests.",
      "Consent",
      "We may rely on consent where required or appropriate, including for certain marketing, cookies, or optional processing.",
      "You may withdraw consent where applicable.",
      "Withdrawal does not affect processing lawfully carried out before withdrawal.",
      "Legal Obligation",
      "We may process information where necessary to comply with applicable law, legal process, regulatory requirements, or lawful governmental requests.",
    ],
  },
  {
    title: "7. How We Share Information",
    content: [
      "We do not sell personal information for money.",
      "We may disclose information to the following categories of recipients when reasonably necessary:",
      "• AI and Model Providers – to process requests and generate AI responses.",
      "• Hosting and Infrastructure Providers – to host databases, applications, APIs, storage, logs, and infrastructure.",
      "• Authentication Providers – to provide account authentication and login functionality.",
      "• Payment Providers – to process subscriptions, payments, refunds, and billing.",
      "• Search and Tool Providers – to provide web search, retrieval, external tools, or other requested functionality.",
      "• Security and Monitoring Providers – to detect fraud, abuse, attacks, operational failures, and security incidents.",
      "• Professional Advisers – to lawyers, accountants, auditors, insurers, and other professional advisers where reasonably necessary.",
      "• Legal and Regulatory Authorities – where required by law, legal process, court order, or where reasonably necessary to protect rights, safety, security, or property.",
      "• Corporate Transactions – if Netsyra is involved in a merger, acquisition, financing, restructuring, bankruptcy, sale of assets, or similar transaction, information may be transferred as part of that transaction, subject to applicable law.",
    ],
  },
  {
    title: "8. International Data Transfers",
    content: [
      "Netsyra and its service providers may operate in countries different from the country where you live.",
      "As a result, personal information may be transferred internationally.",
      "Where applicable law requires safeguards for international transfers, we will use legally recognized mechanisms, which may include:",
      "• adequacy decisions;",
      "• Standard Contractual Clauses;",
      "• UK transfer mechanisms;",
      "• appropriate contractual protections;",
      "• supplementary technical or organizational safeguards; or",
      "• another lawful transfer mechanism.",
      "The availability of a particular transfer mechanism depends on the countries and providers involved.",
    ],
  },
  {
    title: "9. Data Retention",
    content: [
      "We retain information only for as long as reasonably necessary for the purposes described in this Privacy Policy, unless a longer period is required or permitted by law.",
      "Retention periods depend on the type of information and why we process it.",
      "Examples include:",
      "• Account information: generally retained while your account remains active and for a reasonable period afterward where necessary for legal, security, accounting, or dispute-resolution purposes.",
      "• Conversation data: retained according to the storage settings and features you use, subject to applicable technical and legal requirements.",
      "• Security logs: retained for a period reasonably necessary for security, fraud prevention, troubleshooting, and legal purposes.",
      "• Billing records: retained as required for accounting, tax, financial, and legal obligations.",
      "• Support communications: retained as reasonably necessary to resolve requests and maintain appropriate business records.",
      "When information is no longer required, we may delete it, anonymize it, or securely isolate it where deletion is not immediately practical.",
    ],
  },
  {
    title: "10. Account and Data Deletion",
    content: [
      "You may request deletion of your account and personal information by contacting:",
      "supportnetsyra@gmail.com",
      "Where account deletion is available directly through the Service, you may use that functionality.",
      "Deletion may not immediately remove information that we are legally required to retain or that is necessary to establish, exercise, or defend legal claims.",
      "Backups may also retain deleted information for a limited period until they are securely overwritten according to our backup lifecycle.",
      "Where technically and legally feasible, we will delete or anonymize information that no longer needs to be retained.",
    ],
  },
  {
    title: "11. Your Privacy Rights",
    content: [
      "Depending on where you live and which privacy laws apply, you may have rights including:",
      "• access to personal information;",
      "• correction of inaccurate information;",
      "• deletion;",
      "• restriction of processing;",
      "• objection to certain processing;",
      "• data portability;",
      "• withdrawal of consent;",
      "• objection to direct marketing;",
      "• information about processing activities; and",
      "• the right to lodge a complaint with a competent supervisory authority.",
      "These rights are not absolute and may be subject to legal exceptions.",
      "To exercise applicable rights, contact:",
      "supportnetsyra@gmail.com",
      "We may need to verify your identity before completing certain requests.",
    ],
  },
  {
    title: "12. European Economic Area and United Kingdom",
    content: [
      "If you are located in the European Economic Area or United Kingdom, additional rights and requirements may apply under applicable data-protection law.",
      "Where applicable, you may contact the relevant data-protection supervisory authority if you believe your rights have been violated.",
      "If Netsyra is required to appoint an EU or UK representative or Data Protection Officer, their details will be provided here:",
      "EU Representative: [IF APPLICABLE]",
      "UK Representative: [IF APPLICABLE]",
      "Data Protection Officer: [IF APPLICABLE]",
    ],
  },
  {
    title: "13. California Privacy Rights",
    content: [
      "If California privacy law applies to Netsyra and to your information, you may have additional rights concerning personal information.",
      "Depending on the circumstances, these may include rights to:",
      "• know or access categories and specific pieces of personal information;",
      "• delete personal information;",
      "• correct inaccurate personal information;",
      "• opt out of certain sales or sharing;",
      "• limit certain uses of sensitive personal information;",
      "• receive information about disclosures; and",
      "• exercise applicable rights without unlawful discrimination.",
      "Netsyra does not sell personal information for monetary consideration.",
      "Where applicable California law defines certain disclosures or activities as 'sharing,' Netsyra will provide any legally required opt-out mechanism.",
      "California residents may submit privacy requests by contacting:",
      "supportnetsyra@gmail.com",
    ],
  },
  {
    title: "14. Children's Privacy",
    content: [
      "Netsyra is not directed to children under 13.",
      "We do not knowingly collect personal information from children under 13 without legally required parental consent.",
      "If we learn that we have collected personal information from a child under 13 in circumstances where collection was not permitted, we will take reasonable steps to delete the information.",
      "If you believe a child has provided personal information to Netsyra, contact:",
      "supportnetsyra@gmail.com",
      "Depending on your jurisdiction, additional children's privacy laws may apply.",
    ],
  },
  {
    title: "15. Cookies and Similar Technologies",
    content: [
      "Netsyra may use cookies, local storage, session technologies, pixels, and similar technologies.",
      "These technologies may be used for:",
      "• authentication;",
      "• maintaining sessions;",
      "• security;",
      "• preferences;",
      "• functionality;",
      "• analytics;",
      "• performance monitoring; and",
      "• marketing, where permitted.",
      "Where applicable law requires consent for non-essential cookies or similar technologies, Netsyra will provide an appropriate consent mechanism.",
      "You may be able to control cookies through your browser settings.",
      "Disabling certain cookies may affect functionality.",
    ],
  },
  {
    title: "16. Security",
    content: [
      "We use reasonable technical and organizational safeguards designed to protect personal information against unauthorized access, alteration, disclosure, loss, or destruction.",
      "Depending on the information and system involved, safeguards may include:",
      "• encryption in transit;",
      "• encryption at rest where supported;",
      "• authentication controls;",
      "• authorization controls;",
      "• access restrictions;",
      "• monitoring;",
      "• logging;",
      "• security updates;",
      "• backups; and",
      "• incident-response procedures.",
      "No internet-based service can guarantee absolute security.",
      "You are also responsible for protecting your credentials, devices, API keys, and other access mechanisms.",
    ],
  },
  {
    title: "17. Data Breach and Security Incidents",
    content: [
      "If Netsyra experiences a security incident involving personal information, we will assess the incident and take reasonable steps required by applicable law.",
      "Where notification is legally required, we will notify affected individuals, regulators, or other parties within the timeframes and manner required by applicable law.",
    ],
  },
  {
    title: "18. Google User Data",
    content: [
      "Where Netsyra uses Google OAuth for authentication, we access only the information necessary for the authentication functionality that you authorize.",
      "Netsyra does not request access to Gmail, Google Drive, Google Calendar, or other Google services unless a separate feature expressly requests that permission and you authorize it.",
      "Netsyra's use and transfer of information received from Google APIs will comply with applicable Google API policies, including applicable Limited Use requirements.",
    ],
  },
  {
    title: "19. Third-Party Links",
    content: [
      "The Service may contain links to third-party websites and services.",
      "We are not responsible for the privacy practices, security, or content of third-party websites.",
      "You should review the privacy policy of each third-party service you use.",
    ],
  },
  {
    title: "20. Business and Enterprise Customers",
    content: [
      "If an organization uses Netsyra to process personal data on behalf of its users, the organization may determine the purposes and means of processing.",
      "In those circumstances, Netsyra may act as a service provider or processor depending on the applicable law and contractual arrangement.",
      "Enterprise customers may be required to enter into additional data-processing, security, confidentiality, or other agreements.",
    ],
  },
  {
    title: "21. Your Responsibilities Regarding Personal Data",
    content: [
      "You are responsible for ensuring that you have the necessary rights and lawful basis to submit personal information to Netsyra.",
      "You should not submit personal information that you are prohibited from sharing or that is unnecessary for the requested task.",
      "If you use Netsyra on behalf of an organization, you are responsible for following your organization's policies and applicable privacy requirements.",
    ],
  },
  {
    title: "22. Changes to This Privacy Policy",
    content: [
      "We may update this Privacy Policy when our practices, services, technology, legal obligations, or business circumstances change.",
      "If we make material changes, we will provide reasonable notice through the Service, by email, or by another legally appropriate method where required.",
      "The updated policy will include a new 'Last Updated' date.",
      "We will not materially expand our use of personal information in a manner inconsistent with applicable law without providing any notice or consent required by law.",
    ],
  },
  {
    title: "23. Contact Us",
    content: [
      "For privacy questions, requests, complaints, or data-rights requests:",
      "Netsyra AI",
      "Email: supportnetsyra@gmail.com",
      "Website: https://www.netsyraai.com",
      "Legal Entity: [LEGAL ENTITY NAME]",
      "Registered Address: [LEGAL BUSINESS ADDRESS]",
      "If you are located in a jurisdiction that provides a right to lodge a complaint with a data-protection authority, you may also contact the appropriate supervisory authority.",
      "This Privacy Policy should be read together with the Netsyra AI Terms of Service.",
    ],
  },
];

export default function PrivacyPage() {
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
          <Link href="/privacy" className="text-sm text-white font-medium">
            Privacy
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
              Privacy Policy
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
              Netsyra AI ("Netsyra," "we," "us," or "our") respects your privacy and is committed to protecting personal information entrusted to us. This Privacy Policy explains how we collect, use, disclose, retain, and protect information when you visit netsyraai.com, create an account, use Netsyra AI, interact with our applications or APIs, or otherwise use our services (collectively, the "Service").
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              The Service is operated by: [LEGAL ENTITY NAME] – Doing business as Netsyra AI – Address: [LEGAL BUSINESS ADDRESS] – Privacy Contact: <a href="mailto:supportnetsyra@gmail.com" className="text-[#6c5ce7] hover:text-[#8b7cf7] transition">supportnetsyra@gmail.com</a>
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
                {section.content.map((line, i) => (
                  <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed">
                    {line.startsWith("•") ? (
                      <span className="flex items-start gap-3">
                        <span className="text-[#6c5ce7] mt-1">•</span>
                        <span>{line.replace("• ", "")}</span>
                      </span>
                    ) : line.startsWith("support@") || line.includes("@") ? (
                      <a
                        href={`mailto:${line.replace(/^Email:\s*/, "").trim()}`}
                        className="text-[#6c5ce7] hover:text-[#8b7cf7] transition"
                      >
                        {line}
                      </a>
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}

          {/* ── Footer ── */}
          <motion.div variants={item} className="text-center text-gray-500 text-sm pt-6 border-t border-white/5">
            <p>© 2026 Netsyra AI. All rights reserved.</p>
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