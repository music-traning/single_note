import React from 'react';
import { motion } from 'framer-motion';
import { STRATEGIST_DATA } from '../data/strategists';
import type { StrategistId } from '../data/strategists';
import type { StrategistState } from '../hooks/useGameState';

type StrategistSelectProps = {
  strategists: Record<StrategistId, StrategistState>;
  activeStrategist: StrategistId;
  onSelect: (id: StrategistId) => void;
  onClose: () => void;
};

export const StrategistSelect: React.FC<StrategistSelectProps> = ({
  strategists,
  activeStrategist,
  onSelect,
  onClose
}) => {
  const [selectedDetails, setSelectedDetails] = React.useState<StrategistId | null>(activeStrategist);

  // Filter out dummy/enemy if we only want 30 true strategists. 
  // For now, let's keep all except 'dummy' and 'yellow_turban'.
  const rosterKeys = Object.keys(STRATEGIST_DATA).filter(k => k !== 'dummy' && k !== 'yellow_turban' && k !== 'zhang_fei' && k !== 'lu_bu') as StrategistId[];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="w-full h-full max-w-6xl mx-auto flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl relative z-20"
      style={{ height: '80vh' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="text-2xl font-black text-amber-500">軍議所 (軍師編成)</h2>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 font-bold transition-colors"
        >
          陣幕へ戻る
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Grid */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-950">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {rosterKeys.map(id => {
              const data = STRATEGIST_DATA[id];
              const state = strategists[id];
              const isUnlocked = state?.isUnlocked;
              const isActive = activeStrategist === id;
              const isViewing = selectedDetails === id;

              if (!isUnlocked) {
                return (
                  <div 
                    key={id}
                    className="aspect-square bg-slate-900 border border-slate-800 rounded-lg flex flex-col items-center justify-center opacity-60 cursor-not-allowed relative"
                  >
                    <span className="text-4xl filter grayscale brightness-50 opacity-20">👤</span>
                    <span className="text-xs text-slate-600 font-bold mt-2">未登用</span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/80 rounded-lg p-2">
                      <span className="text-[10px] text-amber-500/80 text-center font-bold">解放条件:<br/>{data.unlockHint}</span>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={id}
                  onClick={() => setSelectedDetails(id)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all relative ${
                    isViewing ? 'bg-indigo-900/60 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-4xl mb-1 filter drop-shadow-md">👤</span>
                  <span className="text-sm font-bold text-slate-200">{data.name}</span>
                  {isActive && (
                    <div className="absolute top-1 right-1">
                      <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full shadow">同行中</span>
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1">
                     <span className="text-[10px] font-black text-amber-400 bg-amber-900/50 px-1 py-0.5 rounded border border-amber-700/50">Lv.{state.level}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Details Panel */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 flex flex-col overflow-y-auto">
          {selectedDetails && strategists[selectedDetails]?.isUnlocked ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-3xl font-black text-slate-200">{STRATEGIST_DATA[selectedDetails].name}</h3>
                <span className="text-sm font-black text-amber-400 bg-amber-900/50 px-2 py-1 rounded border border-amber-700/50">
                  Lv.{strategists[selectedDetails].level}
                </span>
              </div>
              
              <p className="text-sm text-slate-400 mb-6 italic border-l-2 border-slate-600 pl-3">
                {STRATEGIST_DATA[selectedDetails].desc}
              </p>

              <div className="mb-6 space-y-4">
                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                  <div className="text-xs text-slate-500 font-bold mb-1">基礎知力</div>
                  <div className="text-xl text-indigo-400 font-black">{STRATEGIST_DATA[selectedDetails].baseInt}</div>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                  <div className="text-xs text-slate-500 font-bold mb-1">固有スキル</div>
                  <div className="text-sm text-emerald-400 font-bold">{STRATEGIST_DATA[selectedDetails].skillDesc}</div>
                </div>

                {STRATEGIST_DATA[selectedDetails].synergyStageId && (
                  <div className="bg-amber-900/20 p-3 rounded border border-amber-900/50">
                    <div className="text-xs text-amber-600 font-bold mb-1">歴史的シナジー</div>
                    <div className="text-sm text-amber-400 font-bold">特定のステージで被ダメージ半減などの特殊効果</div>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-700">
                <button
                  onClick={() => onSelect(selectedDetails)}
                  disabled={activeStrategist === selectedDetails}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                  {activeStrategist === selectedDetails ? '同行中' : 'この軍師を同行させる'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              軍師を選択してください
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
