import React from 'react';

export const MobileFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#03194A] flex items-center justify-center p-0 sm:p-4 selection:bg-[#168BFF] selection:text-white">
      {/* Mobile Canvas Viewport with KinoraOne Deep Navy Gradient */}
      <div className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[890px] sm:max-h-[920px] bg-gradient-to-b from-[#061F5C] via-[#052B78] to-[#03194A] sm:rounded-[36px] border-0 sm:border border-[#168BFF]/20 shadow-[0_20px_60px_rgba(3,25,74,0.9)] overflow-hidden flex flex-col relative">
        {/* Scrollable App Body */}
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </main>
      </div>
    </div>
  );
};
