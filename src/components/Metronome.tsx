import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameMode, Debuff } from '../hooks/useAudioEngine';


type MetronomeProps = {
  isPlaying: boolean;
  isMicConnected: boolean;
  isCalibrating: boolean;
  calibrationOffset: number;
  lastHit: { rawDiffMs: number; diffMs: number; isHit: boolean; time: number } | null;
  transientThreshold: number;
  setTransientThreshold: (val: number) => void;
  combo: number;
  hp: number;
  isFrozen: boolean;
  isSynergyActive: boolean;
  showGodlikeCutin: boolean;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  enemyMaxHp: number;
  enemyHp: number;
  enemyName: string;
  activeDebuff: Debuff;
  showParryCutin: boolean;
  countdown: number;
  onStart: () => void;
  onStop: () => void;
  onStartListening: () => void;
  onCalibrate: () => void;
  onResetCalibration: () => void;
  onSetManualCalibration: (offset: number) => void;
};

export const Metronome: React.FC<MetronomeProps> = ({
  isPlaying,
  isMicConnected,
  isCalibrating,
  calibrationOffset,
  lastHit,
  transientThreshold,
  setTransientThreshold,
  combo,
  hp,
  isFrozen,
  isSynergyActive,
  showGodlikeCutin,
  gameMode,
  setGameMode,
  enemyMaxHp,
  enemyHp,
  enemyName,
  activeDebuff,
  showParryCutin,
  countdown,
  onStart,
  onStop,
  onStartListening,
  onCalibrate,
  onResetCalibration,
  onSetManualCalibration
}) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying && !isCalibrating && (e.key === 'c' || e.key === 'C')) {
        onCalibrate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isCalibrating, onCalibrate]);

  const [shake, setShake] = React.useState(false);
  const [hitstop, setHitstop] = React.useState(false);

  useEffect(() => {
    if (lastHit && !isCalibrating) {
      if (!lastHit.isHit && gameMode !== 'simulation') {
        setShake(true);
        const timer = setTimeout(() => setShake(false), 300);
        return () => clearTimeout(timer);
      } else if (lastHit.isHit && Math.abs(lastHit.diffMs) <= 10) {
        setHitstop(true);
        const timer = setTimeout(() => setHitstop(false), 200);
        return () => clearTimeout(timer);
      }
    }
  }, [lastHit, isCalibrating, gameMode]);

  const isNeonMode = combo > 10;
  
  const neonClasses = isNeonMode 
    ? 'border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.6)] bg-slate-900' 
    : 'border-slate-700 shadow-2xl bg-slate-800';

  const isBlind = activeDebuff === 'blind';

  const renderHitResult = () => {
    if (isCalibrating) {
      return (
        <div className="flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-indigo-400 animate-pulse tracking-widest">計測中...</span>
          <span className="text-xs text-indigo-500/80 mt-2">クリック音に合わせて打鍵してください</span>
          <span className="text-[10px] text-amber-500 mt-1">※反応しない場合は「入力感度(Threshold)」を下げてください</span>
        </div>
      );
    }
    
    if (isBlind) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
          {/* Static noise effect */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6IiBmaWxsPSJub25lIi8+PC9zdmc+')] opacity-50 animate-pulse"></div>
          <span className="text-4xl font-black text-slate-800 tracking-widest z-10 drop-shadow-[0_0_10px_rgba(0,0,0,1)]">
            【 暗 闇 の 計 】
          </span>
        </div>
      );
    }

    if (countdown > 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <motion.span 
            key={`countdown-${countdown}`}
            initial={{ scale: 1.2, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
          >
            {countdown}
          </motion.span>
        </div>
      );
    }

    if (!lastHit) return <span className="text-gray-500">Waiting for input...</span>;
    
    const absDiff = Math.abs(lastHit.diffMs);
    let colorClass = "text-red-500"; 
    
    if (absDiff <= 10) colorClass = "text-yellow-400 font-bold drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]";
    else if (absDiff <= 25) colorClass = "text-green-400";
    else if (absDiff <= 35) colorClass = "text-blue-400";
    else colorClass = "text-slate-300";
    
    if (!lastHit.isHit) colorClass = "text-red-600 blur-[1px]";

    const rawStr = lastHit.rawDiffMs > 0 ? `+${lastHit.rawDiffMs.toFixed(1)}` : lastHit.rawDiffMs.toFixed(1);
    const offsetStr = calibrationOffset > 0 ? `+${calibrationOffset.toFixed(1)}` : calibrationOffset.toFixed(1);

    return (
      <div className="flex flex-col items-center z-10">
        {lastHit.isHit && (
          <div className="text-xs text-slate-500 font-mono mb-1 tracking-wider opacity-80">
            Raw: {rawStr}ms - Offset: {offsetStr}ms
          </div>
        )}
        
        <motion.span 
          key={lastHit.time}
          initial={{ opacity: 0, y: -20, rotateX: 90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className={`text-6xl ${colorClass}`}
        >
          {lastHit.diffMs > 0 ? "+" : ""}{lastHit.diffMs.toFixed(1)} ms
        </motion.span>
        {absDiff <= 10 && lastHit.isHit && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl text-yellow-400 mt-2 tracking-widest font-black drop-shadow-md"
          >
            【 神 算 】
          </motion.span>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {showGodlikeCutin && (
          <motion.div 
            key="godlikeCutin"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm pointer-events-none"
          >
            <motion.h1 
              initial={{ rotate: -5, scale: 2 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.6 }}
              className="text-[15vw] font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_0_50px_rgba(250,204,21,1)] tracking-tighter"
            >
              神算無双
            </motion.h1>
          </motion.div>
        )}

        {showParryCutin && (
          <motion.div
            key="parryCutin"
            initial={{ opacity: 0, scale: 2, rotate: 15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-hidden rounded-xl"
          >
            {/* Glass shatter overlay effect */}
            <div className="absolute inset-0 bg-white/20 backdrop-invert" />
            <h2 className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(59,130,246,1)] tracking-widest whitespace-nowrap">
              【 計 略 打 破 】
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex flex-col items-center p-6 rounded-xl border w-full max-w-md mx-auto transition-all duration-300 ${neonClasses} ${isFrozen ? 'opacity-50 grayscale' : ''} ${shake ? 'animate-shake border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : ''} ${hitstop ? 'animate-hitstop' : ''}`}>
        
        {hitstop && (
          <div className="absolute inset-0 z-50 pointer-events-none animate-flash rounded-xl"></div>
        )}
        
        {/* Mode Toggle (Hidden in simulation) */}
        {gameMode !== 'simulation' && (
          <div className="flex w-full mb-6 bg-slate-900 rounded-lg p-1">
            <button 
              onClick={() => !isPlaying && setGameMode('training')}
              className={`flex-1 py-1 text-xs font-bold rounded ${gameMode === 'training' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              練兵所 (Training)
            </button>
            <button 
              onClick={() => !isPlaying && setGameMode('combat')}
              className={`flex-1 py-1 text-xs font-bold rounded ${gameMode === 'combat' ? 'bg-red-900/50 text-red-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              実戦 (Combat)
            </button>
          </div>
        )}

        {gameMode === 'simulation' && (
          <div className="w-full mb-6 bg-emerald-900/40 border border-emerald-500/50 rounded-lg p-3 text-center">
            <div className="text-emerald-400 font-bold text-lg mb-1">【模擬戦】 {enemyName}</div>
            <div className="text-emerald-500/80 text-xs">※ ダメージは受けません</div>
          </div>
        )}

        {/* Combat Enemy UI */}
        <AnimatePresence>
          {gameMode === 'combat' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full mb-6 overflow-hidden"
            >
              <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-3 relative">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-red-400 font-bold text-lg">{enemyName}</span>
                  <span className="text-red-500/80 font-mono text-xs">{enemyHp} / {enemyMaxHp}</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-800 to-red-500" 
                    animate={{ width: `${(enemyHp / enemyMaxHp) * 100}%` }}
                    transition={{ type: 'spring' }}
                  />
                </div>
                {activeDebuff !== 'none' && (
                  <div className="mt-2 text-center text-xs font-bold text-fuchsia-400 animate-pulse bg-fuchsia-900/30 rounded py-1">
                    ⚠️ 発動中: {activeDebuff === 'mute' ? '無音の計 (Mute)' : '暗闇の計 (Blind)'}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isSynergyActive && (
          <div className="w-full mb-3 text-center text-[10px] font-bold text-yellow-300 bg-yellow-900/30 border border-yellow-700/50 py-1 rounded animate-pulse">
            ✨ 【歴史的シナジー発動】被ダメージ半減 ✨
          </div>
        )}

        {/* HP Bar (Player) */}
        <div className="w-full mb-6">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-emerald-400">統率 (HP)</span>
            <span className="text-emerald-400">{hp} / 100</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500" 
              animate={{ width: `${hp}%` }}
              transition={{ type: 'tween' }}
            />
          </div>
        </div>

        <div className="flex justify-between w-full mb-4 items-center">
          <div className={`text-3xl font-black italic ${isNeonMode ? 'text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse' : 'text-slate-500'}`}>
            {combo} COMBO
          </div>
        </div>


        <div className="flex flex-col space-y-2 mb-4 w-full px-2">
          <div className="flex space-x-4">
            <button 
              onClick={!isMicConnected ? onStartListening : undefined}
              className={`px-4 py-2 rounded text-sm transition-colors ${isMicConnected ? 'bg-emerald-600 cursor-default' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {isMicConnected ? '🟢 マイク接続済み（オン）' : '🎤 マイクを接続（オフ）'}
            </button>
            <button 
              onClick={onCalibrate}
              disabled={isCalibrating || isPlaying}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>{isCalibrating ? "キャリブレーション中..." : "🔄 レイテンシ補正"}</span>
              {!isCalibrating && !isPlaying && <kbd className="hidden sm:inline bg-indigo-900 px-2 py-0.5 rounded text-xs text-indigo-300">C</kbd>}
            </button>
          </div>
          <p className="text-[10px] text-amber-500/80 mt-1 leading-tight text-center">
            ※左(0)に近づくほど敏感になり、環境音を拾いやすくなります。<br/>誤検知する場合は数値を右へ上げてください。
          </p>
        </div>

        <div className="w-full mb-4 px-4">
          <label className="flex justify-between text-xs text-slate-400 mb-2">
            <span>入力感度 (Threshold)</span>
            <span className="font-mono">{transientThreshold.toFixed(2)}</span>
          </label>
          <input 
            type="range" 
            min="0.01" 
            max="1.0" 
            step="0.01" 
            value={transientThreshold}
            onChange={(e) => setTransientThreshold(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div className="text-sm text-slate-400 mb-2 flex justify-between w-full px-4">
          <span>システムレイテンシ (Offset):</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-indigo-400 font-bold">{calibrationOffset.toFixed(1)} ms</span>
            <button
              onClick={onResetCalibration}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-0.5 rounded"
              title="0msにリセット"
            >🔄 リセット</button>
          </div>
        </div>
        <div className="flex items-center gap-1 mb-4 px-4 w-full">
          <button onClick={() => onSetManualCalibration(calibrationOffset - 5)}
            className="text-xs bg-slate-700 hover:bg-indigo-700 text-white px-2 py-1 rounded font-mono">－5</button>
          <button onClick={() => onSetManualCalibration(calibrationOffset - 1)}
            className="text-xs bg-slate-700 hover:bg-indigo-700 text-white px-2 py-1 rounded font-mono">－1</button>
          <input
            type="number"
            value={Math.round(calibrationOffset)}
            onChange={(e) => onSetManualCalibration(Number(e.target.value))}
            className="flex-1 text-center text-xs bg-slate-900 border border-slate-600 text-indigo-300 rounded px-1 py-1 font-mono"
          />
          <button onClick={() => onSetManualCalibration(calibrationOffset + 1)}
            className="text-xs bg-slate-700 hover:bg-indigo-700 text-white px-2 py-1 rounded font-mono">＋1</button>
          <button onClick={() => onSetManualCalibration(calibrationOffset + 5)}
            className="text-xs bg-slate-700 hover:bg-indigo-700 text-white px-2 py-1 rounded font-mono">＋5</button>
        </div>

        <div className="h-32 flex items-center justify-center mb-6 w-full bg-slate-900 rounded-lg inset-shadow relative overflow-hidden">
          {isNeonMode && <div className="absolute inset-0 bg-pink-500/10 animate-pulse pointer-events-none" />}
          {renderHitResult()}
        </div>

        <div className="flex space-x-4">
          {!isPlaying ? (
            <button 
              onClick={onStart}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded font-bold text-lg shadow-lg shadow-emerald-900/50 transition-all"
            >
              ▶ 演習開始
            </button>
          ) : (
            <button 
              onClick={onStop}
              className="px-8 py-3 bg-rose-600 hover:bg-rose-500 rounded font-bold text-lg shadow-lg shadow-rose-900/50 transition-all flex items-center space-x-2"
            >
              <span>■ 演習停止</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
