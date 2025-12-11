import React, { useState, useEffect, useCallback } from 'react';
import { createPlayer } from './services/githubService';
import { generateMatchupAnalysis, generateTurnCommentary } from './services/geminiService';
import { playSound } from './services/audioService';
import Card from './components/Card';
import BattleLog from './components/BattleLog';
import { Player, GamePhase, BattleLogEntry, StatType, STAT_LABELS } from './types';
import { Swords, RotateCcw, X, Github, Monitor, ShieldAlert, Cpu } from 'lucide-react';

// CONFIGURATION CONSTANTS
const THEMES = [
  {
    id: 'retro',
    label: 'RETRO',
    colors: {
      background: '#0B0E11',
      foreground: '#3DF5FF',
      keyword: '#FF6B81',
      string: '#FFDD57',
      number: '#7CFFA1',
      comment: '#5E7480',
    }
  },
  {
    id: 'dracula',
    label: 'DRACULA',
    colors: {
      background: "#282a36",
      foreground: "#bd93f9",
      keyword: "#ff79c6",
      string: "#f1fa8c",
      number: "#8be9fd",
      comment: "#6272a4",
    }
  },
  {
    id: 'monokai',
    label: 'MONOKAI',
    colors: {
      background: "#272822",
      foreground: "#a6e22e",
      keyword: "#f92672",
      string: "#e6db74",
      number: "#ae81ff",
      comment: "#75715e",
    }
  },
  {
    id: 'synthwave',
    label: 'SYNTHWAVE',
    colors: {
      background: "#130f1a",
      foreground: "#00ff9f", // textPrimary
      keyword: "#ff0055",     // accentPrimary
      string: "#00f3ff",      // accentSecondary
      number: "#b829ea",      // accentWarning/Numbers
      comment: "#4b5263",     // textDim
    }
  }
];

