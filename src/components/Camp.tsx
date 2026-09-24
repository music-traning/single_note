import React from 'react';
import { motion } from 'framer-motion';
import { useGameState, STRATEGIST_DATA, STAGE_DATA, patternToString, patternToPromptString, getDisclosedInfo } from '../hooks/useGameState';
import type { StrategistId, StageId, NoteDef } from '../hooks/useGameState';
import { generateRhythmOnomatopoeia } from '../utils/rhythmUtils';
import { StageSelectMap } from './StageSelectMap';

type CampProps = {
  onStartBattle: () => void;
  onStartSimulation?: () => void;
  gameState: ReturnType<typeof useGameState>;
  previewPattern: (pattern: NoteDef[], previewBpm: number) => void;
  requestBriefing: (playerTitle: string, strategistName: string, currentInt: number, persona: string, rhythmOnomatopoeia: string, gimmick: string) => void;
  requestIdleChat: (playerTitle: string, persona: string) => void;
  currentLine: string;
  isLoadingGemini: boolean;
  onOpenStrategistSelect?: () => void;
  onOpenStageSelect?: () => void;
  isMicConnected: boolean;
  onStartListening: () => void;
  isCalibrating: boolean;
  onCalibrate: () => void;
  transientThreshold: number;
  setTransientThreshold: (val: number) => void;
  calibrationOffset: number;
};

