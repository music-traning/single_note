import { useState, useEffect, useRef } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import type { GameMode } from './hooks/useAudioEngine';
import { useGeminiStrategist } from './hooks/useGeminiStrategist';
import { Metronome } from './components/Metronome';
import { StrategistDialogue } from './components/StrategistDialogue';

import { Camp } from './components/Camp';
import { StrategistSelect } from './components/StrategistSelect';
import { StageSelectMap } from './components/StageSelectMap';
import { useGameState, STRATEGIST_DATA, STAGE_DATA, BASE_TOLERANCE, DIFFICULTY_MODIFIERS } from './hooks/useGameState';
import { useSaveManager } from './hooks/useSaveManager';
import { Modal } from './components/Modal';
import { AnimatePresence, motion } from 'framer-motion';

type AppScreen = 'camp' | 'battle' | 'strategist_select' | 'stage_select';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('camp');
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);
  const gameState = useGameState();
  const saveManager = useSaveManager();
  
  const [audioErrorMsg, setAudioErrorMsg] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNgpConfirm, setShowNgpConfirm] = useState(false);
  const [showCalibrationPrompt, setShowCalibrationPrompt] = useState(false);

  const {
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
    startMetronome,
    stopMetronome,
    resetBattle,
    startListening,
    startCalibration,
    resetCalibration,
    setManualCalibration,
    previewPattern
  } = useAudioEngine(120, setAudioErrorMsg);

  const activeStrategistData = STRATEGIST_DATA[gameState.activeStrategist];
  const activeStrategistName = activeStrategistData?.name || '簡雍';
  const activeStrategistLevel = gameState.strategists[gameState.activeStrategist]?.level || 1;
  const playerTitleName = gameState.playerTitle.title;
  const currentStage = STAGE_DATA.find(s => s.id === gameState.selectedStage);

  const {
    currentLine,
    chatHistory,
    isLoading,
    requestReaction,
    requestBriefing,
    requestIdleChat,
    clearChatHistory
  } = useGeminiStrategist();

  // Event Trigger Refs for exact tracking
  const prevCombo = useRef(combo);
  const prevDebuff = useRef(activeDebuff);
  const prevParry = useRef(showParryCutin);
  const prevHp = useRef(hp);
  const didStart = useRef(false);

  // Victory Logic
  useEffect(() => {
    if (gameMode === 'combat' && enemyHp <= 0 && !showVictory && !showDefeat && isPlaying) {
      setShowVictory(true);
      stopMetronome();
      
      if (currentStage) {
        const result = gameState.clearStage(currentStage.id);
        let unlockedName = result.unlockedNew ? currentStage.enemyName : null;
        
        const processUnlock = (ids: string[]) => {
          for (const id of ids) {
            if (gameState.unlockStrategist(id as any)) {
              unlockedName = STRATEGIST_DATA[id as keyof typeof STRATEGIST_DATA]?.name || id;
            }
          }
        };

        if (currentStage.extraUnlockIds) {
          processUnlock(currentStage.extraUnlockIds);
        }
        if (currentStage.extraUnlockCondition) {
          processUnlock(currentStage.extraUnlockCondition(hp));
        }

        setJustUnlocked(unlockedName);
      }
    }
  }, [enemyHp, gameMode, showVictory, showDefeat, isPlaying, stopMetronome, gameState.clearStage, gameState.unlockStrategist, currentStage]);

  useEffect(() => {
    if (currentScreen === 'battle' && gameMode !== 'training') {
      const tol = BASE_TOLERANCE + DIFFICULTY_MODIFIERS[gameState.difficulty];
      const isSynergy = currentStage?.id === activeStrategistData?.synergyStageId;
      resetBattle(currentStage?.enemyName, currentStage?.maxHp, currentStage?.bpm, currentStage?.damageMultiplier, currentStage?.pattern, tol, currentStage?.targetOffsetMs || 0, gameState.activeStrategist, isSynergy);
    }
  }, [currentScreen, gameMode, currentStage, activeStrategistData, gameState.activeStrategist, gameState.difficulty, resetBattle]);

  // Defeat Logic
  useEffect(() => {
    if (gameMode === 'combat' && hp <= 0 && !showVictory && !showDefeat && isPlaying) {
      setShowDefeat(true);
      stopMetronome();
    }
  }, [hp, gameMode, showVictory, showDefeat, isPlaying, stopMetronome]);

  // Real-time Event-Driven Strategist Dialogue
  useEffect(() => {
    if (gameMode === 'training' || !isPlaying || showVictory || showDefeat) return;

    const aiPromptOverride = currentStage?.aiPrompt;
    const persona = activeStrategistData?.persona || '';

    // 1. Start Event
    if (enemyHp === enemyMaxHp && combo === 0 && !didStart.current) {
      didStart.current = true;
      const isSynergy = currentStage?.id === activeStrategistData?.synergyStageId;
      requestReaction(playerTitleName, activeStrategistName, activeStrategistLevel, persona, isSynergy ? 'synergy_activation' : 'start', combo, enemyHp, aiPromptOverride);
    }
    // 2. Parry Event
    else if (showParryCutin && !prevParry.current) {
      requestReaction(playerTitleName, activeStrategistName, activeStrategistLevel, persona, 'parry', combo, enemyHp, aiPromptOverride);
    } 
    // 3. Disadvantage Event
    else if (activeDebuff !== 'none' && prevDebuff.current === 'none') {
      requestReaction(playerTitleName, activeStrategistName, activeStrategistLevel, persona, 'disadvantage', combo, enemyHp, aiPromptOverride);
    } 
    // 4. Advantage Event (Combo milestones)
    else if ((combo === 10 || combo === 30 || combo === 50) && prevCombo.current !== combo) {
      requestReaction(playerTitleName, activeStrategistName, activeStrategistLevel, persona, 'advantage', combo, enemyHp, aiPromptOverride);
    } 
    // 5. Miss Event (HP reduced from misses)
    else if (hp < prevHp.current) {
      requestReaction(playerTitleName, activeStrategistName, activeStrategistLevel, persona, 'miss', combo, enemyHp, aiPromptOverride);
    }

    prevCombo.current = combo;
    prevDebuff.current = activeDebuff;
    prevParry.current = showParryCutin;
    prevHp.current = hp;
  }, [showParryCutin, activeDebuff, isPlaying, combo, hp, gameMode, showVictory, showDefeat, enemyHp, enemyMaxHp, playerTitleName, activeStrategistName, activeStrategistLevel, activeStrategistData, requestReaction, currentStage?.aiPrompt]);

  const startActualBattle = (mode: GameMode) => {
    clearChatHistory();
    setGameMode(mode);
    const tol = BASE_TOLERANCE + DIFFICULTY_MODIFIERS[gameState.difficulty];
    const isSynergy = currentStage?.id === activeStrategistData?.synergyStageId;
    if (currentStage) {
      resetBattle(currentStage.enemyName, currentStage.maxHp, currentStage.bpm, currentStage.damageMultiplier, currentStage.pattern, tol, currentStage.targetOffsetMs, gameState.activeStrategist, isSynergy);
    } else {
      resetBattle(undefined, undefined, undefined, undefined, undefined, tol, 0, gameState.activeStrategist, false);
    }
    setCurrentScreen('battle');
  };

  const handleReturnToCamp = () => {
    stopMetronome();
    resetBattle();
    setShowVictory(false);
    setShowDefeat(false);
    setJustUnlocked(null);
    didStart.current = false;
    setCurrentScreen('camp');
  };

  if (!gameState.isLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center flex flex-col items-center relative w-full max-w-4xl">
        <div className="absolute right-0 top-0">
          {currentScreen === 'camp' && (
            <button 
              onClick={() => setShowSaveModal(true)}
              className="text-slate-400 hover:text-white text-xs border border-slate-700 px-3 py-1 rounded transition-colors"
            >
              システム (Save/Load)
            </button>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-indigo-500 tracking-tighter drop-shadow-sm mb-2 relative z-10">
          SINGLE NOTE STRATEGIST
        </h1>
        {currentScreen === 'battle' && (
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleReturnToCamp}
              className="text-slate-300 hover:text-white text-lg font-bold underline transition-all hover:scale-105 active:scale-95"
            >
              ← 陣幕に戻る
            </button>
            <p className="text-slate-500 tracking-widest text-sm uppercase">
              Phase 3 - {gameMode === 'training' ? '練兵所' : gameMode === 'simulation' ? '模擬戦（シミュレーション）' : '実戦'}
            </p>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {currentScreen === 'camp' ? (
          <Camp 
            key="camp" 
            gameState={gameState} 
            previewPattern={previewPattern}
            requestBriefing={requestBriefing}
            requestIdleChat={requestIdleChat}
            currentLine={currentLine}
            isLoadingGemini={isLoading}
            isMicConnected={isMicConnected}
            onStartListening={startListening}
            isCalibrating={isCalibrating}
            onCalibrate={startCalibration}
            transientThreshold={transientThreshold}
            setTransientThreshold={setTransientThreshold}
            calibrationOffset={calibrationOffset}
            onResetCalibration={resetCalibration}
            onSetManualCalibration={setManualCalibration}
            onStartBattle={() => {
              if (!localStorage.getItem('sys_calibration')) {
                setShowCalibrationPrompt(true);
              } else {
                startActualBattle('combat');
              }
            }} 
            onStartSimulation={() => {
              if (!localStorage.getItem('sys_calibration')) {
                setShowCalibrationPrompt(true);
              } else {
                startActualBattle('simulation');
              }
            }}
            onOpenStrategistSelect={() => setCurrentScreen('strategist_select')}
          />
        ) : currentScreen === 'strategist_select' ? (
          <StrategistSelect
            key="strategist_select"
            strategists={gameState.strategists}
            activeStrategist={gameState.activeStrategist}
            onSelect={(id) => {
              gameState.selectStrategist(id);
              setCurrentScreen('camp');
            }}
            onClose={() => setCurrentScreen('camp')}
          />
        ) : currentScreen === 'stage_select' ? (
          <StageSelectMap
            key="stage_select"
            clearedStages={gameState.clearedStages}
            onSelectStage={(id) => {
              gameState.selectTargetStage(id);
              setCurrentScreen('camp');
            }}
            onClose={() => setCurrentScreen('camp')}
          />
        ) : (
          <motion.div 
            key="battle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
          >
            <Metronome
              isPlaying={isPlaying}
              isMicConnected={isMicConnected}
              isCalibrating={isCalibrating}
              calibrationOffset={calibrationOffset}
              lastHit={lastHit}
              transientThreshold={transientThreshold}
              setTransientThreshold={setTransientThreshold}
              combo={combo}
              hp={hp}
              isFrozen={isFrozen}
              isSynergyActive={isSynergyActive}
              showGodlikeCutin={showGodlikeCutin}
              gameMode={gameMode}
              setGameMode={setGameMode}
              enemyMaxHp={enemyMaxHp}
              enemyHp={enemyHp}
              enemyName={enemyName}
              activeDebuff={activeDebuff}
              showParryCutin={showParryCutin}
              countdown={countdown}
              onStart={startMetronome}
              onStop={stopMetronome}
              onStartListening={startListening}
              onCalibrate={startCalibration}
              onResetCalibration={resetCalibration}
              onSetManualCalibration={setManualCalibration}
            />
            
            <div className="flex flex-col h-full">
              {gameMode !== 'training' && (
                <StrategistDialogue
                  strategistName={activeStrategistName}
                  strategistLevel={activeStrategistLevel}
                  currentInt={activeStrategistData.baseInt + activeStrategistLevel * 2}
                  chatHistory={chatHistory}
                  isLoading={isLoading}
                />
              )}
            </div>

            {/* Victory Overlay */}
            <AnimatePresence>
              {showVictory && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
                >
                  <motion.h2 
                    initial={{ scale: 0.5, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                    className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-700 drop-shadow-[0_0_20px_rgba(220,38,38,1)] tracking-tighter mb-8"
                  >
                    【 敵将、討ち取ったり 】
                  </motion.h2>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center"
                  >
                    <div className="text-2xl text-yellow-400 font-bold mb-4">武功 +{currentStage?.expReward || 200} 獲得</div>
                    {justUnlocked && (
                      <div className="text-3xl text-emerald-400 font-black mb-8 animate-pulse shadow-emerald-500/50 drop-shadow-md">
                        新たに「{justUnlocked}」を登用しました！
                      </div>
                    )}
                    <button 
                      onClick={handleReturnToCamp}
                      className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-full border border-slate-600 transition-colors"
                    >
                      陣幕へ戻る
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Defeat Overlay */}
            <AnimatePresence>
              {showDefeat && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
                >
                  <motion.h2 
                    initial={{ scale: 0.5, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                    className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-slate-700 drop-shadow-[0_0_20px_rgba(59,130,246,1)] tracking-tighter mb-8"
                  >
                    【 敗 北 】
                  </motion.h2>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center"
                  >
                    <div className="text-xl text-slate-400 font-bold mb-8">統率力を失い、軍は瓦解した...</div>
                    <button 
                      onClick={handleReturnToCamp}
                      className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-full border border-slate-600 transition-colors"
                    >
                      陣幕へ撤退する
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Error Modal */}
      <Modal isOpen={!!audioErrorMsg} onClose={() => setAudioErrorMsg(null)} title="システムエラー">
        <div className="text-center">
          <p className="mb-6">{audioErrorMsg}</p>
          <button onClick={() => setAudioErrorMsg(null)} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold">確認</button>
        </div>
      </Modal>

      {/* Calibration Prompt Modal */}
      <Modal isOpen={showCalibrationPrompt} onClose={() => setShowCalibrationPrompt(false)} title="推奨：レイテンシ補正">
        <div className="text-center">
          <p className="mb-6 text-sm">現在、オーディオのキャリブレーション（遅延補正）が未実施です。<br/>リズムゲームとして正確な判定を行うため、実戦の前に「レイテンシ補正」を行うことを強く推奨します。</p>
          <div className="flex space-x-4 justify-center">
            <button 
              onClick={async () => {
                setShowCalibrationPrompt(false);
                let connected = isMicConnected;
                if (!connected) {
                  connected = await startListening();
                }
                if (connected) {
                  startCalibration();
                }
              }} 
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold"
            >
              補正を行う
            </button>
            <button 
              onClick={() => {
                setShowCalibrationPrompt(false);
                startActualBattle(gameMode === 'simulation' ? 'simulation' : 'combat');
              }} 
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded font-bold"
            >
              無視して出陣する
            </button>
          </div>
        </div>
      </Modal>

      {/* Save / Load Modal */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="システムメニュー">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400">戦歴の記録・復元</h3>
          {saveManager.saveSlots.map((slot, i) => (
            <div key={i} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-200">スロット {i + 1}</div>
                <div className="text-xs text-slate-400">
                  {slot ? `${slot.date} | 突破章数: ${slot.clearedStages.length} | 階級: ${gameState.playerTitle.title}` : 'NO DATA'}
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    saveManager.saveToSlot(i + 1, {
                      name: `スロット${i + 1}`,
                      totalVictories: gameState.totalVictories,
                      clearedStages: gameState.clearedStages,
                      strategists: gameState.strategists,
                      activeStrategist: gameState.activeStrategist,
                      selectedStage: gameState.selectedStage,
                      difficulty: gameState.difficulty
                    });
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded"
                >
                  記録
                </button>
                <button 
                  onClick={() => {
                    if (slot) {
                      gameState.loadState(slot);
                      setShowSaveModal(false);
                    }
                  }}
                  disabled={!slot}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-bold rounded"
                >
                  復元
                </button>
              </div>
            </div>
          ))}
          
          <div className="mt-8 pt-4 border-t border-slate-700 flex flex-col space-y-3">
            <button 
              onClick={() => setShowNgpConfirm(true)}
              className="w-full py-3 bg-blue-900/50 hover:bg-blue-600 border border-blue-700 text-white font-bold rounded transition-colors"
            >
              🌟 強くてニューゲーム (能力を引き継いで最初から)
            </button>
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 bg-red-900/50 hover:bg-red-600 border border-red-700 text-white font-bold rounded transition-colors"
            >
              ⚠️ 現在のデータを初期化 (セーブスロットは維持)
            </button>
          </div>
        </div>
      </Modal>

      {/* New Game Plus Confirm Modal */}
      <Modal isOpen={showNgpConfirm} onClose={() => setShowNgpConfirm(false)} title="強くてニューゲーム">
        <div className="space-y-4">
          <div className="text-sm text-slate-300 font-bold leading-relaxed bg-blue-950/40 p-4 rounded border border-blue-900/50">
            現在の階級（レベル）と解放した軍師を引き継いだまま、<br/>
            第1章から行軍をやり直しますか？
          </div>
          <div className="flex space-x-4 pt-4">
            <button 
              onClick={() => setShowNgpConfirm(false)}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 font-bold text-white rounded transition-colors"
            >
              踏みとどまる
            </button>
            <button 
              onClick={() => {
                gameState.startNewGamePlus();
                setShowNgpConfirm(false);
                setShowSaveModal(false);
              }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded transition-colors"
            >
              やり直す
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirm Modal */}
      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="警告：現在のデータの初期化">
        <div className="space-y-4">
          <div className="text-sm text-slate-300 font-bold leading-relaxed bg-red-950/40 p-4 rounded border border-red-900/50">
            現在プレイ中の行軍記録（クリア状況・階級・解放した軍師）はすべてリセットされます。<br/>
            <span className="text-amber-400 font-black">※スロット1〜5に記録されたセーブデータは消えずに残ります。</span><br/><br/>
            本当に0から歴史をやり直しますか？
          </div>
          <div className="flex space-x-4 pt-4">
            <button 
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 font-bold text-white rounded transition-colors"
            >
              踏みとどまる
            </button>
            <button 
              onClick={() => {
                gameState.resetGame();
                setShowResetConfirm(false);
                setShowSaveModal(false);
              }}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 font-bold text-white rounded transition-colors"
            >
              やり直す
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default App;

