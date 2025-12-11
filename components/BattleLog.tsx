import React, { useEffect, useRef } from 'react';
import { BattleLogEntry } from '../types';
import { Terminal, ChevronRight } from 'lucide-react';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col border border-terminal/30 bg-[#0a0a0a] shadow-lg rounded-sm overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-terminal/10 border-b border-terminal/20">
        <Terminal size={14} className="text-terminal/60" />
        <span className="text-[10px] uppercase tracking-widest text-terminal/60 font-bold">Battle_Log.sh</span>
      </div>

      {/* Log Content */}
      <div className="h-48 overflow-y-auto p-2 font-mono text-xs custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-terminal/30 text-center mt-10 italic">System initialized. Waiting for input...</div>
        )}
        
        <div className="flex flex-col gap-0.5">
          {logs.map((log) => {
            const date = new Date(log.timestamp);
            const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

            let typeColor = 'text-terminal';
            let bgStyle = '';
            
            if (log.type === 'combat') {
              typeColor = 'text-red-400';
              bgStyle = 'bg-red-900/5';
            } else if (log.type === 'commentary') {
              typeColor = 'text-yellow-400';
              bgStyle = 'bg-yellow-900/5';
            }

            return (
              <div key={log.id} className={`grid grid-cols-[60px_1fr] gap-3 px-2 py-1 rounded-sm ${bgStyle} hover:bg-white/5 transition-colors`}>
                 <span className="text-terminal/40 font-light select-none">{timeString}</span>
                 <span className={`${typeColor} break-words leading-relaxed`}>
                    {log.type === 'info' && <span className="text-terminal/50 mr-2">$</span>}
                    {log.type === 'combat' && <span className="text-red-500/50 mr-2 font-bold">!</span>}
                    {log.type === 'commentary' && <span className="text-yellow-500/50 mr-2">#</span>}
                    {log.text}
                 </span>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Fake Input Line */}
      <div className="px-3 py-2 border-t border-terminal/20 bg-black flex items-center gap-2">
        <ChevronRight size={14} className="text-terminal animate-pulse" />
        <div className="h-4 w-2 bg-terminal/50 cursor-blink"></div>
      </div>
    </div>
  );
};

export default BattleLog;