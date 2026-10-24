import { AuraLogo } from '@/components/shared/AuraLogo';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Logo with pulse animation */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-xl animate-ping" />
          <div className="relative animate-[fadeInScale_0.6s_ease-out]">
            <AuraLogo size={72} className="drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
          </div>
        </div>

        {/* Brand name */}
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Trustguard AI</h1>
        <p className="text-xs text-cyan-400 font-medium mb-6">Spot the Fake. Protect the Trust.</p>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full animate-[loadingBar_1.5s_ease-in-out_infinite]" />
        </div>

        <p className="text-xs text-slate-500 mt-4">Initializing threat detection engine...</p>

        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
          <span className="text-[10px] text-slate-400 tracking-wider">Team</span>
          <span className="text-xs font-bold text-cyan-400 tracking-wide">AURA_X</span>
        </div>
      </div>
    </div>
  );
}
