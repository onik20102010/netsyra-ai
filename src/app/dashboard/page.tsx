// src/app/dashboard/page.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Home, MessageSquare, LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

// ── Policy data ────────────────────────────────────────
const sections = [
  {
    title: "TERMS OF SERVICE",
    subtitle: "Last Updated: June 1, 2026",
  },
  {
    title: "1. INTRODUCTION",
    content: [
      `Welcome to Netsyra AI ("Company," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the Netsyra AI website, platform, AI orchestration services, and any related tools or features (collectively, the "Services").`,
      `By accessing or using the Services, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Services.`,
      `These Terms constitute a legally binding agreement between you ("User" or "you") and Netsyra AI. Our Privacy Policy explains how we collect, use, and protect your personal information.`,
    ],
  },
  {
    title: "2. ELIGIBILITY",
    content: [
      `You must be at least 13 years of age to use the Services. If you are under the age of majority in your jurisdiction, you must have the consent of a parent or legal guardian. By using the Services, you represent and warrant that you meet these eligibility requirements and that you will comply with all applicable local, state, national, and international laws and regulations.`,
    ],
  },
  {
    title: "3. USER ACCOUNTS",
    content: [
      `3.1 Account Creation. To access certain features of the Services, you must create an account by providing accurate, current, and complete information, including a valid email address. You may also sign up using third-party authentication services such as Google.`,
      `3.2 Account Security. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.`,
      `3.3 Responsibility for Account Activity. You are fully responsible for all actions taken through your account, including any content generated, messages sent, or configurations made. We are not liable for any loss or damage arising from your failure to safeguard your account.`,
    ],
  },
  {
    title: "4. ACCEPTABLE USE",
    content: [
      `You agree not to use the Services for any unlawful purpose or in violation of these Terms. Prohibited conduct includes, but is not limited to:`,
      `4.1 Illegal Activities. Using the Services to engage in fraud, scams, identity theft, money laundering, or any criminal activity.`,
      `4.2 Harmful Content. Generating, uploading, or distributing content that promotes violence, terrorism, exploitation of minors, harassment, hate speech, or other harmful material.`,
      `4.3 Cyber Abuse. Uploading malware, viruses, ransomware, or other malicious code. Attempting to steal credentials, phishing, or engaging in denial-of-service attacks.`,
      `4.4 Spam and Unsolicited Messages. Sending mass unsolicited messages, spam, or using the Services for any form of automated abuse.`,
      `4.5 Intellectual Property Violations. Infringing upon copyrights, trademarks, patents, trade secrets, or other intellectual property rights of any third party.`,
      `4.6 Platform Abuse. Circumventing rate limits, scraping, using automated scripts, reselling access to the Services without explicit written permission, or attempting to gain unauthorized access to our systems, networks, or data.`,
      `4.7 Unauthorized Access. Probing, scanning, or testing the vulnerability of any system or network connected to the Services.`,
    ],
  },
  {
    title: "5. AI OUTPUT DISCLAIMER",
    content: [
      `This is an artificial intelligence platform. By using the Services, you acknowledge and agree that:`,
      `5.1 No Guaranteed Accuracy. AI-generated content may contain errors, inaccuracies, or outdated information. The output should not be relied upon as factual or complete without independent verification.`,
      `5.2 No Professional Advice. The Services do not provide legal, medical, financial, accounting, engineering, or other professional advice. Any AI-generated content related to these fields is provided for informational purposes only and should be reviewed by a qualified professional.`,
      `5.3 User Responsibility. You are solely responsible for evaluating the accuracy, completeness, and appropriateness of any AI-generated content. Decisions made based on such content are at your own risk.`,
      `5.4 No High-Risk Use. You may not use the Services for high-risk applications, including but not limited to: medical diagnosis, emergency response, life-support systems, critical infrastructure management, autonomous weapons systems, or any application where failure could result in death, personal injury, or catastrophic damage.`,
    ],
  },
  {
    title: "6. USER CONTENT",
    content: [
      `6.1 Ownership. You retain all ownership rights to the content you upload, submit, or generate through the Services ("User Content"). We do not claim ownership over your User Content.`,
      `6.2 License to Process. By using the Services, you grant us a limited, non-exclusive, worldwide license to process, store, and transmit your User Content solely as necessary to provide the Services to you. This license ends when you delete your account or your User Content.`,
      `6.3 Your Representations. You represent and warrant that you have all necessary rights and permissions to submit your User Content, and that your User Content does not violate any third-party rights or applicable laws.`,
    ],
  },
  {
    title: "7. INTELLECTUAL PROPERTY",
    content: [
      `7.1 Our IP. All rights, title, and interest in and to the Services, including but not limited to the Netsyra AI name, logo, branding, website, software, APIs, algorithms, models, documentation, and any related materials, are and will remain the exclusive property of Netsyra AI and its licensors.`,
      `7.2 Restrictions. You may not copy, modify, distribute, sell, lease, reverse engineer, decompile, or create derivative works of the Services or any part thereof without our express written permission.`,
    ],
  },
  {
    title: "8. ACCOUNT SUSPENSION",
    content: [
      `We reserve the right to suspend or terminate your access to the Services, in whole or in part, without prior notice, if we determine that you have:`,
      `• Violated these Terms`,
      `• Engaged in abusive, fraudulent, or illegal conduct`,
      `• Created a security risk or technical burden for our systems`,
      `• Infringed upon the intellectual property of others`,
      `• Otherwise acted in a manner inconsistent with the intended use of the Services`,
    ],
  },
  {
    title: "9. LIMITATION OF LIABILITY",
    content: [
      `To the maximum extent permitted by applicable law, Netsyra AI, its officers, directors, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, arising from or related to your use of the Services.`,
      `Our total aggregate liability for any claims arising from these Terms or the Services shall not exceed the amount you have paid us, if any, in the twelve months preceding the claim.`,
    ],
  },
  {
    title: "10. TERMINATION",
    content: [
      `10.1 By You. You may stop using the Services at any time and may request deletion of your account by contacting us. Upon termination, your right to use the Services will cease immediately.`,
      `10.2 By Us. We may terminate or suspend your account and access to the Services at any time, with or without cause, with or without notice. Upon termination, we may retain certain information as required by law or for legitimate business purposes.`,
      `10.3 Effect of Termination. Upon termination, all rights granted to you under these Terms will immediately end, and you must cease all use of the Services.`,
    ],
  },
  {
    title: "11. CHANGES TO THESE TERMS",
    content: [
      `We may modify these Terms at any time by posting the updated version on our website. The updated Terms will be effective as of the "Last Updated" date indicated at the top. Your continued use of the Services after any changes constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.`,
    ],
  },
  {
    title: "12. CHILDREN'S PRIVACY",
    content: [
      `The Services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected such information, we will delete it promptly.`,
    ],
  },
  {
    title: "13. CONTACT INFORMATION",
    content: [
      `If you have any questions, concerns, or feedback regarding these Terms, please contact us at:`,
      `Email: onik20102010@gmail.com`,
    ],
  },
  {
    title: "14. ADDITIONAL AI-SPECIFIC CLAUSES",
    content: [
      `14.1 No Guaranteed Accuracy. AI-generated content may contain inaccuracies, hallucinations, or fabricated information. You must independently verify any important information.`,
      `14.2 No Professional Advice. The Services do not provide legal, medical, financial, accounting, or other professional advice. Consult a qualified professional for such matters.`,
      `14.3 User Responsibility. You are solely responsible for any decisions, actions, or outcomes resulting from your reliance on AI-generated content.`,
      `14.4 No High-Risk Use. You may not use the Services for: medical diagnosis, emergency response, life-support systems, critical infrastructure management, autonomous weapons, or any application where inaccuracy or failure could result in serious harm or death.`,
    ],
  },
];

