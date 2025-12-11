import React, { useState, useEffect, useCallback } from 'react';
import { createPlayer } from './services/githubService';
import { generateMatchupAnalysis, generateTurnCommentary } from './services/geminiService';
import { playSound } from './services/audioService';
import Card from './components/Card';
import BattleLog from './components/BattleLog';
import { Player, GamePhase, BattleLogEntry, StatType, STAT_LABELS } from './types';
import { Swords, RotateCcw, X, Github, Monitor, ShieldAlert, Cpu, Trophy, Skull, BookOpen, Settings, Star, GitFork, Eye, HardDrive, CircleDot, Code2 } from 'lucide-react';

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
      accent: '#FF6B81',      // Pink accent for buttons/highlights
      accentHover: '#FF8AA0', // Lighter pink for hover
      success: '#7CFFA1',     // Green for success states
      warning: '#FFDD57',     // Yellow for warnings
      error: '#FF6B81',       // Pink/Red for errors
      muted: '#2A3440',       // Muted background
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
      accent: "#ff79c6",      // Pink accent
      accentHover: "#ffb3e6", // Lighter pink
      success: "#50fa7b",     // Green
      warning: "#f1fa8c",     // Yellow
      error: "#ff5555",       // Red
      muted: "#44475a",       // Selection gray
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
      accent: "#f92672",      // Pink/Magenta accent
      accentHover: "#ff669d", // Lighter magenta
      success: "#a6e22e",     // Green
      warning: "#e6db74",     // Yellow
      error: "#f92672",       // Pink/Red
      muted: "#3e3d32",       // Darker bg
    }
  },
  {
    id: 'synthwave',
    label: 'SYNTHWAVE',
    colors: {
      background: "#130f1a",
      foreground: "#00ff9f",
      keyword: "#ff0055",
      string: "#00f3ff",
      number: "#b829ea",
      comment: "#4b5263",
      accent: "#ff0055",      // Hot pink
      accentHover: "#ff2d75", // Lighter hot pink
      success: "#00ff9f",     // Neon green
      warning: "#ffd500",     // Yellow
      error: "#ff0055",       // Hot pink
      muted: "#241e2e",       // Dark purple
    }
  },
  {
    id: 'github-dark',
    label: 'GITHUB',
    colors: {
      background: "#0d1117",
      foreground: "#58a6ff",
      keyword: "#ff7b72",
      string: "#a5d6ff",
      number: "#79c0ff",
      comment: "#8b949e",
      accent: "#1f6feb",      // GitHub blue
      accentHover: "#388bfd", // Lighter blue
      success: "#3fb950",     // Green
      warning: "#d29922",     // Yellow
      error: "#f85149",       // Red
      muted: "#161b22",       // Darker bg
    }
  },
  {
    id: 'nord',
    label: 'NORD',
    colors: {
      background: "#2e3440",
      foreground: "#88c0d0",
      keyword: "#81a1c1",
      string: "#a3be8c",
      number: "#b48ead",
      comment: "#616e88",
      accent: "#81a1c1",      // Nord blue
      accentHover: "#a3bcd4", // Lighter nord blue
      success: "#a3be8c",     // Green
      warning: "#ebcb8b",     // Yellow
      error: "#bf616a",       // Red
      muted: "#3b4252",       // Darker nord bg
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
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
    
    // Main theme colors
    root.style.setProperty('--terminal-bg', theme.colors.background);
    root.style.setProperty('--terminal-main', theme.colors.foreground);
    root.style.setProperty('--terminal-dim', theme.colors.comment);
    
    // Syntax highlighting
    root.style.setProperty('--syntax-key', theme.colors.keyword);
    root.style.setProperty('--syntax-val', theme.colors.number);
    root.style.setProperty('--syntax-str', theme.colors.string);
    
    // Extended theme colors
    root.style.setProperty('--accent-primary', theme.colors.accent);
    root.style.setProperty('--accent-hover', theme.colors.accentHover);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--bg-muted', theme.colors.muted);
    
    // Font
    if (currentFont === 'vt323') {
       document.body.style.fontFamily = "'VT323', monospace";
    } else {
       document.body.style.fontFamily = "'Fira Code', monospace";
    }

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

  // RulesModal Component
  const RulesModal = () => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-enter">
      <div className="bg-[var(--terminal-bg)] border-2 border-[var(--accent-primary)] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(var(--accent-primary),0.3)]">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--terminal-bg)] border-b border-[var(--accent-primary)]/30 p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-[var(--accent-primary)]" />
            <h2 className="text-xl md:text-2xl font-retro text-[var(--accent-primary)] uppercase tracking-widest">Game Rules</h2>
          </div>
          <button
            onClick={() => { playSound.click(); setShowRulesModal(false); }}
            className="text-terminal/60 hover:text-[var(--accent-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Objective */}
          <section>
            <h3 className="text-lg font-bold text-[var(--syntax-val)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Trophy size={18} /> Objective
            </h3>
            <p className="text-terminal/80 text-sm leading-relaxed">
              Capture all of your opponent's repository cards by winning statistical battles. 
              The player with all the cards at the end wins the game!
            </p>
          </section>

          {/* Setup */}
          <section>
            <h3 className="text-lg font-bold text-[var(--syntax-val)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Monitor size={18} /> Setup
            </h3>
            <ul className="space-y-2 text-terminal/80 text-sm">
              <li className="flex gap-2">
                <span className="text-[var(--accent-primary)] font-bold">1.</span>
                <span>Enter two GitHub usernames (or use "CPU" for AI opponent)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--accent-primary)] font-bold">2.</span>
                <span>Each player gets a deck of their most popular repositories</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--accent-primary)] font-bold">3.</span>
                <span>Cards are shuffled randomly at the start</span>
              </li>
            </ul>
          </section>

          {/* Gameplay */}
          <section>
            <h3 className="text-lg font-bold text-[var(--syntax-val)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Swords size={18} /> Gameplay
            </h3>
            <ul className="space-y-2 text-terminal/80 text-sm">
              <li className="flex gap-2">
                <span className="text-[var(--accent-primary)] font-bold">1.</span>
                <span>On your turn, select a stat from your top card to compete with</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--accent-primary)] font-bold">2.</span>
                <span>Your opponent's card is revealed and stats are compared</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--accent-primary)] font-bold">3.</span>
                <span>The player with the higher stat value wins the round</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--accent-primary)] font-bold">4.</span>
                <span>Winner takes both cards and adds them to the bottom of their deck</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--accent-primary)] font-bold">5.</span>
                <span>In case of a tie, each player keeps their own card</span>
              </li>
            </ul>
          </section>

          {/* Stats Explained */}
          <section>
            <h3 className="text-lg font-bold text-[var(--syntax-val)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Code2 size={18} /> Repository Stats
            </h3>
            <div className="grid gap-3">
              <div className="bg-[var(--bg-muted)] p-3 border border-terminal/20">
                <div className="font-bold text-[var(--syntax-str)] mb-1 flex items-center gap-2">
                  <Star size={14} /> Stars
                </div>
                <p className="text-xs text-terminal/70">Number of users who starred the repository</p>
              </div>
              <div className="bg-[var(--bg-muted)] p-3 border border-terminal/20">
                <div className="font-bold text-[var(--syntax-str)] mb-1 flex items-center gap-2">
                  <GitFork size={14} /> Forks
                </div>
                <p className="text-xs text-terminal/70">Number of times the repository has been forked</p>
              </div>
              <div className="bg-[var(--bg-muted)] p-3 border border-terminal/20">
                <div className="font-bold text-[var(--syntax-str)] mb-1 flex items-center gap-2">
                  <Eye size={14} /> Watchers
                </div>
                <p className="text-xs text-terminal/70">Number of users watching the repository</p>
              </div>
              <div className="bg-[var(--bg-muted)] p-3 border border-terminal/20">
                <div className="font-bold text-[var(--syntax-str)] mb-1 flex items-center gap-2">
                  <HardDrive size={14} /> Size
                </div>
                <p className="text-xs text-terminal/70">Total size of the repository in megabytes</p>
              </div>
              <div className="bg-[var(--bg-muted)] p-3 border border-terminal/20">
                <div className="font-bold text-[var(--syntax-str)] mb-1 flex items-center gap-2">
                  <CircleDot size={14} /> Issues
                </div>
                <p className="text-xs text-terminal/70">Number of open issues (higher might mean more active development)</p>
              </div>
            </div>
          </section>

          {/* Strategy Tips */}
          <section>
            <h3 className="text-lg font-bold text-[var(--syntax-val)] uppercase tracking-wider mb-3">💡 Strategy Tips</h3>
            <ul className="space-y-2 text-terminal/80 text-sm list-disc list-inside">
              <li>Choose stats strategically based on your repository type</li>
              <li>Popular projects tend to have high stars and forks</li>
              <li>Large projects might have more issues due to complexity</li>
              <li>Pay attention to your opponent's deck size - they might be running out!</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--terminal-bg)] border-t border-[var(--accent-primary)]/30 p-4">
          <button
            onClick={() => { playSound.click(); setShowRulesModal(false); }}
            className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-black font-bold py-3 px-6 transition-all uppercase tracking-wider text-sm"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );

  // SettingsModal Component
  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-enter">
      <div className="bg-[var(--terminal-bg)] border-2 border-[var(--syntax-val)] max-w-lg w-full shadow-[0_0_40px_rgba(var(--syntax-val),0.3)]">
        {/* Header */}
        <div className="bg-[var(--terminal-bg)] border-b border-[var(--syntax-val)]/30 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings size={24} className="text-[var(--syntax-val)]" />
            <h2 className="text-xl md:text-2xl font-retro text-[var(--syntax-val)] uppercase tracking-widest">Settings</h2>
          </div>
          <button
            onClick={() => { playSound.click(); setShowSettingsModal(false); }}
            className="text-terminal/60 hover:text-[var(--syntax-val)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Selection */}
          <section>
            <h3 className="text-sm font-bold text-terminal uppercase tracking-wider mb-3">Color Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { playSound.click(); setCurrentThemeId(t.id); }}
                  className={`px-4 py-3 border transition-all text-sm font-bold uppercase tracking-wider ${
                    currentThemeId === t.id
                      ? 'border-[var(--syntax-val)] bg-[var(--syntax-val)]/20 text-[var(--syntax-val)]'
                      : 'border-terminal/30 text-terminal/60 hover:text-terminal hover:border-terminal/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Font Selection */}
          <section>
            <h3 className="text-sm font-bold text-terminal uppercase tracking-wider mb-3">Font Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FONTS).map(([key, font]) => (
                <button
                  key={key}
                  onClick={() => { playSound.click(); setCurrentFont(key as keyof typeof FONTS); }}
                  className={`px-4 py-3 border transition-all text-sm font-bold uppercase tracking-wider ${
                    currentFont === key
                      ? 'border-[var(--syntax-val)] bg-[var(--syntax-val)]/20 text-[var(--syntax-val)]'
                      : 'border-terminal/30 text-terminal/60 hover:text-terminal hover:border-terminal/50'
                  }`}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-[var(--terminal-bg)] border-t border-[var(--syntax-val)]/30 p-4">
          <button
            onClick={() => { playSound.click(); setShowSettingsModal(false); }}
            className="w-full bg-[var(--syntax-val)] hover:bg-[var(--syntax-val)]/80 text-black font-bold py-3 px-6 transition-all uppercase tracking-wider text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col items-center bg-[var(--terminal-bg)] overflow-hidden">
        
        {/* HEADER */}
        <div className="w-full shrink-0 h-14 border-b border-terminal/30 px-4 flex justify-between items-center bg-black/20 z-20">
            <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-retro font-bold text-terminal tracking-widest leading-none">GIT_TRUNFO</span>
                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-terminal/50">Card Battle System v2.0</span>
            </div>
            
            <div className="flex items-center gap-2">
                 <button 
                     onClick={() => { playSound.click(); setShowRulesModal(true); }} 
                     className="flex items-center gap-1.5 px-2 md:px-3 py-1 border border-[var(--accent-primary)]/50 text-[var(--accent-primary)] text-[10px] md:text-xs hover:bg-[var(--accent-primary)]/20 hover:border-[var(--accent-primary)] transition-colors uppercase font-bold tracking-wider"
                     title="Game Rules"
                 >
                     <BookOpen size={12} /> <span className="hidden md:inline">Rules</span>
                 </button>
                 
                 <button 
                     onClick={() => { playSound.click(); setShowSettingsModal(true); }} 
                     className="flex items-center gap-1.5 px-2 md:px-3 py-1 border border-[var(--syntax-val)]/50 text-[var(--syntax-val)] text-[10px] md:text-xs hover:bg-[var(--syntax-val)]/20 hover:border-[var(--syntax-val)] transition-colors uppercase font-bold tracking-wider"
                     title="Settings"
                 >
                     <Settings size={12} /> <span className="hidden md:inline">Settings</span>
                 </button>
                 
                 {phase !== GamePhase.SETUP && (
                     <button 
                         onClick={handleQuit} 
                         className="flex items-center gap-1.5 px-2 md:px-3 py-1 border border-terminal/50 text-terminal text-[10px] md:text-xs hover:bg-red-900/20 hover:border-red-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wider"
                     >
                         <X size={12} /> <span className="hidden md:inline">Quit</span>
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

            {/* GAME OVER MODAL - WINNING SCREEN */}
            {phase === GamePhase.GAME_OVER && player1 && player2 && player2.deck.length === 0 && (
                 <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-enter">
                     <div className="bg-gradient-to-b from-green-950/80 to-[#0a0a0a] border-4 border-green-500/50 p-8 max-w-2xl w-full text-center shadow-[0_0_80px_rgba(34,197,94,0.4)] relative overflow-hidden">
                        
                        {/* Animated Background Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.1)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite] pointer-events-none"></div>
                        <style>{`@keyframes shimmer { 0% { background-position: 0 0; } 100% { background-position: 100px 100px; } }`}</style>
                        
                        {/* Trophy Icon */}
                        <div className="relative mb-6">
                            <Trophy size={80} className="mx-auto text-yellow-400 animate-bounce" style={{ animationDuration: '2s' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-32 h-32 bg-yellow-400/20 rounded-full animate-ping"></div>
                            </div>
                        </div>
                        
                        <h2 className="text-5xl md:text-7xl font-retro text-green-400 mb-4 tracking-widest animate-pulse relative z-10">
                            VICTORY!
                        </h2>
                        <div className="h-1 w-full bg-gradient-to-r from-transparent via-green-400 to-transparent mb-8 relative z-10"></div>
                        
                        <div className="mb-8 relative z-10">
                            <div className="text-green-300/80 text-sm uppercase tracking-widest mb-3 font-bold">Champion</div>
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <img src={player1.user.avatar_url} className="w-20 h-20 rounded-full border-4 border-green-400 shadow-lg shadow-green-400/50" alt="Winner" />
                                <div className="text-4xl md:text-5xl font-bold text-green-400">
                                    {player1.user.login}
                                </div>
                            </div>
                            
                            {/* Stats Summary */}
                            <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-black/40 border border-green-500/30 rounded">
                                <div>
                                    <div className="text-green-400/60 text-xs uppercase tracking-wider mb-1">Rounds Won</div>
                                    <div className="text-2xl font-bold text-green-300">{player1.score}</div>
                                </div>
                                <div>
                                    <div className="text-green-400/60 text-xs uppercase tracking-wider mb-1">Cards Remaining</div>
                                    <div className="text-2xl font-bold text-green-300">{player1.deck.length}</div>
                                </div>
                                <div>
                                    <div className="text-green-400/60 text-xs uppercase tracking-wider mb-1">Total Rounds</div>
                                    <div className="text-2xl font-bold text-green-300">{player1.score + player2.score}</div>
                                </div>
                            </div>
                            
                            <div className="mt-6 text-green-400/70 text-sm italic">
                                "Outstanding performance! All repositories captured!"
                            </div>
                        </div>

                        <button 
                            onClick={handleQuit}
                            className="relative z-10 bg-green-600 hover:bg-green-500 text-black font-bold px-8 py-3 text-lg flex items-center justify-center gap-2 mx-auto w-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] border-2 border-green-400"
                        >
                            <RotateCcw size={18} />
                            PLAY AGAIN
                        </button>
                     </div>
                 </div>
            )}
            
            {/* GAME OVER MODAL - LOSING SCREEN */}
            {phase === GamePhase.GAME_OVER && player1 && player2 && player1.deck.length === 0 && (
                 <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-enter">
                     <div className="bg-gradient-to-b from-red-950/80 to-[#0a0a0a] border-4 border-red-500/50 p-8 max-w-2xl w-full text-center shadow-[0_0_80px_rgba(239,68,68,0.4)] relative overflow-hidden">
                        
                        {/* Glitch Effect Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_25%,rgba(239,68,68,0.1)_50%,transparent_75%)] bg-[length:100%_4px] opacity-50 pointer-events-none"></div>
                        
                        {/* Skull Icon */}
                        <div className="relative mb-6">
                            <Skull size={80} className="mx-auto text-red-500 animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-32 h-32 bg-red-500/20 rounded-full animate-ping"></div>
                            </div>
                        </div>
                        
                        <h2 className="text-5xl md:text-7xl font-retro text-red-500 mb-4 tracking-widest relative z-10">
                            YOU LOST
                        </h2>
                        <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent mb-8 relative z-10"></div>
                        
                        <div className="mb-8 relative z-10">
                            <div className="text-red-300/80 text-sm uppercase tracking-widest mb-3 font-bold">Defeated By</div>
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <img src={player2.user.avatar_url} className="w-20 h-20 rounded-full border-4 border-red-500 shadow-lg shadow-red-500/50 grayscale" alt="Victor" />
                                <div className="text-4xl md:text-5xl font-bold text-red-400">
                                    {player2.user.login}
                                </div>
                            </div>
                            
                            {/* Stats Summary */}
                            <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-black/40 border border-red-500/30 rounded">
                                <div>
                                    <div className="text-red-400/60 text-xs uppercase tracking-wider mb-1">Rounds Won</div>
                                    <div className="text-2xl font-bold text-red-300">{player1.score}</div>
                                </div>
                                <div>
                                    <div className="text-red-400/60 text-xs uppercase tracking-wider mb-1">Opponent Cards</div>
                                    <div className="text-2xl font-bold text-red-300">{player2.deck.length}</div>
                                </div>
                                <div>
                                    <div className="text-red-400/60 text-xs uppercase tracking-wider mb-1">Total Rounds</div>
                                    <div className="text-2xl font-bold text-red-300">{player1.score + player2.score}</div>
                                </div>
                            </div>
                            
                            <div className="mt-6 text-red-400/70 text-sm italic">
                                "Don't give up! Every master was once a beginner."
                            </div>
                        </div>

                        <button 
                            onClick={handleQuit}
                            className="relative z-10 bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 text-lg flex items-center justify-center gap-2 mx-auto w-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] border-2 border-red-400"
                        >
                            <RotateCcw size={18} />
                            TRY AGAIN
                        </button>
                     </div>
                 </div>
            )}
        </div>
        
        {/* MODALS */}
        {showRulesModal && <RulesModal />}
        {showSettingsModal && <SettingsModal />}
    </div>
  );
};

export default App;