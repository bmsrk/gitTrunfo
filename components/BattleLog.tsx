import React, { useEffect, useRef, memo } from 'react';
import { BattleLogEntry } from '../types';
import { Terminal, ChevronRight } from 'lucide-react';

interface BattleLogProps {
  /** Array of log entries to display */
  logs: BattleLogEntry[];
}

/**
 * BattleLog component displays a terminal-style log of game events
 * Auto-scrolls to the latest entry
 */
const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] border-t border-terminal/30">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-3 py-1 bg-terminal/10 border-b border-terminal/20 shrink-0">
        <Terminal size={12} className="text-terminal/60" />
        <span className="text-[10px] uppercase tracking-widest text-terminal/60 font-bold">Battle_Log.sh</span>
      </div>

      {/* Log Content */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-terminal/30 text-center mt-2 italic text-[10px]">System initialized. Waiting for input...</div>
        )}
        
        <div className="flex flex-col gap-0.5">
          {logs.map((log) => {
            const date = new Date(log.timestamp);
            const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

            let typeColor = 'text-terminal';
            let bgStyle = '';
            
            if (log.type === 'combat') {
              typeColor = 'text-red-400';
              bgStyle = 'bg-red-900/5 border-l-2 border-red-500/30';
            } else if (log.type === 'commentary') {
              typeColor = 'text-yellow-400';
              bgStyle = 'bg-yellow-900/5 border-l-2 border-yellow-500/30';
            } else {
               bgStyle = 'hover:bg-white/5 border-l-2 border-transparent';
            }

            return (
              <div key={log.id} className={`grid grid-cols-[50px_1fr] gap-2 px-2 py-0.5 rounded-sm ${bgStyle} transition-colors`}>
                 <span className="text-terminal/30 font-light select-none text-[10px]">{timeString}</span>
                 <span className={`${typeColor} break-words leading-snug`}>
                    {log.type === 'info' && <span className="text-terminal/50 mr-1.5">$</span>}
                    {log.type === 'combat' && <span className="text-red-500/50 mr-1.5 font-bold">!</span>}
                    {log.type === 'commentary' && <span className="text-yellow-500/50 mr-1.5">#</span>}
                    {log.text}
                 </span>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Fake Input Line */}
      <div className="px-3 py-1 bg-black flex items-center gap-2 shrink-0">
        <ChevronRight size={12} className="text-terminal animate-pulse" />
        <div className="h-3 w-1.5 bg-terminal/50 cursor-blink"></div>
      </div>
    </div>
  );
};

export default memo(BattleLog);