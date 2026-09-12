import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

export const MobileFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-indigo-500 selection:text-white">
      {/* Mobile Canvas Viewport */}
      <div className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[890px] sm:max-h-[920px] bg-slate-900 sm:rounded-[42px] border-0 sm:border-[8px] sm:border-slate-800 shadow-2xl overflow-hidden flex flex-col relative sm:ring-1 sm:ring-slate-700/60">
        
        {/* iOS-style Top Status Bar */}
        <div className="h-7 bg-slate-900 px-6 pt-1 flex items-center justify-between text-[11px] font-semibold text-slate-300 select-none z-50 shrink-0">
          <span>9:41</span>
          <div className="w-20 h-3.5 bg-slate-950 rounded-full mx-auto hidden sm:block"></div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Scrollable App Body */}
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};