export const Camp: React.FC<CampProps> = ({ 
  onStartBattle, onStartSimulation, gameState, previewPattern, requestBriefing, requestIdleChat, currentLine, isLoadingGemini, onOpenStrategistSelect, onOpenStageSelect,
  isMicConnected, onStartListening, isCalibrating, onCalibrate, transientThreshold, setTransientThreshold, calibrationOffset
}) => {
  const { 
    totalVictories, 
    clearedStages,
    strategists, 
    activeStrategist, 
    selectedStage,
    playerTitle, 
    selectStrategist,
    selectTargetStage
  } = gameState;
  
  const targetStageData = STAGE_DATA.find(s => s.id === selectedStage);
  const [isMapOpen, setIsMapOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      const persona = STRATEGIST_DATA[activeStrategist].persona;
      requestIdleChat(playerTitle.title, persona);
    }, 20000); // Every 20 seconds
    return () => clearInterval(timer);
  }, [activeStrategist, playerTitle.title, requestIdleChat]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6"
    >
      {/* Left: Player Status & Army (育成) */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl relative flex flex-col">
        <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-8xl pointer-events-none">進軍</div>
        
        <h2 className="text-xl font-bold text-slate-300 mb-6 border-b border-slate-700 pb-2">自軍ステータス</h2>
        
        <div className="flex items-end space-x-4 mb-4">
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            {playerTitle.title}
          </div>
          <div className="text-slate-400 font-mono mb-1">
            (累計勝利: {totalVictories})
          </div>
        </div>

        <div className="w-full mb-8">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>次の階級まで</span>
            <span>{playerTitle.nextVic === Infinity ? 'MAX' : `${totalVictories} / ${playerTitle.nextVic}`}</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
            {playerTitle.nextVic !== Infinity && (
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${(totalVictories / playerTitle.nextVic) * 100}%` }}
              />
            )}
            {playerTitle.nextVic === Infinity && (
              <div className="h-full w-full bg-gradient-to-r from-yellow-400 to-amber-600" />
            )}
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-400 mb-3">同行軍師</h3>
        <div className="flex-1 flex flex-col space-y-4">
          <div className="p-4 rounded-lg border border-indigo-500 bg-indigo-900/40 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-200 text-xl">{STRATEGIST_DATA[activeStrategist].name}</span>
                <span className="text-sm font-black text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-700/50">Lv.{strategists[activeStrategist].level}</span>
              </div>
              <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">同行中</span>
            </div>
            <div className="text-sm text-slate-400 mb-3">{STRATEGIST_DATA[activeStrategist].desc}</div>
            
            {STRATEGIST_DATA[activeStrategist].skillDesc !== 'なし' && (
              <div className="text-xs text-emerald-400 mb-2 font-bold">【固有】{STRATEGIST_DATA[activeStrategist].skillDesc}</div>
            )}
            
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-indigo-400" style={{ width: `${strategists[activeStrategist].exp % 100}%` }} />
            </div>
          </div>

          <button 
            onClick={onOpenStrategistSelect}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-200 font-bold transition-colors shadow flex items-center justify-center space-x-2"
          >
            <span className="text-lg">👥</span>
            <span>軍議所を開く (軍師の変更・確認)</span>
          </button>
        </div>
        
        {/* Audio Settings Panel */}
        <div className="mt-6 flex-1 flex flex-col justify-end">
          <h3 className="text-sm font-bold text-slate-400 mb-3 border-b border-slate-700 pb-1">音響兵装 (システム設定)</h3>
          
          <div className="flex space-x-2 mb-3">
            <button 
              onClick={!isMicConnected ? onStartListening : undefined}
              className={`flex-1 py-2 rounded text-xs transition-colors font-bold ${isMicConnected ? 'bg-emerald-600 cursor-default text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
            >
              {isMicConnected ? '🟢 マイク接続済み' : '🎤 マイクを接続'}
            </button>
            <button 
              onClick={onCalibrate}
              disabled={isCalibrating}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors"
            >
              {isCalibrating ? "補正中..." : "🔄 レイテンシ補正"}
            </button>
          </div>

          <div className="bg-slate-900/50 p-3 rounded border border-slate-700 space-y-3">
            <div>
              <label className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>入力感度 (Threshold)</span>
                <span className="font-mono text-slate-300">{transientThreshold.toFixed(2)}</span>
              </label>
              <input 
                type="range" 
                min="0.01" 
                max="1.0" 
                step="0.01" 
                value={transientThreshold}
                onChange={(e) => setTransientThreshold(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1"
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>システムレイテンシ (Offset)</span>
              <span className="font-mono text-indigo-400 font-bold">{calibrationOffset.toFixed(2)} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Stage Selection */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl flex flex-col">
        <h2 className="text-xl font-bold text-slate-300 mb-6 border-b border-slate-700 pb-2">討伐目標</h2>
        
        <div className="flex-1 flex flex-col space-y-4">
          {targetStageData ? (
            <div className="p-5 rounded-lg border border-red-500 bg-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.2)] relative overflow-hidden">
              {clearedStages.includes(targetStageData.id) && (
                <div className="absolute top-2 right-2 text-xs font-black text-emerald-500 border border-emerald-500/50 px-2 py-0.5 rounded opacity-80">
                  討伐済
                </div>
              )}
              <div className="text-xs text-amber-500/80 mb-1 font-bold">{targetStageData.chapter}</div>
              <div className="text-2xl font-black mb-2 text-red-400">
                {targetStageData.enemyName}
              </div>
              <div className="text-sm text-slate-300 mb-4">{targetStageData.desc}</div>
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 bg-slate-900/50 p-2 rounded">
                <span>敵将兵力: {targetStageData.maxHp}</span>
                <span>獲得武功: {targetStageData.expReward}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-800 text-slate-500 text-center">
              目標が選択されていません
            </div>
          )}

          <button 
            onClick={() => setIsMapOpen(true)}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-200 font-bold transition-colors shadow flex items-center justify-center space-x-2"
          >
            <span className="text-lg">🗺️</span>
            <span>行軍マップを開く (進軍先の変更)</span>
          </button>
        </div>

        {targetStageData && (
          <div className="mt-4 p-4 border border-indigo-900 bg-indigo-950/30 rounded-lg">
            <h4 className="text-sm font-bold text-indigo-400 mb-2 border-b border-indigo-900/50 pb-1 flex justify-between items-center">
              <span>事前軍議</span>
              {isLoadingGemini && <span className="text-[10px] animate-pulse">策を巡らせ中...</span>}
            </h4>
            
            {(() => {
              const activeStratData = STRATEGIST_DATA[activeStrategist];
              const stratLevel = strategists[activeStrategist]?.level || 1;
              const currentInt = activeStratData.baseInt + (stratLevel * 2);
              const disclosedInfo = getDisclosedInfo(targetStageData.pattern, targetStageData.enemyName, currentInt);

              return (
                <>
                  <div className="mb-3 text-sm text-slate-300 font-bold bg-black/40 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                      <span>{activeStratData.name}の知力による見立て</span>
                      <span className="text-indigo-400">知力: {currentInt}</span>
                    </div>
                    {disclosedInfo}
                  </div>
                  
                  <div className="flex space-x-2 mb-4">
                    <button 
                      onClick={() => onStartSimulation && onStartSimulation()}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 rounded transition-colors"
                    >
                      模擬戦を行う（練習）
                    </button>
                    <button 
                      onClick={() => {
                        const rhythmStr = generateRhythmOnomatopoeia(targetStageData.pattern);
                        let gimmickStr = "特になし";
                        if (targetStageData.enemyName === '張飛' || targetStageData.enemyName === '呂布') {
                          gimmickStr = "「暗闇の計」や「無音の計」による視覚・聴覚妨害";
                        }
                        requestBriefing(
                          gameState.playerTitle.title, 
                          activeStratData.name, 
                          currentInt, 
                          activeStratData.persona, 
                          rhythmStr, 
                          gimmickStr
                        );
                      }}
                      disabled={isLoadingGemini}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700 rounded transition-colors disabled:opacity-50"
                    >
                      軍師に助言を求める
                    </button>
                  </div>
                </>
              );
            })()}

            <div className="min-h-[90px] max-h-[120px] overflow-y-auto text-sm text-slate-200 bg-indigo-900/40 p-3 rounded-lg border-l-4 border-indigo-500 flex flex-col custom-scrollbar">
              <div className="text-xs text-indigo-300 mb-1 font-bold">軍師 {STRATEGIST_DATA[activeStrategist]?.name}</div>
              {isLoadingGemini ? (
                <div className="flex-1 flex items-center text-indigo-400 space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              ) : currentLine && currentLine.startsWith('【軍議】') ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 leading-relaxed"
                >
                  {currentLine.replace('【軍議】', '')}
                </motion.div>
              ) : (
                <div className="flex-1 flex items-center text-indigo-400/50 text-xs italic">
                  出陣前に軍師の助言を求めることができます。
                </div>
              )}
            </div>
          </div>
        )}

        {targetStageData && (
          <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
            <h3 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-800 pb-1">難易度設定</h3>
            <div className="flex justify-between space-x-2">
              {(['beginner', 'normal', 'hard', 'pro'] as const).map(mode => {
                const labels = { beginner: '初級', normal: '中級', hard: '上級', pro: 'プロ' };
                const isSelected = gameState.difficulty === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => gameState.changeDifficulty(mode)}
                    className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-inner' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {labels[mode]}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {targetStageData && (
          <button 
            onClick={onStartBattle}
            className="w-full mt-6 py-4 bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-black text-xl rounded-lg shadow-lg shadow-red-900/50 transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center leading-tight"
          >
            <span>⚔️ 討伐へ向かう</span>
            <span className="text-xs font-normal opacity-80 mt-1">標的: {targetStageData.enemyName}</span>
          </button>
        )}
      </div>

      {/* Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <StageSelectMap 
            clearedStages={clearedStages}
            onSelectStage={(id) => {
              selectTargetStage(id);
              setIsMapOpen(false);
            }}
            onClose={() => setIsMapOpen(false)}
          />
        </div>
      )}
    </motion.div>
  );
};
