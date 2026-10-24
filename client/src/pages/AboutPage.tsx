import { Shield, Target, Eye, Zap, Award, Lock } from 'lucide-react';
import { AuraLogo } from '@/components/shared/AuraLogo';
import { useApp } from '@/context/AppContext';

export function AboutPage() {
  const { setActiveSection } = useApp();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">About</h1>
        <p className="text-slate-400 text-sm">Team identity and project overview</p>
      </div>

      {/* Team identity section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 blur-lg" />
              <AuraLogo size={96} className="relative drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
              <span className="text-xs font-bold text-cyan-400 tracking-wide">AURA_X</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Trustguard AI</h2>
            <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
              A Digital Risk Protection platform that detects fake social-media accounts, impersonating company pages,
              scam profiles, and suspicious mobile applications imitating legitimate brands. Built for HacXLerate 2026.
            </p>
            <p className="text-sm text-cyan-400 font-medium mt-3">Spot the Fake. Protect the Trust.</p>
          </div>
        </div>
      </div>

      {/* Project pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 mb-3">
            <Eye size={20} className="text-cyan-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Social Monitoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scans Instagram, Facebook, LinkedIn, X, and YouTube for impersonating profiles using name similarity,
            suspicious keywords, and scam-language detection.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10 mb-3">
            <Shield size={20} className="text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">App Monitoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Detects clone apps with similar names, different publishers, suspicious descriptions, and mismatched
            package IDs across app stores.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 mb-3">
            <Target size={20} className="text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Risk Scoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Transparent, deterministic scoring using Levenshtein distance, Jaro-Winkler similarity, publisher checks,
            and contextual indicators — never random.
          </p>
        </div>
      </div>

      {/* Tech stack */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Technology Stack</h3>
        <div className="flex flex-wrap gap-2">
          {['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Lucide React', 'Recharts', 'Supabase', 'localStorage Demo Persistence'].map((tech) => (
            <span key={tech} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50 text-xs text-slate-300">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Platform Capabilities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Zap, label: 'Deterministic demo scans with real similarity algorithms' },
            { icon: Shield, label: 'Official asset exclusion takes precedence over fuzzy matching' },
            { icon: Lock, label: 'Risk levels: Low, Medium, High, Critical (0–100 scale)' },
            { icon: Target, label: 'Explainable indicators for every risk score' },
            { icon: Eye, label: 'Investigation workflow: New → Investigating → Confirmed/False Positive/Resolved' },
            { icon: Award, label: 'CSV export and printable intelligence reports' },
          ].map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <Icon size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-relaxed">{cap.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Back to dashboard */}
      <div className="text-center">
        <button
          onClick={() => setActiveSection('Overview')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
        >
          Back to Dashboard
        </button>
      </div>

      <p className="text-center text-xs text-slate-600 pb-4">
        Trustguard AI · AURA_X Team · HacXLerate 2026 · Synthetic demonstration data
      </p>
    </div>
  );
}
