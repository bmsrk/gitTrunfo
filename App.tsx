import React, { useState, useEffect, useCallback } from 'react';
import { createPlayer } from './services/githubService';
import { generateMatchupAnalysis, generateTurnCommentary } from './services/geminiService';
import { playSound } from './services/audioService';
import Card from './components/Card';
import BattleLog from './components/BattleLog';
import { Player, GamePhase, BattleLogEntry, StatType, STAT_LABELS } from './types';

// CONFIGURATION CONSTANTS
const COLORS = {
  green: { label: 'PHOSPHOR', color: '#33ff00' },
  amber: { label: 'AMBER', color: '#ffb000' },
  cyan: { label: 'CYAN', color: '#00ffff' },
  pink: { label: 'HOT PINK', color: '#ff0099' },
  white: { label: 'PAPER', color: '#ffffff' },
};

const FONTS = {
  vt323: { label: 'TERMINAL', css: "'VT323', monospace", scale: 'text-lg' },
  press: { label: '8-BIT', css: "'Press Start 2P', cursive", scale: 'text-xs' },
  code: { label: 'DEV', css: "'Fira Code', monospace", scale: 'text-sm' },
  retro: { label: 'TYPE', css: "'Courier New', Courier, monospace", scale: 'text-sm' },
};

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [player1Username, setPlayer1Username] = useState('facebook');
  const [player2Username, setPlayer2Username] = useState('google');
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  
  // Customization
  const [currentColor, setCurrentColor] = useState<keyof typeof COLORS>('green');
  const [currentFont, setCurrentFont] = useState<keyof typeof FONTS>('vt323');

  // Logic state
  const [logs, setLogs] = useState<BattleLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null);

  // Apply Theme & Font
  useEffect(() => {
    const root = document.documentElement;
    const colorConfig = COLORS[currentColor];
    const fontConfig = FONTS[currentFont];
    
    root.style.setProperty('--terminal-main', colorConfig.color);
    root.style.setProperty('--terminal-dim', `${colorConfig.color}40`); // Higher contrast dim
    root.style.setProperty('--terminal-font', fontConfig.css);

  }, [currentColor, currentFont]);

  const addLog = useCallback((text: string, type: BattleLogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { text, type }]);
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
      
      addLog(`INIT: ${p1.user.login} vs ${p2.user.login}`);
      playSound.start();

      const analysis = await generateMatchupAnalysis(p1, p2);
      addLog(analysis, 'commentary');

      setPhase(GamePhase.BATTLE_START);
      
      setTimeout(() => {
        setPhase(GamePhase.TURN_PLAYER_SELECT);
      }, 600);

    } catch (e: any) {
      setError(e.message || "CONNECTION_FAILED");
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
        addLog(`>> ${currentP1.user.login} wins round. Cards acquired.`, 'combat');
    } else if (winnerId === 'p2') {
        newP2Deck.push(p2Card, p1Card);
        updatedP1 = { ...currentP1, deck: newP1Deck };
        updatedP2 = { ...currentP2, deck: newP2Deck, score: currentP2.score + 1 };
        addLog(`>> ${currentP2.user.login} wins round. You lost card.`, 'combat');
    } else {
        newP1Deck.push(p1Card);
        newP2Deck.push(p2Card);
        updatedP1 = { ...currentP1, deck: newP1Deck };
        updatedP2 = { ...currentP2, deck: newP2Deck };
    }

    setPlayer1(updatedP1);
    setPlayer2(updatedP2);

    setSelectedStat(null);

    if (newP1Deck.length === 0) {
        setPhase(GamePhase.GAME_OVER);
        playSound.lose();
        addLog(`SESSION TERMINATED. WINNER: ${updatedP2.user.login}`, 'commentary');
    } else if (newP2Deck.length === 0) {
        setPhase(GamePhase.GAME_OVER);
        playSound.win();
        addLog(`SESSION TERMINATED. WINNER: ${updatedP1.user.login}`, 'commentary');
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
    } else {
        addLog("RESULT: DRAW. CARDS RETAINED.", 'combat');
    }

    setTimeout(() => {
        resolveRound(winnerId, player1, player2);
    }, 1200);
  }, [player1, player2, addLog, resolveRound]);

  return (
    <div className={`min-h-screen p-4 flex flex-col items-center justify-center gap-4 transition-colors duration-500 ${FONTS[currentFont].scale}`}>
        
        {/* Main Interface Wrapper */}
        <div className="w-full max-w-2xl bg-black border-4 border-terminal p-2 shadow-[10px_10px_0px_rgba(0,0,0,0.5)] relative">
            
            {/* Window Header */}
            <div className="bg-terminal text-black px-3 py-2 font-bold flex justify-between items-center mb-6">
                <span className="tracking-wider">GIT_TRUNFO_SYSTEM_V1.0</span>
                <div className="flex items-center gap-4">
                     {player1 && player2 && (
                         <span className="bg-black text-terminal px-3 border border-black">
                            SCR: {player1.score.toString().padStart(2, '0')} - {player2.score.toString().padStart(2, '0')}
                         </span>
                     )}
                     {phase !== GamePhase.SETUP && (
                         <button 
                             onClick={handleQuit} 
                             className="bg-red-600 text-white px-3 hover:bg-white hover:text-red-600 font-bold border border-black"
                         >
                             X
                         </button>
                     )}
                </div>
            </div>

            {/* SETUP PHASE */}
            {phase === GamePhase.SETUP && (
                <div className="p-4 flex flex-col gap-6 items-center">
                    <h1 className="text-5xl font-bold tracking-widest text-terminal mb-2 text-center leading-none">
                        GIT<br/>TRUNFO
                    </h1>
                    
                    <div className="w-full max-w-md flex flex-col gap-4">
                         <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold bg-terminal text-black w-fit px-1">PLAYER_ONE_ID</label>
                            <input 
                                value={player1Username}
                                onChange={(e) => setPlayer1Username(e.target.value)}
                                className="w-full bg-black border-2 border-terminal p-3 text-lg focus:outline-none focus:bg-terminal/10"
                            />
                         </div>
                         <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold bg-terminal text-black w-fit px-1">OPPONENT_ID (OR 'CPU')</label>
                            <input 
                                value={player2Username}
                                onChange={(e) => setPlayer2Username(e.target.value)}
                                className="w-full bg-black border-2 border-terminal p-3 text-lg focus:outline-none focus:bg-terminal/10"
                            />
                         </div>
                    </div>

                    {error && <div className="text-white bg-red-600 p-2 font-bold w-full text-center border-2 border-white">ERROR: {error}</div>}

                    <button 
                        onClick={handleStartGame}
                        onMouseEnter={() => playSound.hover()}
                        className="retro-button px-12 py-4 text-2xl tracking-widest mt-4 w-full max-w-md"
                    >
                        START_GAME
                    </button>

                    {/* System Config Panel */}
                    <div className="mt-8 w-full max-w-md border-2 border-terminal-dim p-4 bg-terminal/5">
                        <div className="text-center font-bold mb-4 bg-terminal-dim text-terminal w-fit mx-auto px-4 -mt-7">SYSTEM_CONFIG</div>
                        
                        <div className="flex flex-col gap-4">
                            {/* Colors */}
                            <div className="flex justify-between items-center border-b border-terminal/20 pb-2">
                                <span className="text-sm font-bold">DISPLAY_COLOR:</span>
                                <div className="flex gap-2">
                                    {(Object.keys(COLORS) as Array<keyof typeof COLORS>).map(c => (
                                        <button
                                            key={c}
                                            onClick={() => { playSound.click(); setCurrentColor(c); }}
                                            className={`w-6 h-6 border-2 transition-transform ${currentColor === c ? 'scale-125 border-white ring-1 ring-black' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-110'}`}
                                            style={{ backgroundColor: COLORS[c].color }}
                                            title={COLORS[c].label}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Fonts */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold">FONT_FACE:</span>
                                <div className="flex gap-2">
                                    {(Object.keys(FONTS) as Array<keyof typeof FONTS>).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => { playSound.click(); setCurrentFont(f); }}
                                            className={`px-2 py-1 text-[10px] border border-terminal transition-all hover:bg-terminal hover:text-black uppercase ${currentFont === f ? 'bg-terminal text-black font-bold' : ''}`}
                                        >
                                            {FONTS[f].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-xs text-terminal/60 mt-4 font-mono">
                        created with &lt;3 by <a href="https://x.com/enrichthesoil" target="_blank" rel="noreferrer" className="text-terminal font-bold hover:bg-terminal hover:text-black">@enrichthesoil</a>
                    </div>
                </div>
            )}

            {/* LOADING PHASE */}
            {phase === GamePhase.LOADING && (
                <div className="p-20 text-center">
                    <div className="text-4xl animate-bounce mb-4 text-terminal">LOADING...</div>
                    <div className="w-64 h-4 border-2 border-terminal p-0.5 mx-auto">
                        <div className="h-full bg-terminal animate-[slideIn_2s_ease-out_infinite] w-full origin-left scale-x-0" style={{animationFillMode: 'forwards', animationName: 'progress'}}></div>
                    </div>
                    <style>{`@keyframes progress { 0% { width: 0%} 100% { width: 100% } }`}</style>
                </div>
            )}

            {/* BATTLE PHASE */}
            {(phase === GamePhase.BATTLE_START || phase === GamePhase.TURN_PLAYER_SELECT || phase === GamePhase.TURN_RESOLVE || phase === GamePhase.GAME_OVER) && player1 && player2 && (
                <div className="p-2 flex flex-col gap-6">
                    
                    {/* Stats Header */}
                    <div className="flex justify-between items-end border-b-2 border-terminal pb-4 px-2">
                        <div className="flex items-center gap-3">
                             <img src={player1.user.avatar_url} className="w-12 h-12 border-2 border-terminal bg-terminal/20" alt="P1" />
                             <div>
                                <div className="font-bold text-lg leading-none">{player1.user.login.toUpperCase()}</div>
                                <div className="text-sm opacity-70">CARDS: {player1.deck.length}</div>
                             </div>
                        </div>
                        <div className="text-3xl font-bold opacity-50">VS</div>
                        <div className="flex items-center gap-3 text-right">
                             <div>
                                <div className="font-bold text-lg leading-none">{player2.user.login.toUpperCase()}</div>
                                <div className="text-sm opacity-70">CARDS: {player2.deck.length}</div>
                             </div>
                             <img src={player2.user.avatar_url} className="w-12 h-12 border-2 border-terminal bg-terminal/20" alt="P2" />
                        </div>
                    </div>

                    {/* Cards Container */}
                    <div className="flex justify-center items-start gap-8 py-2 relative min-h-[350px]">
                        {/* Player 1 Card (User) */}
                        <div className="animate-enter relative z-10">
                            <Card 
                                repo={player1.deck[0]} 
                                isInteractable={phase === GamePhase.TURN_PLAYER_SELECT}
                                onSelectStat={executeTurn}
                                isWinner={showResult && roundWinner === 'p1'}
                                isLoser={showResult && roundWinner === 'p2'}
                                highlightedStat={selectedStat}
                            />
                            {phase === GamePhase.TURN_PLAYER_SELECT && (
                                <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-terminal animate-pulse text-2xl font-bold">
                                    ▶
                                </div>
                            )}
                        </div>

                        {/* Player 2 Card (Opponent) */}
                        <div className="animate-enter">
                            <Card 
                                repo={player2.deck[0]} 
                                isHidden={!showResult}
                                isWinner={showResult && roundWinner === 'p2'}
                                isLoser={showResult && roundWinner === 'p1'}
                                highlightedStat={selectedStat}
                            />
                        </div>
                    </div>

                    {/* Battle Log */}
                    <BattleLog logs={logs} />
                </div>
            )}

            {/* GAME OVER OVERLAY */}
            {phase === GamePhase.GAME_OVER && (
                 <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4 border-4 border-terminal m-[-4px]">
                    <h2 className="text-6xl font-bold text-terminal mb-4 animate-glitch text-center">GAME<br/>OVER</h2>
                    <div className="text-2xl text-white mb-8 border-b-2 border-white pb-2">
                        VICTOR: {player1?.deck.length === 0 ? player2?.user.login : player1?.user.login}
                    </div>
                    <button 
                        onClick={() => { playSound.click(); setPhase(GamePhase.SETUP); }}
                        onMouseEnter={() => playSound.hover()}
                        className="retro-button px-8 py-3 text-xl"
                    >
                        SYSTEM_REBOOT
                    </button>
                 </div>
            )}
        </div>
    </div>
  );
};

export default App;