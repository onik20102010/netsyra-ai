"use client";
import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Zap, Globe, Bot, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import IntelligenceField from './IntelligenceField';

export default function HeroSection() {
  const [particles, setParticles] = useState<Array<{ top: string; left: string; delay: string }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      top: `${8 + (i * 7.5)}%`,
      left: `${3 + (i * 8)}%`,
      delay: `${i * 0.4}s`,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" aria-label="Hero">
      {/* Living Intelligence Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#080809]" />
        
        {/* Aurora gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[300px] opacity-[0.07] bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-transparent" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[250px] opacity-[0.05] bg-gradient-to-r from-violet-600/15 via-purple-600/15 to-transparent" />
        <div className="absolute top-[30%] left-[35%] w-[40%] h-[40%] rounded-full blur-[200px] opacity-[0.03] bg-gradient-to-r from-cyan-500/10 to-transparent" />
        
        {/* Mesh gradient */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139,92,246,0.2) 0%, transparent 50%)`,
        }} />
        
        {/* Minimal particles */}
        <div className="absolute inset-0 opacity-20">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-px h-px bg-white/60 rounded-full"
              style={{
                top: particle.top,
                left: particle.left,
                animation: `fade ${4 + (i % 2)}s ease-in-out infinite ${particle.delay}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-36 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-12 items-center">
          
          {/* Left Column */}
          <div className="space-y-6 sm:space-y-10">
            <div className="inline-flex items-center space-x-2 bg-white/[0.03] border border-white/[0.08] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-white/80">Auto Routing System</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-white leading-[1.1] tracking-tight">
              Multiple models 500+
              <br />
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                for each specific tasks.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg">
              Feature extraction, weighted signal scoring, and hard overrides for user preferences. Netsyra routes every prompt to the optimal model tier.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/chat"
                className="group inline-flex items-center justify-center space-x-2 bg-white text-black font-medium px-5 sm:px-6 py-3 rounded-lg hover:bg-white/90 transition-all duration-200"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/billing/subscription"
                className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium px-5 sm:px-6 py-3 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                <span>Subscribe</span>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center space-x-2 bg-white/[0.05] border border-white/[0.1] text-white font-medium px-5 sm:px-6 py-3 rounded-lg hover:bg-white/[0.08] transition-all duration-200"
              >
                <span>See How It Works</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-white/40" />
                <span className="text-xs sm:text-sm text-white/40">Model Tiers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-white/40" />
                <span className="text-xs sm:text-sm text-white/40">Orchestrator AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-white/40" />
                <span className="text-xs sm:text-sm text-white/40">Learning System</span>
              </div>
            </div>
          </div>

          {/* Right Column - Intelligence Field */}
          <div className="relative h-[500px] hidden lg:block">
            {/* Ambient glow behind container */}
            <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/[0.06] via-indigo-500/[0.04] to-violet-500/[0.06] rounded-3xl blur-3xl -z-10" />
            <IntelligenceField />
          </div>

          {/* Mobile Intelligence Field */}
          <div className="relative h-[320px] lg:hidden">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/[0.05] to-violet-500/[0.05] rounded-3xl blur-2xl -z-10" />
            <IntelligenceField mobile />
          </div>
        </div>
      </div>

      {/* CSS Animation Keyframes */}
      <style jsx global>{`
        @keyframes fade {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </section>
  );
}