// ── Animation variants ────────────────────────────────────
const sectionVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const paragraphVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // 3D tilt effect on cards (simple mouse tracking)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardRefs.current;
    const handlers: ((e: MouseEvent) => void)[] = [];
    cards.forEach((card, i) => {
      if (!card) return;
      const onMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rotX = y * -6;
        const rotY = x * 6;
        card.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.01,1.01,1.01)`;
      };
      const onLeave = () => {
        card.style.transform = "perspective(1200px) rotateX(0) rotateY(0) scale3d(1,1,1)";
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      handlers.push(onMove, onLeave);
    });
    return () => {
      cards.forEach((card, i) => {
        if (!card) return;
        card.removeEventListener("mousemove", handlers[i * 2]);
        card.removeEventListener("mouseleave", handlers[i * 2 + 1]);
      });
    };
  }, []);

  return (
    <div className="space-y-16">
      {/* ── Dashboard hero ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const }}
        className="text-center mb-24"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center p-2 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/5">
            <img src="/logo.png" alt="Netsyra" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="text-3xl font-light text-white mb-2">Welcome back</h1>
        <p className="text-sm text-white/30 mb-10">
          Signed in as <span className="text-white/60 font-medium">{user?.email}</span>
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <Home className="w-4 h-4" />
              Home
            </motion.button>
          </Link>
          <Link href="/chat">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500/[0.05] border border-indigo-500/10 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/[0.08] transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
              <Sparkles className="w-3.5 h-3.5 opacity-50" />
            </motion.button>
          </Link>
        </div>

        <button
          onClick={async () => { await signOut(); router.push("/login"); }}
          className="mt-8 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-full text-white/20 hover:text-white/60 hover:bg-white/[0.03] transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </motion.div>

      {/* ── Policy content ───────────────────────────────── */}
      <div className="space-y-16">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            ref={(el) => { cardRefs.current[idx] = el; }}
            variants={sectionVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5"
          >
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              {section.title}
            </h2>
            {section.subtitle && (
              <motion.p
                variants={paragraphVariant}
                className="text-gray-400 font-mono text-sm mt-1"
              >
                {section.subtitle}
              </motion.p>
            )}
            <div className="space-y-3 mt-4">
              {section.content && section.content.map((text, pIdx) => (
                <motion.p
                  key={pIdx}
                  variants={paragraphVariant}
                  className="text-gray-300 leading-relaxed"
                >
                  {text}
                </motion.p>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Important Notes Grid (SVG icons) */}
        <motion.div
          variants={sectionVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10"
        >
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Important Notes
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: "M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4zM18 16l-4-4 4-4 1.5 1.5L17 12l2.5 2.5z", label: "Please read carefully" },
              { icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", label: "Legally binding agreement" },
              { icon: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z", label: "Protects both you and us" },
              { icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm1-13h-2v6l5.25 3.15L17 12.23l-4-2.37V7z", label: "Ensures safe AI experience" },
              { icon: "M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z", label: "Updated regularly" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                <svg className="w-8 h-8 text-gray-400 mb-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d={item.icon} />
                </svg>
                <span className="text-xs text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Need Help */}
        <motion.div
          variants={sectionVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-white">Need Help?</h3>
              <p className="text-gray-400 text-sm">
                If you have any questions, feel free to contact us.<br />
                <a href="mailto:onik20102010@gmail.com" className="text-gray-300 hover:text-white transition">onik20102010@gmail.com</a>
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full text-white font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
            <span>I agree &amp; Continue</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </button>
        </motion.div>

        <motion.p
          variants={sectionVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-gray-500 text-sm text-center pt-10"
        >
          This document was last updated on June 1, 2026.
        </motion.p>
      </div>
    </div>
  );
}