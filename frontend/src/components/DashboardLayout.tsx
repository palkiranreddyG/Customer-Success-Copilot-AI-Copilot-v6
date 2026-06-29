import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings as SettingsIcon,
  BarChart3,
  Cpu,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  selectedAccountName?: string;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  selectedAccountName,
  activePage,
  onNavigate,
}) => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden text-slate-900 dark:text-slate-100">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col shrink-0 border-r border-slate-800">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-[13px] tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AI Customer Success Copilot
            </h1>
            <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase block">
              Success Intelligence Platform
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => onNavigate('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-205 text-left border-0 cursor-pointer ${
              activePage === 'overview'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                : 'bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Overview</span>
          </button>
          
          <button
            onClick={() => onNavigate('kb')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-205 text-left border-0 cursor-pointer ${
              activePage === 'kb'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                : 'bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>Playbooks KB</span>
          </button>

          <button
            onClick={() => onNavigate('accounts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-205 text-left border-0 cursor-pointer ${
              activePage === 'accounts'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                : 'bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Accounts</span>
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-205 text-left border-0 cursor-pointer ${
              activePage === 'analytics'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                : 'bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-205 text-left border-0 cursor-pointer ${
              activePage === 'settings'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                : 'bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-violet-400 border border-slate-700">
              CS
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-350">CS Manager</p>
              <p className="text-[10px] text-slate-500">demo@copilot.ai</p>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 text-center">
            Powered by AI Customer Success Copilot
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              AI Customer Success Copilot
            </h2>
            <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-violet-100 dark:bg-violet-900/50 text-violet-750 dark:text-violet-300 uppercase tracking-wider">
              Connected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-555 dark:text-slate-400 font-bold hidden sm:block">
              {selectedAccountName ? `Viewing: ${selectedAccountName}` : 'No account selected'}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-650 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">AI Ready</span>
            </div>
          </div>
        </header>

        {/* Dashboard Body container */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </div>
      </div>
    </div>
  );
};
