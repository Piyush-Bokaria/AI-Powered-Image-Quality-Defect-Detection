import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanSearch, History, Activity } from 'lucide-react';
import { useHealth, type SystemStatus } from '../hooks/useHealth';
import { cn } from '../lib/utils';

const statusColors: Record<SystemStatus, string> = {
  online: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]',
  offline: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]',
  checking: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-pulse',
};

const statusLabels: Record<SystemStatus, string> = {
  online: 'System Online',
  offline: 'System Offline',
  checking: 'Checking…',
};

export const Header: React.FC = () => {
  const health = useHealth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Activity className="h-4.5 w-4.5 text-cyan-400" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
              IQ Detect
            </h1>
            <p className="text-[10px] leading-none text-zinc-500 tracking-wider uppercase">
              Image Quality Analysis
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/[0.07] text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.06)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              )
            }
          >
            <ScanSearch className="h-4 w-4" />
            <span>Analyze</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/[0.07] text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.06)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              )
            }
          >
            <History className="h-4 w-4" />
            <span>History</span>
          </NavLink>
        </nav>

        {/* System status */}
        <div className="flex items-center gap-2.5">
          <div
            className={cn('h-2 w-2 rounded-full', statusColors[health])}
            title={statusLabels[health]}
            aria-label={statusLabels[health]}
          />
          <span className="hidden sm:inline text-[11px] text-zinc-500 font-mono">
            {statusLabels[health]}
          </span>
        </div>
      </div>
    </header>
  );
};
