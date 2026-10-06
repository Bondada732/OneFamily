import React from 'react';

export const MobileFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center p-0 sm:p-6 selection:bg-[#168BFF] selection:text-white transition-colors duration-300 app-shell-canvas gap-8">
      {/* 1. Main App Phone Canvas Viewport */}
      <div className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[890px] sm:max-h-[920px] bg-gradient-to-b from-[#080D1A] via-[#060A14] to-[#040710] sm:rounded-[36px] border-0 sm:border border-slate-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col relative transition-colors duration-300 app-phone-container shrink-0">
        {/* Scrollable App Body */}
        <main className="flex-1 overflow-y-auto pb-32 sm:pb-24 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] app-main-content">
          {children}
        </main>
      </div>

      {/* 2. Desktop Right-Side Panel (Visible on Desktop / Laptops lg screens) */}
      <aside className="hidden lg:flex flex-col w-[360px] max-h-[890px] bg-slate-900/90 border border-slate-800 rounded-[32px] p-5 text-slate-100 shadow-2xl space-y-4 overflow-y-auto shrink-0">
        {/* Right Side Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              K1
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">KinoraOne Desktop</h3>
              <p className="text-[10px] text-slate-400">Live Household Hub</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Connected
          </span>
        </div>

        {/* Card 1: Family Member Status & Permissions */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Family Members</span>
            <span className="text-[10px] text-amber-400 font-semibold">Active Permissions</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800 border border-slate-700/50">
              <span className="font-semibold text-slate-200">Rambabu</span>
              <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">Family Head</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800 border border-slate-700/50">
              <span className="font-semibold text-slate-200">Priya</span>
              <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Spouse (Full)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800 border border-slate-700/50">
              <span className="font-semibold text-slate-200">Aarav</span>
              <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">Adult (CAS & Wealth)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Quick Features & Sync Shortcuts */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-800/60 to-slate-900 border border-indigo-500/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
            <span>⚡ Quick Sync Features</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <span className="text-[11px] font-semibold">1-Click CAMS Mutual Funds</span>
              <span class="text-emerald-400 font-bold text-[10px]">Ready</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <span className="text-[11px] font-semibold">NSDL / CDSL Demat Stocks</span>
              <span class="text-cyan-400 font-bold text-[10px]">Ready</span>
            </div>
          </div>
        </div>

        {/* Card 3: FamilyAI Desktop Assistant */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <span>✨</span>
            <span>FamilyAI Assistant</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Use FamilyAI to get instant advice on your household budget, mutual fund returns, and tax-saving investments.
          </p>
        </div>
      </aside>
    </div>
  );
};

