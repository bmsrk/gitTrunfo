import React, { useEffect, useRef } from 'react';
import { BattleLogEntry } from '../types';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full h-32 bg-black border border-terminal p-2 font-mono text-xs overflow-y-auto shadow-[inset_0_0_10px_#000]">
      <div className="flex flex-col">
        {logs.map((log, idx) => (
          <div key={idx} className="mb-1 leading-tight">
             <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
             <span className={`${log.type === 'commentary' ? 'text-yellow-300' : log.type === 'combat' ? 'text-white font-bold bg-red-900/50' : 'text-terminal'}`}>
                {log.type === 'info' && '> SYSTEM: '}
                {log.type === 'commentary' && '> ANALYSIS: '}
                {log.type === 'combat' && '> COMBAT: '}
                {log.text}
             </span>
          </div>
        ))}
        <div ref={bottomRef} className="animate-pulse">_</div>
      </div>
    </div>
  );
};

export default BattleLog;