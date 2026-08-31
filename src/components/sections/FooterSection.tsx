"use client";
import Link from "next/link";
import { Zap, Cpu, BrainCircuit, Globe, Code, Sparkles, Shield, Bot } from "lucide-react";

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.59l5.44 7.2 5.87-7.2Zm-1.29 19.5h2.04L6.48 3.24H4.29l13.32 17.41Z" />
    </svg>
  );
}

const socialLinks = [
  { name: "YouTube Channel", href: "https://www.youtube.com", Icon: YouTubeIcon },
  { name: "X Account", href: "https://x.com/ONIKMAN777", Icon: XIcon },
];

const modelLinks = [
  { name: "N Fast", href: "/chat?model=fast", icon: Zap },
  { name: "N Plus", href: "/chat?model=plus", icon: Cpu },
  { name: "N Pro", href: "/chat?model=pro", icon: BrainCircuit },
  { name: "N Live", href: "/chat?model=live", icon: Globe },
  { name: "N Code", href: "/chat?model=code", icon: Code },
  { name: "N AAI", href: "/chat?model=aai", icon: Bot },
  { name: "N Auto", href: "/chat?model=auto", icon: Sparkles },
];

export default function FooterSection() {
  return (
    <footer className="relative bg-[#050505] border-t border-white/5 py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center p-1 ring-1 ring-purple-500/20">
                <img src="/logo.png" alt="Netsyra AI logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-bold text-white">Netsyra AI</span>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-white/30 hover:text-white/70 transition text-sm">About Us</Link></li>
              <li><Link href="/goal" className="text-white/30 hover:text-white/70 transition text-sm">Our Goal</Link></li>
              <li><Link href="/brand" className="text-white/30 hover:text-white/70 transition text-sm">Brand Assets</Link></li>
              <li><Link href="/legal" className="text-white/30 hover:text-white/70 transition text-sm">Legal Notice</Link></li>
              <li><Link href="/terms" className="text-white/30 hover:text-white/70 transition text-sm">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-white/30 hover:text-white/70 transition text-sm">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* AI Models */}
          <div className="space-y-3">
            <h4 className="text-white/60 text-sm font-semibold uppercase tracking-wider">AI Models</h4>
            <ul className="space-y-2">
              {modelLinks.map((model) => (
                <li key={model.name}>
                  <Link
                    href={model.href}
                    className="text-white/30 hover:text-white/70 transition text-sm flex items-center gap-2"
                  >
                    <model.icon className="w-3.5 h-3.5" />
                    {model.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:supportnetsyra@gmail.com"
                  className="text-white/30 hover:text-white/70 transition text-sm"
                >
                  supportnetsyra@gmail.com
                </a>
              </li>
            </ul>

            <h4 className="text-white/60 text-sm font-semibold uppercase tracking-wider pt-3">Follow</h4>
            <ul className="space-y-2">
              {socialLinks.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/30 hover:text-white/70 transition text-sm flex items-center gap-2"
                  >
                    <social.Icon className="w-3.5 h-3.5" />
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} Netsyra AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <Shield className="w-3 h-3" />
            <span>Protected by intellectual property laws</span>
          </div>
        </div>
      </div>
    </footer>
  );
}