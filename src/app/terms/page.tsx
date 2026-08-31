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
    title: "1. Eligibility",
    content: [
      "You must be legally capable of entering into a binding agreement to use the Service.",
      "If you are using the Service on behalf of a company, organization, or other legal entity, you represent and warrant that you have authority to bind that entity to these Terms.",
      "The Service is not intended for children under 13 years of age. If you are under the minimum age required to legally use the Service in your jurisdiction, you may use the Service only with the involvement and authorization of a parent or legal guardian where permitted by applicable law.",
      "We may impose additional age or eligibility requirements where required by applicable law.",
    ],
  },
  {
    title: "2. The Service",
    content: [
      "Netsyra AI provides an artificial-intelligence orchestration platform that may analyze requests and route them to one or more AI models, tools, search systems, software services, or other processing providers.",
      "Depending on the product, plan, configuration, and availability, the Service may provide:",
      "• conversational AI;",
      "• AI-generated text and other content;",
      "• coding and software-development assistance;",
      "• repository and document analysis;",
      "• web or real-time information retrieval;",
      "• automated workflows;",
      "• autonomous or agentic functionality;",
      "• model selection and routing;",
      "• memory and conversation-history features;",
      "• APIs, SDKs, and developer functionality; and",
      "• other AI-related capabilities introduced from time to time.",
      "The specific models, providers, capabilities, limits, and availability may change over time.",
    ],
  },
  {
    title: "3. AI-Generated Content",
    content: [
      "The Service uses artificial-intelligence systems to generate responses and other outputs.",
      "AI-generated output may be inaccurate, incomplete, outdated, biased, misleading, or unsuitable for a particular purpose. The Service may produce plausible-sounding information that is incorrect.",
      "You are solely responsible for evaluating AI-generated output before relying on it, publishing it, executing it, distributing it, or using it for any consequential purpose.",
      "Netsyra does not represent or warrant that AI-generated output is:",
      "• accurate;",
      "• complete;",
      "• current;",
      "• unique;",
      "• suitable for your particular purpose;",
      "• free from errors;",
      "• free from third-party intellectual-property claims; or",
      "• appropriate for legal, medical, financial, security, employment, educational, or other high-impact decisions.",
      "You must not rely on the Service as a substitute for qualified professional advice.",
    ],
  },
  {
    title: "4. High-Risk and Professional Uses",
    content: [
      "Unless expressly agreed otherwise in writing, the Service is not designed or intended to replace qualified professionals or independently validated systems in circumstances where an error could reasonably result in significant injury, financial loss, legal consequences, loss of rights, or other material harm.",
      "You are responsible for implementing appropriate human review, testing, validation, access controls, and other safeguards when using the Service in consequential environments.",
    ],
  },
  {
    title: "5. Accounts",
    content: [
      "Certain features require an account.",
      "You agree to provide information that is accurate and reasonably current and to keep your account information updated.",
      "You are responsible for maintaining the confidentiality of your credentials and for activity occurring through your account, except to the extent that applicable law provides otherwise.",
      "You must promptly notify us if you believe your account has been compromised or used without authorization.",
      "You may not:",
      "• share account credentials in a manner that circumvents plan limits;",
      "• impersonate another person or entity;",
      "• create accounts for fraudulent purposes;",
      "• use another person's account without authorization; or",
      "• create accounts for the purpose of evading suspension or enforcement actions.",
    ],
  },
  {
    title: "6. Your Content",
    content: [
      "\"Your Content\" means information, text, prompts, files, code, documents, data, instructions, or other material that you submit to or through the Service.",
      "You retain your rights in Your Content, subject to the rights necessary for us and our service providers to operate the Service.",
      "You grant Netsyra a limited, non-exclusive, worldwide, royalty-free license to host, reproduce, transmit, process, modify as technically necessary, and otherwise use Your Content solely to:",
      "1. provide and operate the Service;",
      "2. authenticate and maintain your account;",
      "3. process requests and generate responses;",
      "4. maintain conversation history and memory features that you enable;",
      "5. provide customer support;",
      "6. maintain security and prevent abuse;",
      "7. monitor and improve the reliability, performance, and functionality of the Service; and",
      "8. comply with legal obligations.",
      "We will not use Your Content for purposes beyond those described in our Privacy Policy without an appropriate legal basis or notice where required by applicable law.",
    ],
  },
  {
    title: "7. Third-Party AI Providers",
    content: [
      "Netsyra may use third-party AI model providers, infrastructure providers, search providers, authentication providers, payment processors, analytics providers, hosting providers, and other service providers.",
      "Your requests may therefore be transmitted to third-party providers when necessary to provide a requested feature.",
      "The models available through Netsyra may be operated by companies other than Netsyra. Their services may be subject to their own terms, policies, technical limitations, and data-processing practices.",
      "We do not guarantee the continued availability of any particular model or provider.",
      "We may change, replace, add, or remove providers and models when reasonably necessary to operate, secure, improve, or maintain the Service.",
    ],
  },
  {
    title: "8. Acceptable Use",
    content: [
      "You may use the Service only in compliance with these Terms and applicable law.",
      "You must not use the Service to:",
      "• violate any applicable law or regulation;",
      "• infringe, misappropriate, or violate another person's intellectual-property, privacy, publicity, contractual, or other rights;",
      "• commit fraud, deception, harassment, abuse, or impersonation;",
      "• distribute malware, ransomware, spyware, or other malicious software;",
      "• obtain unauthorized access to systems, accounts, networks, or data;",
      "• interfere with or disrupt the Service or its infrastructure;",
      "• probe, scan, or test systems for vulnerabilities without authorization;",
      "• circumvent authentication, security controls, rate limits, quotas, or other technical restrictions;",
      "• reverse engineer the Service except to the extent such restriction is prohibited by applicable law;",
      "• use the Service to develop or operate unlawful surveillance;",
      "• use the Service to facilitate exploitation or abuse of children;",
      "• generate or distribute content that violates applicable law;",
      "• intentionally submit highly sensitive personal information when it is unnecessary for the requested task;",
      "• use automated methods to create accounts or consume resources in a manner that circumvents limits;",
      "• resell or sublicense access to the Service unless expressly authorized;",
      "• use the Service to benchmark or publicly evaluate it for competitive purposes where prohibited by an applicable plan or agreement;",
      "• use the Service to make automated decisions about people where doing so would violate applicable law; or",
      "• attempt to use the Service in a manner that creates unreasonable security, operational, or financial risk to Netsyra or others.",
      "We may take reasonable measures to investigate and prevent abuse.",
    ],
  },
  {
    title: "9. Security Research",
    content: [
      "Nothing in these Terms is intended to prohibit good-faith security research conducted in accordance with applicable law and any security disclosure program expressly provided by Netsyra.",
      "You must not access, modify, disrupt, or exfiltrate systems or data without authorization.",
    ],
  },
  {
    title: "10. Developer and API Use",
    content: [
      "If Netsyra provides API or developer access, you must protect API credentials and must not expose private credentials in publicly accessible source code, client-side applications, repositories, logs, or other insecure locations.",
      "You are responsible for applications that you build using the Service, including their security, authentication, authorization, rate limiting, user disclosures, and compliance obligations.",
      "API usage may be subject to additional technical limits, documentation, pricing, and service-specific terms.",
    ],
  },
  {
    title: "11. Free and Paid Plans",
    content: [
      "Certain features may be offered under free, trial, promotional, or paid plans.",
      "Plans may differ in:",
      "• model availability;",
      "• message limits;",
      "• token limits;",
      "• context limits;",
      "• web-search access;",
      "• storage;",
      "• API access;",
      "• rate limits;",
      "• response priority;",
      "• features; and",
      "• other usage restrictions.",
      "We may impose reasonable technical limits to prevent abuse and maintain service availability.",
      "Limits may be changed prospectively, subject to applicable law and any contractual commitments that expressly provide otherwise.",
    ],
  },
  {
    title: "12. Subscriptions and Payments",
    content: [
      "Paid features are subject to the pricing presented at the time of purchase.",
      "Where applicable, subscriptions automatically renew for the selected billing period unless cancelled before renewal.",
      "You authorize the applicable payment processor to charge the payment method associated with your subscription.",
      "Netsyra may use third-party payment processors. Netsyra generally does not receive or store complete payment-card numbers when payment processing is handled directly by a third-party payment processor.",
      "Taxes, duties, or other governmental charges may apply depending on your location and applicable law.",
      "If a payment fails, we may restrict or suspend paid features until the outstanding amount is resolved.",
    ],
  },
  {
    title: "13. Refunds and Cancellation",
    content: [
      "You may cancel a subscription in accordance with the cancellation process made available through the Service or the applicable payment processor.",
      "Cancellation generally prevents future renewal but does not necessarily provide a refund for the current billing period.",
      "Refund rights may vary depending on applicable consumer-protection law and the payment terms presented at purchase.",
      "Where applicable law grants a mandatory cancellation, withdrawal, refund, or other consumer right, those rights are not excluded by these Terms.",
      "Any additional refund rules are described in our Refund Policy, where applicable.",
    ],
  },
  {
    title: "14. Intellectual Property",
    content: [
      "The Service, including its software, interfaces, designs, branding, documentation, proprietary routing systems, system architecture, system prompts, non-user-generated content, and other materials provided by Netsyra, is owned by or licensed to Netsyra and is protected by applicable intellectual-property laws.",
      "Except as expressly permitted by these Terms, you may not copy, reproduce, distribute, modify, create derivative works from, publicly display, sell, sublicense, or commercially exploit Netsyra's proprietary materials.",
      "\"Netsyra AI,\" \"Netsyra,\" associated logos, names, designs, and branding are trademarks or identifiers of Netsyra or their respective owners.",
      "Nothing in these Terms transfers ownership of Netsyra's intellectual property to you.",
    ],
  },
  {
    title: "15. Your Feedback",
    content: [
      "If you provide suggestions, ideas, bug reports, or other feedback regarding the Service, you grant Netsyra a perpetual, worldwide, irrevocable, royalty-free right to use that feedback for any lawful purpose without compensation or attribution, provided that we do not disclose your confidential information in doing so.",
    ],
  },
  {
    title: "16. Third-Party Services and Links",
    content: [
      "The Service may contain integrations, links, or functionality provided by third parties.",
      "Third-party services are governed by their own terms and policies.",
      "Netsyra is not responsible for third-party services that it does not control, including their availability, security, accuracy, content, or data practices.",
    ],
  },
  {
    title: "17. Availability and Changes",
    content: [
      "We work to keep the Service available and reliable, but we do not guarantee uninterrupted or error-free operation.",
      "The Service may be temporarily unavailable because of maintenance, infrastructure failures, provider outages, security incidents, network problems, or circumstances beyond our reasonable control.",
      "AI models and third-party services may change or become unavailable without notice where reasonably necessary.",
      "We may modify, suspend, or discontinue features of the Service.",
    ],
  },
  {
    title: "18. Beta and Experimental Features",
    content: [
      "Some features may be identified as beta, experimental, preview, research, or otherwise not generally available.",
      "Such features may contain errors or limitations and may be changed or discontinued at any time.",
      "You should not rely on experimental features for critical operations unless we expressly state otherwise.",
    ],
  },
  {
    title: "19. Confidentiality",
    content: [
      "If you use Netsyra in a business context, you should avoid submitting confidential information unless the Service and applicable contractual terms are specifically designed to support such use.",
      "These Terms do not create a general confidentiality obligation covering all information submitted to the Service unless expressly agreed in a separate written agreement.",
      "For enterprise customers, additional confidentiality and data-processing terms may be available under a separate agreement.",
    ],
  },
  {
    title: "20. Privacy",
    content: [
      "Our collection and use of personal information is described in the Netsyra AI Privacy Policy.",
      "The Privacy Policy forms part of these Terms by reference.",
      "You should review it carefully before using the Service.",
    ],
  },
  {
    title: "21. Data Protection",
    content: [
      "Where applicable, Netsyra will process personal data in accordance with applicable data-protection laws.",
      "If you use the Service to process personal data on behalf of another person or organization, you are responsible for ensuring that you have an appropriate legal basis and the necessary rights and instructions to submit that data.",
      "Where required by applicable law or contract, Netsyra may enter into an appropriate data-processing agreement.",
    ],
  },
  {
    title: "22. Copyright Complaints",
    content: [
      "If you believe content available through the Service infringes your copyright, you may contact us at:",
      "supportnetsyra@gmail.com",
      "Your notice should include sufficient information to identify the copyrighted work, the allegedly infringing material, your contact information, and the information required by applicable copyright law.",
    ],
  },
  {
    title: "23. Suspension and Termination",
    content: [
      "You may stop using the Service at any time.",
      "We may suspend or terminate access where reasonably necessary because of:",
      "• material violation of these Terms;",
      "• unlawful use;",
      "• fraud or abuse;",
      "• security threats;",
      "• payment failure;",
      "• attempts to circumvent restrictions;",
      "• activity that creates significant risk to the Service or other users; or",
      "• legal or regulatory requirements.",
      "Where appropriate and reasonably practicable, we may provide notice and an opportunity to remedy the violation before termination.",
      "Upon termination, your right to use the Service ends.",
      "Certain provisions that by their nature should survive termination will remain effective, including provisions concerning intellectual property, disclaimers, limitation of liability, indemnification, dispute resolution, and outstanding payment obligations.",
    ],
  },
  {
    title: "24. Disclaimers",
    content: [
      "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS.",
      "NETSYRA DISCLAIMS ALL WARRANTIES NOT EXPRESSLY PROVIDED IN THESE TERMS, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, AND WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.",
      "WE DO NOT WARRANT THAT THE SERVICE OR AI OUTPUTS WILL BE UNINTERRUPTED, SECURE, ACCURATE, COMPLETE, RELIABLE, CURRENT, OR ERROR-FREE.",
      "NOTHING IN THESE TERMS EXCLUDES OR LIMITS A WARRANTY OR RIGHT THAT CANNOT LAWFULLY BE EXCLUDED OR LIMITED.",
    ],
  },
  {
    title: "25. Limitation of Liability",
    content: [
      "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NETSYRA AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AFFILIATES, CONTRACTORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, BUSINESS OPPORTUNITY, OR ANTICIPATED SAVINGS ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE.",
      "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE TOTAL AGGREGATE LIABILITY OF NETSYRA ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF:",
      "(a) THE AMOUNT YOU PAID TO NETSYRA FOR THE SERVICE DURING THE TWELVE MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM; OR",
      "(b) USD $100.",
      "This limitation does not apply to liability that cannot legally be limited or excluded under applicable law.",
    ],
  },
  {
    title: "26. Indemnification",
    content: [
      "To the maximum extent permitted by applicable law, you agree to defend, indemnify, and hold harmless Netsyra and its officers, directors, employees, affiliates, contractors, and service providers from claims, liabilities, damages, losses, and reasonable expenses arising from:",
      "• your violation of these Terms;",
      "• your unlawful use of the Service;",
      "• Your Content;",
      "• your violation of another person's rights; or",
      "• applications or products that you build using the Service.",
      "This provision applies only to the extent permitted by applicable law and does not require you to indemnify Netsyra for Netsyra's own unlawful conduct.",
    ],
  },
  {
    title: "27. Dispute Resolution and Governing Law",
    content: [
      "These Terms are governed by the laws of [GOVERNING JURISDICTION], without regard to conflict-of-law principles, except to the extent mandatory consumer-protection laws require otherwise.",
      "Before filing a formal legal claim, you agree to contact Netsyra at supportnetsyra@gmail.com and provide a reasonable opportunity to resolve the dispute informally.",
      "Nothing in this section prevents a consumer from exercising mandatory rights available under the laws of the consumer's jurisdiction.",
      "[FINAL GOVERNING-LAW / ARBITRATION / COURT-JURISDICTION CLAUSE TO BE COMPLETED AFTER CONFIRMING NETSYRA'S LEGAL ENTITY AND JURISDICTION.]",
    ],
  },
  {
    title: "28. Changes to These Terms",
    content: [
      "We may update these Terms from time to time.",
      "If we make material changes, we will provide reasonable notice through the Service, by email, or by another appropriate method where required by law.",
      "The updated Terms will state their effective date.",
      "Your continued use of the Service after the effective date means that you accept the updated Terms, except where applicable law requires additional consent.",
      "We will not use a retroactive change to these Terms to authorize materially different privacy or data practices without providing any notice or consent required by applicable law.",
    ],
  },
  {
    title: "29. Severability",
    content: [
      "If any provision of these Terms is determined to be invalid, unlawful, or unenforceable, that provision will be enforced to the maximum extent permitted by law and the remaining provisions will remain in effect.",
    ],
  },
  {
    title: "30. No Waiver",
    content: [
      "A failure to enforce any provision of these Terms does not constitute a waiver of that provision or our right to enforce it later.",
    ],
  },
  {
    title: "31. Entire Agreement",
    content: [
      "These Terms, together with the Privacy Policy and any additional terms expressly incorporated into the Service, constitute the agreement between you and Netsyra concerning your use of the Service, unless a separate written agreement applies.",
    ],
  },
  {
    title: "32. Assignment",
    content: [
      "You may not assign or transfer your rights or obligations under these Terms without our prior written consent, except where prohibited by applicable law.",
      "Netsyra may assign these Terms in connection with a merger, acquisition, corporate restructuring, sale of assets, or similar transaction.",
    ],
  },
  {
    title: "33. Contact",
    content: [
      "For questions concerning these Terms:",
      "Netsyra AI",
      "Email: supportnetsyra@gmail.com",
      "Website: https://www.netsyraai.com",
      "Legal Entity: [LEGAL ENTITY NAME]",
      "Registered Address: [LEGAL BUSINESS ADDRESS]",
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
              These Terms of Service ("Terms") govern your access to and use of Netsyra AI, including the website, applications, APIs, AI assistants, model-routing services, coding tools, web-search functionality, autonomous or agentic features, and related products and services (collectively, the "Service").
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              The Service is provided by <strong>[LEGAL ENTITY NAME]</strong>, doing business as <strong>Netsyra AI</strong> ("Netsyra," "we," "us," or "our").
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              <strong>Registered Address:</strong> [LEGAL BUSINESS ADDRESS]<br />
              <strong>Contact:</strong> <a href="mailto:supportnetsyra@gmail.com" className="text-[#6c5ce7] hover:text-[#8b7cf7] transition">supportnetsyra@gmail.com</a>
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              By creating an account, accessing the Service, purchasing a subscription, or otherwise using the Service, you agree to these Terms and our Privacy Policy. If you do not agree to these Terms, you must not access or use the Service.
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
                  // Numbered list (e.g., "1. provide...")
                  if (/^\d+\./.test(line)) {
                    return (
                      <p key={i} className="text-gray-300 text-sm md:text-base leading-relaxed flex items-start gap-3">
                        <span className="text-[#6c5ce7] mt-1 font-mono">{line.match(/^\d+\./)?.[0]}</span>
                        <span>{line.replace(/^\d+\.\s*/, "")}</span>
                      </p>
                    );
                  }
                  // Email lines
                  if (line.includes("@") && (line.includes("support@") || line.includes("Email:"))) {
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