import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Target, Zap, Globe, RefreshCw, Trophy, AlertTriangle } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { GameStatus, GameState, City, Battery } from './types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  INITIAL_AMMO, 
  TRANSLATIONS,
  WIN_SCORE 
} from './constants';

const initialCities: City[] = [
  { id: 'c1', pos: { x: 120, y: GAME_HEIGHT - 20 }, destroyed: false },
  { id: 'c2', pos: { x: 200, y: GAME_HEIGHT - 20 }, destroyed: false },
  { id: 'c3', pos: { x: 280, y: GAME_HEIGHT - 20 }, destroyed: false },
  { id: 'c4', pos: { x: 520, y: GAME_HEIGHT - 20 }, destroyed: false },
  { id: 'c5', pos: { x: 600, y: GAME_HEIGHT - 20 }, destroyed: false },
  { id: 'c6', pos: { x: 680, y: GAME_HEIGHT - 20 }, destroyed: false },
];

const initialBatteries: Battery[] = [
  { id: 'left', pos: { x: 40, y: GAME_HEIGHT - 20 }, ammo: INITIAL_AMMO.left, maxAmmo: INITIAL_AMMO.left, destroyed: false },
  { id: 'middle', pos: { x: 400, y: GAME_HEIGHT - 20 }, ammo: INITIAL_AMMO.middle, maxAmmo: INITIAL_AMMO.middle, destroyed: false },
  { id: 'right', pos: { x: 760, y: GAME_HEIGHT - 20 }, ammo: INITIAL_AMMO.right, maxAmmo: INITIAL_AMMO.right, destroyed: false },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    status: GameStatus.START,
    level: 1,
    rockets: [],
    interceptors: [],
    explosions: [],
    cities: initialCities,
    batteries: initialBatteries,
    language: 'zh',
  });

  const t = TRANSLATIONS[gameState.language];

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      status: GameStatus.PLAYING,
      level: 1,
      rockets: [],
      interceptors: [],
      explosions: [],
      cities: initialCities.map(c => ({ ...c, destroyed: false })),
      batteries: initialBatteries.map(b => ({ ...b, destroyed: false, ammo: b.maxAmmo })),
    }));
  };

  const toggleLanguage = () => {
    setGameState(prev => ({
      ...prev,
      language: prev.language === 'en' ? 'zh' : 'en'
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30">
      {/* Header / HUD */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              {t.title}
            </h1>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Orbital Defense System v2.5
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Level</span>
            <span className="text-xl font-mono font-bold text-blue-400">
              {gameState.level}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{t.score}</span>
            <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              {gameState.score.toString().padStart(5, '0')}
            </span>
          </div>
          
          <button 
            onClick={toggleLanguage}
            className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
          >
            <Globe className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative w-full h-screen flex items-center justify-center pt-16">
        <GameCanvas gameState={gameState} setGameState={setGameState} />

        {/* Overlays */}
        <AnimatePresence>
          {gameState.status !== GameStatus.PLAYING && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md w-full bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
              >
                {gameState.status === GameStatus.START && (
                  <>
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Target className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{t.title}</h2>
                    <p className="text-white/60 mb-8 leading-relaxed">
                      {t.instructions}
                    </p>
                    <button 
                      onClick={startGame}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      {t.start}
                    </button>
                  </>
                )}

                {gameState.status === GameStatus.WON && (
                  <>
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="w-10 h-10 text-yellow-500" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2 text-yellow-500">{t.win}</h2>
                    <p className="text-white/60 mb-8">
                      {t.winMsg}
                    </p>
                    <div className="bg-white/5 rounded-2xl p-4 mb-8">
                      <div className="text-sm text-white/40 uppercase tracking-widest mb-1">{t.score}</div>
                      <div className="text-4xl font-mono font-bold text-emerald-400">{gameState.score}</div>
                    </div>
                    <button 
                      onClick={startGame}
                      className="w-full py-4 bg-white text-black font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      {t.restart}
                    </button>
                  </>
                )}

                {gameState.status === GameStatus.LOST && (
                  <>
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2 text-red-500">{t.loss}</h2>
                    <p className="text-white/60 mb-8">
                      {t.lossMsg}
                    </p>
                    <button 
                      onClick={startGame}
                      className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      {t.restart}
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile HUD */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none">
          <div className="flex gap-2">
            {gameState.batteries.map(b => (
              <div key={b.id} className={`px-3 py-1 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2 ${b.destroyed ? 'opacity-30' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${b.ammo > 10 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[10px] font-mono font-bold">{b.ammo}</span>
              </div>
            ))}
          </div>
          <div className="px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Goal: {WIN_SCORE}</span>
          </div>
        </div>
      </main>

      {/* Background Grid Effect */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
    </div>
  );
}
