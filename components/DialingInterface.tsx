import React from 'react';
import { Phone, PhoneOff, Activity } from 'lucide-react';

interface DialingInterfaceProps {
  contactName: string;
  contactNumber: string;
  onEndCall: () => void;
}

export const DialingInterface: React.FC<DialingInterfaceProps> = ({ contactName, contactNumber, onEndCall }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-red-500/50 rounded-2xl p-8 flex flex-col items-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        
        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6 animate-pulse">
           <Phone className="text-red-500 w-10 h-10 animate-bounce" />
        </div>

        <h2 className="text-2xl font-mono text-white font-bold tracking-wider mb-1">DIALING...</h2>
        <h3 className="text-xl font-sans text-red-400 mb-2">{contactName}</h3>
        <p className="text-gray-500 font-mono tracking-widest text-sm mb-8">{contactNumber}</p>

        <div className="w-full h-16 bg-black rounded-lg mb-8 relative overflow-hidden border border-red-900/50 flex items-center justify-center">
             <Activity className="text-red-500 w-full animate-scan" />
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-scan"></div>
        </div>

        <button 
          onClick={onEndCall}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105"
        >
          <PhoneOff size={20} />
          CANCEL PROTOCOL
        </button>

      </div>
      <div className="mt-8 text-red-500 font-mono text-xs animate-pulse">
         WARNING: EMERGENCY OVERRIDE ACTIVE
      </div>
    </div>
  );
};