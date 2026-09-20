import React from 'react';

export const MobileFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center p-0 sm:p-4 selection:bg-[#168BFF] selection:text-white transition-colors duration-300 app-shell-canvas">
      {/* Mobile Canvas Viewport with Deep Dark Midnight Obsidian Theme in Dark Mode & Warm Cream in Light Mode */}
      <div className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[890px] sm:max-h-[920px] bg-gradient-to-b from-[#080D1A] via-[#060A14] to-[#040710] sm:rounded-[36px] border-0 sm:border border-slate-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col relative transition-colors duration-300 app-phone-container">
        {/* Scrollable App Body */}
        <main className="flex-1 overflow-y-auto pb-32 sm:pb-24 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] app-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

