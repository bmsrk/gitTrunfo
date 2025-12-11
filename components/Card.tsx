import React, { memo } from 'react';
import { GithubRepo, StatType, STAT_LABELS } from '../types';
import { playSound } from '../services/audioService';

interface CardProps {
  repo: GithubRepo;
  isHidden?: boolean;
  onSelectStat?: (stat: StatType) => void;
  isInteractable?: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
  highlightedStat?: StatType | null;
}

const Card: React.FC<CardProps> = ({ 
  repo, 
  isHidden = false, 
  onSelectStat, 
  isInteractable = false,
  isWinner,
  isLoser,
  highlightedStat
}) => {
  
  const stats: StatType[] = ['stargazers_count', 'forks_count', 'watchers_count', 'size', 'open_issues_count'];

  // Responsive width: w-full max-w-[320px] on mobile, w-72 on desktop
  const containerStyle = isWinner 
    ? 'border-4 border-terminal bg-terminal/10 shadow-[0_0_20px_var(--terminal-main)] scale-[1.02] z-10' 
    : isLoser 
      ? 'border-4 border-red-800 opacity-60 grayscale scale-95' 
      : 'border-2 border-terminal bg-black hover:shadow-[0_0_10px_var(--terminal-main)]';

  if (isHidden) {
    return (
      <div className="w-full max-w-[320px] md:w-72 h-80 bg-black border-2 border-dashed border-terminal flex flex-col items-center justify-center p-4 relative overflow-hidden retro-border">
         <div className="text-terminal text-6xl font-bold animate-pulse">?</div>
         <div className="mt-4 text-sm font-mono text-terminal text-center">
           AWAITING<br/>OPPONENT
         </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-[320px] md:w-72 min-h-[320px] flex flex-col transition-all duration-300 relative ${containerStyle}`}>
      {/* Header */}
      <div className={`p-2 border-b-2 ${isWinner ? 'bg-terminal text-black border-terminal' : isLoser ? 'bg-red-900 text-white border-red-800' : 'bg-terminal/20 text-terminal border-terminal'}`}>
        <h3 className="font-bold text-lg truncate uppercase tracking-tight" style={{ color: isWinner || isLoser ? undefined : 'var(--syntax-str)' }}>
            {repo.name}
        </h3>
        <div className="flex justify-between text-xs font-bold opacity-80">
            <span style={{ color: isWinner || isLoser ? undefined : 'var(--syntax-key)' }}>{repo.language ? repo.language.toUpperCase() : 'UNKNOWN'}</span>
            <span>#{repo.id.toString().slice(-4)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-black p-2">
        <div className="text-xs h-12 overflow-hidden leading-tight font-mono border-b border-terminal/30 pb-2 mb-2" style={{ color: 'var(--syntax-key)', opacity: 0.8 }}>
            {repo.description || "NO_DESCRIPTION_AVAILABLE"}
        </div>

        <table className="w-full text-sm border-collapse">
            <tbody>
                {stats.map((stat, idx) => {
                    const isSelected = highlightedStat === stat;
                    return (
                        <tr 
                            key={stat} 
                            onClick={() => {
                                if (isInteractable && !isSelected && onSelectStat) {
                                    playSound.click();
                                    onSelectStat(stat);
                                }
                            }}
                            onMouseEnter={() => isInteractable && !isSelected && playSound.hover()}
                            className={`
                                transition-colors group
                                ${isSelected ? 'bg-terminal-selected text-black font-bold' : idx % 2 === 0 ? 'bg-terminal/5' : 'bg-transparent'}
                                ${isInteractable && !isSelected ? 'hover:bg-terminal hover:text-black cursor-pointer' : ''}
                            `}
                        >
                            <td className="py-2 px-2 border-r border-terminal/20 group-hover:border-black/20" style={{ color: isSelected ? undefined : 'var(--syntax-key)' }}>
                                {isSelected && <span className="animate-pulse mr-1">▶</span>}
                                {STAT_LABELS[stat].toUpperCase()}
                            </td>
                            <td className="py-2 px-2 text-right" style={{ color: isSelected ? undefined : 'var(--syntax-val)' }}>
                                <span>
                                    {stat === 'size' ? `${Math.round(repo[stat] / 1024)}MB` : repo[stat]}
                                </span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className={`p-1 text-[10px] text-center uppercase tracking-widest font-bold ${isWinner ? 'bg-terminal text-black' : 'bg-black text-terminal/50'}`}>
         {isWinner ? 'WINNER' : isLoser ? 'ELIMINATED' : 'ACTIVE'}
      </div>
      
      {/* Glitch Overlay for Loser */}
      {isLoser && <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-glitch mix-blend-overlay"></div>}
    </div>
  );
};

export default memo(Card);