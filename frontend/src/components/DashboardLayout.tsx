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
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  selectedAccountName,
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
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Customer Success Copilot
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              AI Copilot · v6
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-650 text-white font-medium shadow-md shadow-violet-600/10 transition-all duration-200"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Overview</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all duration-200"
          >
            <BookOpen className="h-5 w-5" />
            <span>Playbooks KB</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all duration-200"
          >
            <Users className="h-5 w-5" />
            <span>Accounts</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all duration-200"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Analytics</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all duration-200"
          >
            <SettingsIcon className="h-5 w-5" />
            <span>Settings</span>
          </a>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <a
            href="https://github.com/antigravity/cs-copilot"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors mb-3"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            <span>View on GitHub</span>
          </a>
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-violet-400 border border-slate-700">
              CS
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">CS Manager</p>
              <p className="text-[10px] text-slate-500">demo@antigravity.ai</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Customer Success Copilot
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300">
              AI-Powered
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              {selectedAccountName ? `Viewing: ${selectedAccountName}` : 'No account selected'}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Backend Live</span>
            </div>
          </div>
        </header>

        {/* Dashboard Body container */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
