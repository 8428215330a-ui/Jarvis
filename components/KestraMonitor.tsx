import React from 'react';
import { KestraFlow, AgentResult } from '../types';
import { GitCommit, Play, CheckCircle2, Bot, BrainCircuit, AlertTriangle, ShieldCheck } from 'lucide-react';

interface KestraMonitorProps {
  flows: KestraFlow[];
  triggerFlow: (id: string) => void;
  agentResult: AgentResult | null;
}

export const KestraMonitor: React.FC<KestraMonitorProps> = ({ flows, triggerFlow, agentResult }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-purple-500/20 bg-purple-900/10 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <GitCommit className="text-purple-400" size={16} />
            <span className="text-purple-400 font-mono text-xs font-bold tracking-wider">KESTRA ORCHESTRATION</span>
         </div>
         <BrainCircuit size={16} className="text-purple-500/50" />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Agent Result Card */}
        {agentResult && (
          <div className={`border rounded-lg p-3 animate-fade-in ${
            agentResult.decision === 'CRITICAL' ? 'bg-red-900/20 border-red-500/50' :
            agentResult.decision === 'WARNING' ? 'bg-yellow-900/20 border-yellow-500/50' :
            'bg-purple-900/20 border-purple-500/50'
          }`}>
             <div className="flex items-center gap-2 mb-2">
                <Bot size={14} className={
                    agentResult.decision === 'CRITICAL' ? 'text-red-400' :
                    agentResult.decision === 'WARNING' ? 'text-yellow-400' : 'text-purple-400'
                } />
                <span className="text-[10px] font-bold tracking-widest text-gray-400">AI AGENT SUMMARY</span>
             </div>
             <p className="text-xs text-white font-mono leading-relaxed mb-2">
               "{agentResult.summary}"
             </p>
             <div className="flex justify-between items-center">
               <span className="text-[9px] text-gray-500">{agentResult.data_source}</span>
               <div className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                 agentResult.decision === 'CRITICAL' ? 'bg-red-500 text-black' :
                 agentResult.decision === 'WARNING' ? 'bg-yellow-500 text-black' : 'bg-purple-500 text-black'
               }`}>
                 {agentResult.decision === 'CRITICAL' && <AlertTriangle size={8} />}
                 {agentResult.decision === 'NORMAL' && <ShieldCheck size={8} />}
                 {agentResult.decision} DECISION
               </div>
             </div>
          </div>
        )}

        {/* Flows List */}
        {flows.map(flow => (
          <div key={flow.id} className="bg-black border border-purple-500/20 rounded-lg p-3 hover:border-purple-500/50 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-300 font-mono">{flow.name.replace('_', ' ')}</span>
              {flow.status === 'IDLE' ? (
                 <button 
                   onClick={() => triggerFlow(flow.id)}
                   className="flex items-center gap-1 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white px-2 py-1 rounded text-[10px] transition-all"
                 >
                   <Play size={10} /> RUN
                 </button>
              ) : (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    flow.status === 'RUNNING' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' : 
                    flow.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {flow.status}
                </span>
              )}
            </div>
            
            {/* Timeline */}
            <div className="relative pl-2">
                <div className="absolute left-[7px] top-1 bottom-1 w-[1px] bg-gray-800"></div>
                <div className="space-y-3">
                    {flow.tasks.map((task) => (
                        <div key={task.id} className="relative flex items-center gap-3">
                            <div className={`z-10 w-4 h-4 rounded-full flex items-center justify-center border ${
                                task.status === 'COMPLETED' ? 'bg-green-500 border-green-500' : 
                                task.status === 'RUNNING' ? 'bg-black border-yellow-500' : 
                                'bg-black border-gray-700'
                            }`}>
                                {task.status === 'COMPLETED' && <CheckCircle2 size={10} className="text-black" />}
                                {task.status === 'RUNNING' && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></div>}
                            </div>
                            <span className={`text-[10px] font-mono uppercase ${
                                task.status === 'RUNNING' ? 'text-yellow-500' : 
                                task.status === 'COMPLETED' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                {task.name.replace('_', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};