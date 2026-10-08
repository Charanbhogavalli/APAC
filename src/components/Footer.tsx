import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#ffffff] py-8 border-t border-[#dee0ed]/60 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-[#161a33]">
            Asia-Pacific Conference on Innovations in Rural Development
          </span>
          <span className="text-[13px] text-[#444656]">
            Colombo 2026
          </span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 text-[12px] text-[#444656]">
          <span className="font-semibold text-[#152de4]">APAC Rural Connect</span>
          <span className="hidden md:inline text-[#c5c5d9]">•</span>
          <span>People. Ideas. Connections.</span>
        </div>
      </div>
    </footer>
  );
};
