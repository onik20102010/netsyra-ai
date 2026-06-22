"use client";
import React, { useState } from 'react';
import { Sparkles, Terminal, Activity, ShieldCheck, Zap, Layers, Cpu, Globe, Code } from 'lucide-react';

// Types for our orchestration architecture
interface ModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  latency: string;
  capabilities: string[];
}

export default function NetsyraHomepage() {
  const [userPrompt, setUserPrompt] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('auto');

  // Multi-model matrix definitions
  const models: ModelOption[] = [
    { id: 'n-fast', name: 'N fast', badge: 'Speed Optimized', description: 'Ultra-low latency pipelines for repetitive queries & simple translations.', icon: <Zap className="w-4 h-4 text-amber-400" />, latency: '120ms', capabilities: ['Real-time', 'Token-Efficient'] },
    { id: 'n-plus', name: 'N plus', badge: 'Balanced Peak', description: 'The baseline worker engine. Great for conversational flows and processing files.', icon: <Layers className="w-4 h-4 text-blue-400" />, latency: '280ms', capabilities: ['Multimodal', 'Balanced'] },
    { id: 'n-pro', name: 'N pro', badge: 'Deep Logic', description: 'Advanced system reasoning matrix for massive contextual analytics.', icon: <Cpu className="w-4 h-4 text-purple-400" />, latency: '650ms', capabilities: ['Deep Context', 'Heavy Math'] },
    { id: 'n-live', name: 'N live', badge: 'Web-Augmented', description: 'Continuous access vectors fetching live web environments and parameters.', icon: <Globe className="w-4 h-4 text-emerald-400" />, latency: '410ms', capabilities: ['Live Web Search', 'Sensor Fetch'] },
    { id: 'n-code', name: 'N code', badge: 'Syntax Engineer', description: 'Dedicated code structure logic for continuous syntax generation & debugging.', icon: <Code className="w-4 h-4 text-pink-400" />, latency: '340ms', capabilities: ['Zero-shot Scripts', 'AST Analysis'] },
  ];

  // Client-side real-time orchestration simulation for the UI
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUserPrompt(text);

    if (!text.trim()) {
      setDetectedIntent(null);
      setSelectedModel('auto');
      return;
    }

    const lower = text.toLowerCase();
    if (lower.includes('function') || lower.includes('const') || lower.includes('bug') || lower.includes('code') || lower.includes('<')) {
      setDetectedIntent('Code Generation / Refactoring Detected');
      setSelectedModel('n-code');
    } else if (lower.includes('today') || lower.includes('news') || lower.includes('price') || lower.includes('stock')) {
      setDetectedIntent('Real-time Context Evaluation Requested');
      setSelectedModel('n-live');
    } else if (lower.includes('calculate') || lower.includes('prove') || lower.includes('analyze')) {
      setDetectedIntent('Complex Logic Matrix Flagged');
      setSelectedModel('n-pro');
    } else if (text.length > 120) {
      setDetectedIntent('Standard Comprehensive Context Balanced');
      setSelectedModel('n-plus');
    } else {
      setDetectedIntent('Express Execution Route Selected');
      setSelectedModel('n-fast');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* 1. Header & Navigation (Google Compliance Structured) */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              NetsyraAI
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#models" className="hover:text-white transition-colors">Supported Matrices</a>
            <a href="#orchestrator" className="hover:text-white transition-colors">The Router</a>
            <a href="#architecture" className="hover:text-white transition-colors">Enterprise Security</a>
          </nav>

          <div>
            {/* Standard Compliant Google OAuth Entrance Target */}
            <button className="flex items-center space-x-2 bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950 shadow-md">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.227C18.216 1.414 15.48 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c7.05 0 11.732-4.957 11.732-11.93 0-.803-.086-1.414-.188-1.765H12.24z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Orchestration Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-medium text-purple-400 mb-6">
            <Activity className="w-3 h-3" />
            <span>Autonomous Dynamic Multi-Model Gateway</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            One Core Interface.<br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Five Specialized Models.
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Stop guessing which LLM fits your workload. NetsyraAI dynamically parses prompt structures, measures semantic complexity, and shoots tasks down the optimal hardware pipeline instantly.
          </p>
        </div>

        {/* 3. Interactive Route Matrix Sandbox */}
        <section id="orchestrator" className="mb-24">
          <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Prompt Engine Interface Input */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span>Global Context Stream</span>
                  </label>
                  {detectedIntent && (
                    <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 animate-pulse">
                      {detectedIntent}
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <textarea
                    value={userPrompt}
                    onChange={handleInputChange}
                    placeholder="Type anything (e.g., 'Write an async function to fetch stock tickers' or 'Translate this contract' to watch the orchestrator select the model...)"
                    className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200 resize-none text-sm leading-relaxed"
                  />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">Routing is evaluated at edge via token structural metrics.</span>
                  <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all duration-200 shadow-lg shadow-purple-600/20">
                    Execute Matrix
                  </button>
                </div>
              </div>

              {/* Live Selection Feedback Array */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Active Orchestration Strategy
                </span>

                <div className="space-y-2">
                  {/* Dynamic Override Switcher Box */}
                  <div className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between ${selectedModel === 'auto' ? 'bg-purple-950/20 border-purple-500/40' : 'bg-slate-950 border-slate-900'}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Netsyra Auto-Route</h4>
                        <p className="text-[11px] text-slate-500">Autonomous intent matching architecture</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">Active</span>
                  </div>

                  {/* Individual Models Loops */}
                  {models.map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                          isSelected 
                            ? 'bg-slate-900 border-indigo-500/60 shadow-lg ring-1 ring-indigo-500/30' 
                            : 'bg-slate-950/40 border-slate-900/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center">
                            {m.icon}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-bold text-slate-200">{m.name}</h4>
                              <span className="text-[9px] font-medium px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">{m.badge}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">{m.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono text-slate-500 block">{m.latency}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. Core Features Block Grid */}
        <section id="models" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          <div className="border border-slate-900 bg-slate-900/20 p-6 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Sub-Milisecond Thresholds</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Simple prompts map instantly into *N fast*, bypassing heavy model weights to save processing latency and platform billing overheads.
            </p>
          </div>
          
          <div className="border border-slate-900 bg-slate-900/20 p-6 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
              <Code className="w-5 h-5 text-pink-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Syntax Specialized Pipelines</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              When software structures are evaluated, *N code* deploys strict abstract syntax analysis tokens built purposely to map engineering tasks natively.
            </p>
          </div>

          <div className="border border-slate-900 bg-slate-900/20 p-6 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Google Verified Architecture</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Fully isolated execution frames protecting user context matrices under strict OAuth authorization structures.
            </p>
          </div>
        </section>
      </main>

      {/* 5. Google Compliance Required Public Footer */}
      <footer id="architecture" className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-medium text-slate-400">NetsyraAI Orchestration Platform</p>
            <p>© 2026 Netsyra Inc. All rights reserved. Cloud application infrastructure.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            {/* These items must map to active public routes for Google OAuth Brand validation */}
            <a href="/privacy-policy" className="hover:text-white transition-colors underline decoration-slate-800 underline-offset-4">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-white transition-colors underline decoration-slate-800 underline-offset-4">Terms of Service</a>
            <a href="mailto:support@netsyra.ai" className="hover:text-white transition-colors underline decoration-slate-800 underline-offset-4">Support Hub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}