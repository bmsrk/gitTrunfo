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
    <div className="w-full h-40 bg-black border border-terminal font-mono text-xs overflow-y-auto shadow-[inset_0_0_10px_#000] flex flex-col">
      {logs.map((log) => {
        const timeString = new Date(log.timestamp).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        const bgClass = log.type === 'combat' 
          ? 'bg-red-900/10 border-l-2 border-red-500/50' 
          : log.type === 'commentary' 
            ? 'bg-yellow-900/10 border-l-2 border-yellow-500/50' 
            : 'hover:bg-terminal/5 border-l-2 border-transparent';
        
        const textClass = log.type === 'commentary' 
          ? 'text-yellow-300' 
          : log.type === 'combat' 
            ? 'text-white font-bold' 
            : 'text-terminal';

        return (
          <div key={log.id} className={`p-1 border-b border-terminal/10 flex gap-2 ${bgClass}`}>
             <span className="opacity-40 shrink-0 text-terminal">[{timeString}]</span>
             <span className={`break-words ${textClass}`}>
                {log.type === 'info' && '> '}
                {log.type === 'commentary' && 'Analysis: '}
                {log.type === 'combat' && 'Combat: '}
                {log.text}
             </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default BattleLog;