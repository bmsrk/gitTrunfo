import React, { memo } from 'react';
import { GithubRepo, StatType } from '../types';
import { playSound } from '../services/audioService';
import { Star, GitFork, Eye, HardDrive, CircleDot, Code2, ShieldAlert } from 'lucide-react';

interface CardProps {
  repo: GithubRepo;
  isHidden?: boolean;
  onSelectStat?: (stat: StatType) => void;
  isInteractable?: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
  highlightedStat?: StatType | null;
}

const STAT_CONFIG: Record<StatType, { label: string; icon: React.ElementType }> = {
  stargazers_count: { label: 'Stars', icon: Star },
  forks_count: { label: 'Forks', icon: GitFork },
  size: { label: 'Size (KB)', icon: HardDrive },
  open_issues_count: { label: 'Issues', icon: CircleDot },
  watchers_count: { label: 'Watchers', icon: Eye },
};

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

  // Base container style
  let containerStyle = 'bg-black border border-terminal/30 relative overflow-hidden transition-all duration-300 ';
  
  if (isWinner) {
    containerStyle += 'shadow-[0_0_30px_-5px_var(--terminal-main)] border-terminal scale-[1.02] z-10 ';
  } else if (isLoser) {
    containerStyle += 'opacity-50 grayscale scale-95 border-red-900 ';
  } else {
    containerStyle += 'hover:border-terminal hover:shadow-[0_0_15px_-5px_var(--terminal-main)] ';
  }

  if (isHidden) {
    return (
      <div className="w-[300px] h-[420px] bg-[#050505] border border-dashed border-terminal/40 flex flex-col items-center justify-center p-6 relative rounded-sm shadow-xl">
         <div className="text-terminal/20 absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(var(--terminal-main),0.05)_50%,transparent_75%)] bg-[length:10px_10px]"></div>
         <div className="text-terminal text-6xl font-retro animate-pulse mb-4">?</div>
         <div className="text-sm font-mono text-terminal/60 text-center tracking-widest">
           WAITING FOR<br/>OPPONENT...
         </div>
      </div>
    );
  }

  return (
    <div className={`w-[300px] h-[420px] flex flex-col rounded-sm ${containerStyle}`}>
      
      {/* Header Section */}
      <div className={`p-4 border-b border-terminal/20 ${isWinner ? 'bg-terminal/10' : 'bg-gradient-to-b from-terminal/5 to-transparent'}`}>
        <div className="flex justify-between items-start mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 border border-terminal/30 rounded text-terminal/80 uppercase tracking-wider bg-black">
                <Code2 size={10} />
                {repo.language || 'N/A'}
            </span>
            <span className="text-[10px] font-mono text-terminal/40">#{repo.id.toString().slice(-4)}</span>
        </div>
        <h3 className="font-retro text-2xl leading-none text-terminal tracking-wide truncate mb-1" title={repo.name}>
            {repo.name}
        </h3>
      </div>

      {/* Description Area */}
      <div className="px-4 py-3 min-h-[60px] bg-black/50">
        <p className="text-xs text-terminal/60 italic leading-relaxed line-clamp-2 h-8 font-light">
            {repo.description || "No description provided."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="flex-1 p-2 bg-black/40 flex flex-col gap-1">
        {stats.map((stat) => {
            const config = STAT_CONFIG[stat];
            const Icon = config.icon;
            const isSelected = highlightedStat === stat;
            const value = stat === 'size' ? `${Math.round(repo[stat] / 1024)}MB` : repo[stat].toLocaleString();

            return (
                <div 
                    key={stat}
                    onClick={() => {
                        if (isInteractable && !isSelected && onSelectStat) {
                            playSound.click();
                            onSelectStat(stat);
                        }
                    }}
                    onMouseEnter={() => isInteractable && !isSelected && playSound.hover()}
                    className={`
                        grid grid-cols-[24px_1fr_auto] items-center px-3 py-2.5 rounded-sm border border-transparent
                        transition-all duration-150 cursor-default select-none
                        ${isSelected ? 'stat-row-selected border-terminal' : 'text-terminal/80 hover:bg-terminal/5 hover:border-terminal/20'}
                        ${isInteractable && !isSelected ? 'cursor-pointer' : ''}
                    `}
                >
                    <Icon size={14} className={isSelected ? 'text-black' : 'text-terminal/60'} />
                    <span className={`text-xs uppercase tracking-wider font-medium ${isSelected ? 'text-black' : ''}`}>
                        {config.label}
                    </span>
                    <span className={`font-mono text-sm font-bold ${isSelected ? 'text-black' : 'text-terminal'}`}>
                        {value}
                    </span>
                </div>
            );
        })}
      </div>

      {/* Footer Status */}
      <div className={`py-1.5 text-[10px] text-center uppercase tracking-[0.2em] font-bold border-t border-terminal/20 ${isWinner ? 'bg-terminal text-black' : isLoser ? 'bg-red-900/50 text-red-200' : 'bg-terminal/5 text-terminal/40'}`}>
         {isWinner ? 'VICTORY' : isLoser ? 'DEFEAT' : 'READY'}
      </div>
      
      {/* Visual Glitch for Loser */}
      {isLoser && (
        <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay pointer-events-none z-20 flex items-center justify-center">
            <ShieldAlert size={64} className="text-red-500/50 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default memo(Card);