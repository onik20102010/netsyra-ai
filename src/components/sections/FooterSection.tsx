"use client";
import Link from "next/link";
import { Zap, Cpu, BrainCircuit, Globe, Code, Sparkles, Shield } from "lucide-react";

const modelLinks = [
  { name: "N Fast", href: "/chat?model=fast", icon: Zap },
  { name: "N Plus", href: "/chat?model=plus", icon: Cpu },
  { name: "N Pro", href: "/chat?model=pro", icon: BrainCircuit },
  { name: "N Live", href: "/chat?model=live", icon: Globe },
  { name: "N Code", href: "/chat?model=code", icon: Code },
];

export default function FooterSection() {
  return (
    <footer className="relative bg-[#050505] border-t border-white/5 py-16 px-4 select-none">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center p-1 ring-1 ring-purple-500/20">
                <img src="/logo.png" alt="Netsyra" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-bold text-white">Netsyra AI</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs">
              Intelligent AI orchestration platform. Route every prompt to the perfect model.
            </p>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-white/30 hover:text-white/70 transition text-sm">About Us</Link></li>
              <li><Link href="/goal" className="text-white/30 hover:text-white/70 transition text-sm">Our Goal</Link></li>
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
                  href="mailto:onik20102010@gmail.com"
                  className="text-white/30 hover:text-white/70 transition text-sm"
                >
                  onik20102010@gmail.com
                </a>
              </li>
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