const FONTS = {
  vt323: { label: 'RETRO', css: "'VT323', monospace" },
  code: { label: 'CLEAN', css: "'Fira Code', monospace" },
};

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [player1Username, setPlayer1Username] = useState('facebook');
  const [player2Username, setPlayer2Username] = useState('google');
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  
  // Customization
  const [currentThemeId, setCurrentThemeId] = useState<string>('retro');
  const [currentFont, setCurrentFont] = useState<keyof typeof FONTS>('code');

  // Logic state
  const [logs, setLogs] = useState<BattleLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null);

  // Apply Theme & Font
  useEffect(() => {
    const root = document.documentElement;
    const theme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
    
    root.style.setProperty('--terminal-bg', theme.colors.background);
    root.style.setProperty('--terminal-main', theme.colors.foreground);
    root.style.setProperty('--terminal-dim', theme.colors.comment);
    
    // Font
    if (currentFont === 'vt323') {
       document.body.style.fontFamily = "'VT323', monospace";
    } else {
       document.body.style.fontFamily = "'Fira Code', monospace";
    }

    root.style.setProperty('--syntax-key', theme.colors.keyword);
    root.style.setProperty('--syntax-val', theme.colors.number);
    root.style.setProperty('--syntax-str', theme.colors.string);

  }, [currentThemeId, currentFont]);

  const addLog = useCallback((text: string, type: BattleLogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9),
      text, 
      type,
      timestamp: Date.now()
    }]);
    playSound.type();
  }, []);

  const handleStartGame = useCallback(async () => {
    playSound.click();
    setPhase(GamePhase.LOADING);
    setError(null);
    setLogs([]);

    try {
      const p1 = await createPlayer(player1Username, 'p1', false);
      const isCpu = player2Username.toLowerCase() === 'cpu';
      const p2Name = isCpu ? 'google' : player2Username;
      
      const p2 = await createPlayer(p2Name, 'p2', isCpu);

      setPlayer1(p1);
      setPlayer2(p2);
      
      addLog(`Connected: ${p1.user.login} vs ${p2.user.login}`);
      playSound.start();

      const analysis = await generateMatchupAnalysis(p1, p2);
      addLog(analysis, 'commentary');

      setPhase(GamePhase.BATTLE_START);
      
      setTimeout(() => {
        setPhase(GamePhase.TURN_PLAYER_SELECT);
      }, 600);

    } catch (e: any) {
      setError(e.message || "Connection Failed");
      playSound.lose();
      setPhase(GamePhase.SETUP);
    }
  }, [player1Username, player2Username, addLog]);

  const handleQuit = useCallback(() => {
    playSound.click();
    setPhase(GamePhase.SETUP);
    setPlayer1(null);
    setPlayer2(null);
    setShowResult(false);
    setSelectedStat(null);
  }, []);

  const resolveRound = useCallback((winnerId: string, currentP1: Player, currentP2: Player) => {
    const newP1Deck = [...currentP1.deck];
    const newP2Deck = [...currentP2.deck];

    const p1Card = newP1Deck.shift();
    const p2Card = newP2Deck.shift();

    if (!p1Card || !p2Card) return;

    let updatedP1 = { ...currentP1 };
    let updatedP2 = { ...currentP2 };

    if (winnerId === 'p1') {
        newP1Deck.push(p1Card, p2Card);
        updatedP1 = { ...currentP1, deck: newP1Deck, score: currentP1.score + 1 };
        updatedP2 = { ...currentP2, deck: newP2Deck };
        addLog(`${currentP1.user.login} wins the round.`, 'combat');
    } else if (winnerId === 'p2') {
        newP2Deck.push(p2Card, p1Card);
        updatedP1 = { ...currentP1, deck: newP1Deck };
        updatedP2 = { ...currentP2, deck: newP2Deck, score: currentP2.score + 1 };
        addLog(`${currentP2.user.login} wins the round.`, 'combat');
    } else {
        newP1Deck.push(p1Card);
        newP2Deck.push(p2Card);
        updatedP1 = { ...currentP1, deck: newP1Deck };
        updatedP2 = { ...currentP2, deck: newP2Deck };
        addLog(`It's a draw. Cards retained.`, 'combat');
    }

    setPlayer1(updatedP1);
    setPlayer2(updatedP2);

    setSelectedStat(null);

    if (newP1Deck.length === 0) {
        setPhase(GamePhase.GAME_OVER);
        playSound.lose();
        addLog(`Game Over. Winner: ${updatedP2.user.login}`, 'commentary');
    } else if (newP2Deck.length === 0) {
        setPhase(GamePhase.GAME_OVER);
        playSound.win();
        addLog(`Game Over. Winner: ${updatedP1.user.login}`, 'commentary');
    } else {
        setShowResult(false);
        setRoundWinner(null);
        setPhase(GamePhase.TURN_PLAYER_SELECT);
    }
  }, [addLog]);

  const executeTurn = useCallback(async (stat: StatType) => {
    if (!player1 || !player2) return;
    
    setSelectedStat(stat);
    setPhase(GamePhase.TURN_RESOLVE);
    setShowResult(true);

    const p1Card = player1.deck[0];
    const p2Card = player2.deck[0];

    const val1 = p1Card[stat];
    const val2 = p2Card[stat];

    let winnerId = '';
    
    if (val1 > val2) winnerId = 'p1';
    else if (val2 > val1) winnerId = 'p2';
    else winnerId = 'draw';

    setRoundWinner(winnerId);

    if (winnerId === 'p1') playSound.win();
    else if (winnerId === 'p2') playSound.lose();
    else playSound.draw();

    if (winnerId !== 'draw') {
        const winner = winnerId === 'p1' ? player1 : player2;
        const loser = winnerId === 'p1' ? player2 : player1;
        const winningCard = winnerId === 'p1' ? p1Card : p2Card;
        
        const comment = await generateTurnCommentary(
            winner.user.login, 
            loser.user.login, 
            STAT_LABELS[stat], 
            winnerId === 'p1' ? val1 : val2,
            winnerId === 'p1' ? val2 : val1,
            winningCard.name
        );
        addLog(comment, 'commentary');
    }

    setTimeout(() => {
        resolveRound(winnerId, player1, player2);
    }, 1500);
  }, [player1, player2, addLog, resolveRound]);

  return (
    <div className="h-screen w-screen flex flex-col items-center bg-[var(--terminal-bg)] overflow-hidden">
        
        {/* HEADER */}
        <div className="w-full shrink-0 h-14 border-b border-terminal/30 px-4 flex justify-between items-center bg-black/20 z-20">
            <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-retro font-bold text-terminal tracking-widest leading-none">GIT_TRUNFO</span>
                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-terminal/50">Card Battle System v2.0</span>
            </div>
            
            <div className="flex items-center gap-3">
                 {phase !== GamePhase.SETUP && (
                     <button 
                         onClick={handleQuit} 
                         className="flex items-center gap-1.5 px-3 py-1 border border-terminal/50 text-terminal text-[10px] md:text-xs hover:bg-red-900/20 hover:border-red-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wider"
                     >
                         <X size={12} /> Quit
                     </button>
                 )}
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 w-full max-w-6xl relative flex flex-col overflow-hidden">
            
            {/* SETUP PHASE */}
            {phase === GamePhase.SETUP && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 animate-enter overflow-y-auto">
                    
                    <div className="w-full max-w-md p-6 md:p-8 border border-terminal/30 bg-terminal/5 shadow-2xl backdrop-blur-sm rounded-sm">
                        <div className="flex items-center gap-3 mb-6 text-terminal border-b border-terminal/20 pb-4">
                            <Monitor size={24} />
                            <h2 className="text-xl font-bold uppercase tracking-widest">New Session</h2>
                        </div>

                         <div className="flex flex-col gap-5">
                             <div className="group">
                                <label className="text-[10px] font-bold text-terminal/60 uppercase tracking-wider mb-1.5 block group-focus-within:text-terminal">Player One</label>
                                <div className="relative">
                                    <Github className="absolute left-3 top-2.5 text-terminal/40 transition-colors group-focus-within:text-terminal" size={16} />
                                    <input 
                                        value={player1Username}
                                        onChange={(e) => setPlayer1Username(e.target.value)}
                                        className="w-full bg-black/50 border border-terminal/30 py-2 pl-9 pr-3 text-sm text-terminal focus:outline-none focus:border-terminal focus:bg-black focus:shadow-[0_0_15px_-5px_var(--terminal-main)] transition-all"
                                        placeholder="GitHub Username"
                                    />
                                </div>
                             </div>
                             
                             <div className="group">
                                <label className="text-[10px] font-bold text-terminal/60 uppercase tracking-wider mb-1.5 block group-focus-within:text-terminal">Opponent</label>
                                <div className="relative">
                                    {player2Username.toLowerCase() === 'cpu' ? (
                                      <Cpu className="absolute left-3 top-2.5 text-terminal/40 transition-colors group-focus-within:text-terminal" size={16} />
                                    ) : (
                                      <Github className="absolute left-3 top-2.5 text-terminal/40 transition-colors group-focus-within:text-terminal" size={16} />
                                    )}
                                    <input 
                                        value={player2Username}
                                        onChange={(e) => setPlayer2Username(e.target.value)}
                                        className="w-full bg-black/50 border border-terminal/30 py-2 pl-9 pr-3 text-sm text-terminal focus:outline-none focus:border-terminal focus:bg-black focus:shadow-[0_0_15px_-5px_var(--terminal-main)] transition-all"
                                        placeholder="Username or 'CPU'"
                                    />
                                </div>
                             </div>

                             {error && <div className="text-red-400 bg-red-900/10 p-3 text-xs border border-red-900/50 flex items-center gap-2"><ShieldAlert size={14} /> {error}</div>}

                             <button 
                                onClick={handleStartGame}
                                onMouseEnter={() => playSound.hover()}
                                className="retro-button py-3 text-lg font-bold mt-2 hover:tracking-[0.2em]"
                             >
                                INITIALIZE BATTLE
                             </button>
                        </div>
                    </div>

                    {/* Theme Selector */}
                    <div className="mt-8 grid grid-cols-4 gap-2 text-[10px] md:text-xs text-terminal/40">
                         {THEMES.map(t => (
                             <button
                                 key={t.id}
                                 onClick={() => { playSound.click(); setCurrentThemeId(t.id); }}
                                 className={`px-3 py-1.5 border border-transparent hover:text-terminal hover:border-terminal/30 transition-all ${currentThemeId === t.id ? 'text-terminal border-b-terminal bg-terminal/5' : ''}`}
                             >
                                 {t.label}
                             </button>
                         ))}
                    </div>
                </div>
            )}

            {/* LOADING PHASE */}
            {phase === GamePhase.LOADING && (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-4xl md:text-6xl font-retro text-terminal animate-pulse mb-8">LOADING</div>
                    <div className="w-64 h-0.5 bg-terminal/20 overflow-hidden relative">
                        <div className="absolute inset-0 bg-terminal animate-[progress_1s_ease-in-out_infinite] origin-left"></div>
                    </div>
                    <style>{`@keyframes progress { 0% { width: 0%; transform: translateX(-100%); } 100% { width: 100%; transform: translateX(100%); } }`}</style>
                </div>
            )}

            {/* BATTLE PHASE */}
            {(phase === GamePhase.BATTLE_START || phase === GamePhase.TURN_PLAYER_SELECT || phase === GamePhase.TURN_RESOLVE || phase === GamePhase.GAME_OVER) && player1 && player2 && (
                <div className="flex-1 flex flex-col w-full h-full relative">
                    
                    {/* Score Board */}
                    <div className="shrink-0 flex justify-between items-center w-full px-4 py-2 bg-terminal/5 border-b border-terminal/10 z-10">
                         <div className="flex items-center gap-3">
                             <img src={player1.user.avatar_url} className="w-8 h-8 rounded-sm border border-terminal/30" alt="P1" />
                             <div className="leading-tight">
                                <div className="font-bold text-sm text-terminal">{player1.user.login}</div>
                                <div className="text-[10px] text-terminal/50 font-mono">CARDS: {player1.deck.length}</div>
                             </div>
                         </div>
                         
                         <div className="text-xl md:text-3xl font-retro font-bold text-terminal/30 tracking-[0.2em]">{player1.score} - {player2.score}</div>
                         
                         <div className="flex items-center gap-3 text-right">
                             <div className="leading-tight">
                                <div className="font-bold text-sm text-terminal">{player2.user.login}</div>
                                <div className="text-[10px] text-terminal/50 font-mono">CARDS: {player2.deck.length}</div>
                             </div>
                             <img src={player2.user.avatar_url} className="w-8 h-8 rounded-sm border border-terminal/30" alt="P2" />
                         </div>
                    </div>

                    {/* Arena - Responsive Layout */}
                    <div className="flex-1 flex flex-col md:flex-row justify-center items-center relative overflow-hidden p-2 md:p-6 gap-2 md:gap-16">
                        
                        {/* Mobile: Opponent is on top, smaller */}
                        <div className={`order-1 md:order-3 transition-all duration-500 relative z-0 ${phase === GamePhase.TURN_PLAYER_SELECT ? 'scale-90 opacity-80 md:scale-100 md:opacity-100' : 'scale-100'}`}>
                            <Card 
                                repo={player2.deck[0]} 
                                isHidden={!showResult}
                                isWinner={showResult && roundWinner === 'p2'}
                                isLoser={showResult && roundWinner === 'p1'}
                                highlightedStat={selectedStat}
                            />
                        </div>

                        {/* VS Divider */}
                        <div className="order-2 flex flex-col items-center justify-center z-0 shrink-0 opacity-50">
                            <div className="hidden md:block h-16 w-px bg-gradient-to-b from-transparent via-terminal/50 to-transparent"></div>
                            <div className="my-1 md:my-2 bg-black border border-terminal/30 px-2 py-0.5 text-[10px] font-bold text-terminal/60">VS</div>
                            <div className="hidden md:block h-16 w-px bg-gradient-to-b from-transparent via-terminal/50 to-transparent"></div>
                        </div>

                        {/* Player 1 (User) */}
                        <div className="order-3 md:order-1 relative z-10">
                            <Card 
                                repo={player1.deck[0]} 
                                isInteractable={phase === GamePhase.TURN_PLAYER_SELECT}
                                onSelectStat={executeTurn}
                                isWinner={showResult && roundWinner === 'p1'}
                                isLoser={showResult && roundWinner === 'p2'}
                                highlightedStat={selectedStat}
                            />
                            {phase === GamePhase.TURN_PLAYER_SELECT && (
                                <div className="absolute -right-6 md:-left-8 top-1/2 -translate-y-1/2 text-terminal animate-bounce pointer-events-none">
                                    <Swords size={24} />
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Battle Log - Fixed Bottom */}
                    <div className="shrink-0 h-[120px] md:h-[140px] w-full border-t border-terminal/20 bg-black z-20">
                        <BattleLog logs={logs} />
                    </div>
                </div>
            )}

            {/* GAME OVER MODAL */}
            {phase === GamePhase.GAME_OVER && (
                 <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-enter">
                     <div className="bg-[#0a0a0a] border-2 border-terminal p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(var(--terminal-main),0.2)]">
                        <h2 className="text-4xl md:text-5xl font-retro text-terminal mb-2 tracking-widest">GAME OVER</h2>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-terminal to-transparent mb-8"></div>
                        
                        <div className="mb-8">
                            <div className="text-terminal/60 text-sm uppercase tracking-widest mb-2">Winner</div>
                            <div className="text-3xl font-bold text-white">
                                {player1?.deck.length === 0 ? player2?.user.login : player1?.user.login}
                            </div>
                        </div>

                        <button 
                            onClick={() => { playSound.click(); setPhase(GamePhase.SETUP); }}
                            className="retro-button px-8 py-3 text-lg flex items-center justify-center gap-2 mx-auto w-full hover:bg-terminal hover:text-black"
                        >
                            <RotateCcw size={18} />
                            RESTART SYSTEM
                        </button>
                     </div>
                 </div>
            )}
        </div>
    </div>
  );
};

export default App;