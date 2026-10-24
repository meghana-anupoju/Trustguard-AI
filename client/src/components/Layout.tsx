import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Building2,
  Share2,
  Smartphone,
  Flag,
  FileBarChart,
  Settings as SettingsIcon,
  Menu,
  X,
  Zap,
  Info,
  LogOut,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { AuraLogo } from '@/components/shared/AuraLogo';
import { SupportChat } from '@/components/shared/SupportChat';
import type { NavSection } from '@/types';

const navItems: { section: NavSection; icon: typeof Info; label: string }[] = [
  { section: 'Overview', icon: LayoutDashboard, label: 'Overview' },
  { section: 'Brand Profile', icon: Building2, label: 'Brand Profile' },
  { section: 'Social Monitoring', icon: Share2, label: 'Social Monitoring' },
  { section: 'App Monitoring', icon: Smartphone, label: 'App Monitoring' },
  { section: 'Threat Intelligence', icon: Flag, label: 'Threat Intelligence' },
  { section: 'Reports', icon: FileBarChart, label: 'Reports' },
  { section: 'About', icon: Info, label: 'About' },
  { section: 'Settings', icon: SettingsIcon, label: 'Settings' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { activeSection, setActiveSection, isScanning, runScanning, lastScanTime, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (section: NavSection) => {
    setActiveSection(section);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <AuraLogo size={40} className="flex-shrink-0" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Trustguard AI</h1>
            <p className="text-[10px] text-cyan-400 leading-none mt-0.5">Digital Risk Protection</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.section;
            return (
              <button
                key={item.section}
                onClick={() => handleNav(item.section)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon size={18} className={active ? 'text-sky-400' : 'text-slate-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800">
          <button
            onClick={runScanning}
            disabled={isScanning}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Zap size={16} />
                Scan Now
              </>
            )}
          </button>
          {lastScanTime && (
            <p className="text-[10px] text-slate-500 text-center mt-2">
              Last: {new Date(lastScanTime).toLocaleString()}
            </p>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <AuraLogo size={28} className="flex-shrink-0" />
            <span className="text-sm font-bold text-white">Trustguard AI</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
      <SupportChat />
    </div>
  );
}
