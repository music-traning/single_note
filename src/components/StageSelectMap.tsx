import React from 'react';
import { motion } from 'framer-motion';
import { STAGE_DATA } from '../hooks/useGameState';
import type { StageId } from '../hooks/useGameState';

type StageSelectMapProps = {
  clearedStages: StageId[];
  onSelectStage: (id: StageId) => void;
  onClose: () => void;
};

export const StageSelectMap: React.FC<StageSelectMapProps> = ({
  clearedStages,
  onSelectStage,
  onClose
}) => {
  // Group stages by chapter
  const chapters = STAGE_DATA.reduce((acc, stage) => {
    if (!acc[stage.chapter]) acc[stage.chapter] = [];
    acc[stage.chapter].push(stage);
    return acc;
  }, {} as Record<string, typeof STAGE_DATA>);

  const isStageUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevStage = STAGE_DATA[index - 1];
    return clearedStages.includes(prevStage.id);
  };

  const [expandedChapters, setExpandedChapters] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const firstUnclearedIdx = STAGE_DATA.findIndex(s => !clearedStages.includes(s.id));
    const targetChapter = firstUnclearedIdx >= 0 ? STAGE_DATA[firstUnclearedIdx].chapter : Object.keys(chapters).pop()!;
    Object.keys(chapters).forEach(k => {
      initial[k] = (k === targetChapter);
    });
    return initial;
  });

  const toggleChapter = (chapter: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapter]: !prev[chapter] }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="w-full h-full max-w-6xl mx-auto flex flex-col bg-slate-950 border border-amber-900/50 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-20"
      style={{ height: '80vh' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-amber-900/50 bg-slate-900">
        <h2 className="text-2xl font-black text-amber-500">行軍マップ (ステージ選択)</h2>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold transition-colors border border-slate-700"
        >
          陣幕へ戻る
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSLCAyNTUsIDAuMDUpIi8+PC9zdmc+')]">
        
        <div className="max-w-4xl mx-auto space-y-12">
          {Object.entries(chapters).map(([chapterName, stages], cIdx) => (
            <div key={chapterName} className="relative">
              {cIdx !== 0 && (
                <div className="absolute top-0 left-12 w-1 h-12 -mt-12 bg-amber-900/30" />
              )}
              
              <button 
                onClick={() => toggleChapter(chapterName)}
                className="w-full flex justify-between items-center text-left text-xl font-bold text-amber-600 mb-6 border-b border-amber-900/30 pb-2 hover:text-amber-500 transition-colors"
              >
                <span>{chapterName}</span>
                <span className="text-sm font-normal text-amber-800">
                  {expandedChapters[chapterName] ? '▲' : '▼'}
                </span>
              </button>
              
              {expandedChapters[chapterName] && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                {stages.map((stage, sIdx) => {
                  const globalIndex = STAGE_DATA.findIndex(s => s.id === stage.id);
                  const unlocked = isStageUnlocked(globalIndex);
                  const cleared = clearedStages.includes(stage.id);
                  const isBoss = sIdx === stages.length - 1; // Assuming last stage of chapter is boss

                  return (
                    <div key={stage.id} className="flex items-center group">
                      <div className="w-12 h-12 flex items-center justify-center mr-6 relative">
                        <div className={`absolute inset-0 rounded-full border-2 ${unlocked ? (cleared ? 'border-amber-500 bg-amber-900/40' : 'border-indigo-500 bg-indigo-900/40 animate-pulse') : 'border-slate-800 bg-slate-900'} transition-all duration-500`} />
                        {unlocked ? (
                          cleared ? <span className="text-amber-500 font-bold text-sm">済</span> : <span className="text-indigo-400 font-bold">進</span>
                        ) : (
                          <span className="text-slate-700">🔒</span>
                        )}
                        {/* Connecting line to next stage */}
                        {!(cIdx === Object.keys(chapters).length - 1 && sIdx === stages.length - 1) && (
                          <div className={`absolute top-12 left-1/2 w-1 h-6 -ml-0.5 ${cleared ? 'bg-amber-500/50' : 'bg-slate-800'}`} />
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (unlocked) {
                            onSelectStage(stage.id);
                            onClose();
                          }
                        }}
                        disabled={!unlocked}
                        className={`flex-1 flex items-center justify-between p-4 rounded-xl border transition-all ${
                          unlocked 
                            ? isBoss 
                              ? 'bg-red-950/40 border-red-900/50 hover:bg-red-900/50 shadow-[0_0_15px_rgba(153,27,27,0.3)]' 
                              : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 hover:border-slate-500' 
                            : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <div className="flex items-center space-x-3 mb-1">
                            <span className={`text-lg font-bold ${unlocked ? (isBoss ? 'text-red-400' : 'text-slate-200') : 'text-slate-600'}`}>
                              {stage.enemyName}
                            </span>
                            {isBoss && unlocked && (
                              <span className="text-[10px] bg-red-900 text-red-200 px-2 py-0.5 rounded border border-red-700">BOSS</span>
                            )}
                          </div>
                          <span className="text-sm text-slate-500">{stage.desc}</span>
                        </div>

                        {unlocked && (
                          <div className="text-right">
                            <div className="text-xs text-slate-400 mb-1">要求BPM: {stage.bpm}</div>
                            {stage.targetOffsetMs > 0 && (
                              <div className="text-[10px] text-fuchsia-400 border border-fuchsia-900/50 bg-fuchsia-950/30 px-1 py-0.5 rounded inline-block">
                                タメ（+{stage.targetOffsetMs}ms）
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
