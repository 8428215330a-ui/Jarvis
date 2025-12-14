import React from 'react';

interface ArcReactorProps {
  isActive: boolean;
  isProcessing: boolean;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({ isActive, isProcessing }) => {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32">
      {/* Outer Ring */}
      <div className={`absolute w-full h-full border-4 border-jarvis-blue rounded-full opacity-50 ${isActive ? 'animate-spin-slow' : ''}`}></div>
      
      {/* Middle Ring with glow */}
      <div className={`absolute w-3/4 h-3/4 border-2 border-cyan-300 rounded-full shadow-[0_0_15px_rgba(0,243,255,0.6)] ${isProcessing ? 'animate-ping' : ''}`}></div>
      
      {/* Core */}
      <div className={`w-1/2 h-1/2 bg-jarvis-blue rounded-full shadow-[0_0_30px_rgba(0,243,255,0.8)] flex items-center justify-center transition-all duration-500 ${isActive ? 'opacity-100 scale-110' : 'opacity-30 scale-100'}`}>
        <div className="w-full h-full bg-white opacity-20 rounded-full animate-pulse-slow"></div>
      </div>
    </div>
  );
};