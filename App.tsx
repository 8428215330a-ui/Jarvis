import React from 'react';
import { JarvisDashboard } from './components/JarvisDashboard';

function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative selection:bg-cyan-500 selection:text-black">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
      
      {/* Radial Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-jarvis-blue rounded-full blur-[150px] opacity-10 pointer-events-none z-0"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-screen">
        <header className="p-6 flex justify-between items-center border-b border-jarvis-blue/10 backdrop-blur-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              J.A.R.V.I.S.
            </h1>
            <p className="text-[10px] text-cyan-500 tracking-[0.3em] font-mono mt-1">ACCESSIBILITY INTERFACE MK.II</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="hidden md:block text-right">
               <div className="text-xs text-gray-500 font-mono">CONNECTION</div>
               <div className="text-xs text-green-400 font-mono flex items-center justify-end gap-1">
                 SECURE <span className="block w-2 h-2 bg-green-500 rounded-full"></span>
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <JarvisDashboard />
        </main>
      </div>
    </div>
  );
}

export default App;