import React from 'react';

export const MobileFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-indigo-500 selection:text-white">
      {/* Mobile Canvas Viewport */}
      <div className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[890px] sm:max-h-[920px] bg-slate-950 sm:rounded-[36px] border-0 sm:border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col relative">
        {/* Scrollable App Body */}
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </main>
      </div>
    </div>
  );
};
