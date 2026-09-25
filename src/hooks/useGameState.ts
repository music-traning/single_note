import { useState, useEffect, useCallback, useMemo } from 'react';

import type { StrategistId, StageId } from '../data/strategists';
import { STRATEGIST_DATA } from '../data/strategists';

export type { StrategistId, StageId };
export { STRATEGIST_DATA };

import { STAGE_DATA } from '../constants/stages';
import type { NoteDef } from '../types/rhythm';
export type { NoteDef };
export { STAGE_DATA };

export function patternToString(pattern: NoteDef[]) {
  return pattern.map(n => {
    if (n.type === 'rest') return 'ウン';
    if (n.duration === 4) return 'タン';
    if (n.duration === 8) return 'タ';
    if (n.duration === 16) return 'チ';
    return 'タン';
  }).join(' ・ ');
}

export function patternToPromptString(pattern: NoteDef[]) {
  return pattern.map(n => {
    if (n.type === 'rest') return '休符';
    if (n.duration === 4) return '四分音符';
    if (n.duration === 8) return '八分音符';
    if (n.duration === 16) return '十六分音符';
    return '音符';
  }).join('、');
}

export function getDisclosedInfo(pattern: NoteDef[], enemyName: string, intel: number) {
  if (intel < 50) {
    const noteCount = pattern.filter(n => n.type === 'note').length;
    const restCount = pattern.filter(n => n.type === 'rest').length;
    if (restCount > noteCount) return "休符が多く不規則なリズム";
    return "四分音符が多い単調なリズム";
  } else if (intel < 90) {
    return `陣形【 ${patternToString(pattern)} 】`;
  } else {
    let stratagem = "特になし";
    if (enemyName === '張飛' || enemyName === '呂布') stratagem = "「暗闇の計」や「無音の計」を多用する";
    return `陣形【 ${patternToString(pattern)} 】 / 敵計略: ${stratagem}`;
  }
}

export type DifficultyMode = 'beginner' | 'normal' | 'hard' | 'pro';
export const DIFFICULTY_MODIFIERS: Record<DifficultyMode, number> = {
  beginner: 40,
  normal: 25,
  hard: 15,
  pro: 0
};
export const BASE_TOLERANCE = 10;



export const TITLES = [
  { minVictories: 0, title: '兵卒' },
  { minVictories: 1, title: '伍長' },
  { minVictories: 3, title: '什長' },
  { minVictories: 6, title: '伯長' },
  { minVictories: 10, title: '曲長' },
  { minVictories: 15, title: '部隊将' },
  { minVictories: 20, title: '偏将軍' },
  { minVictories: 30, title: '大将軍' }
];

export type StrategistState = {
  isUnlocked: boolean;
  level: number;
  exp: number;
};

const INITIAL_STRATEGISTS: Record<StrategistId, StrategistState> = Object.keys(STRATEGIST_DATA).reduce((acc, key) => {
  acc[key] = { isUnlocked: key === 'jian_yong', level: 1, exp: 0 };
  return acc;
}, {} as Record<StrategistId, StrategistState>);

export function getPlayerTitle(victories: number) {
  let t = TITLES[0].title;
  let nextVic = TITLES[1].minVictories;
  for (let i = 0; i < TITLES.length; i++) {
    if (victories >= TITLES[i].minVictories) {
      t = TITLES[i].title;
      nextVic = TITLES[i+1] ? TITLES[i+1].minVictories : Infinity;
    }
  }
  return { title: t, nextVic };
}

export function useGameState() {
  const [totalVictories, setTotalVictories] = useState(0);
  const [clearedStages, setClearedStages] = useState<StageId[]>([]);
  const [strategists, setStrategists] = useState<Record<StrategistId, StrategistState>>(INITIAL_STRATEGISTS);
  const [activeStrategist, setActiveStrategist] = useState<StrategistId>('jian_yong');
  const [selectedStage, setSelectedStage] = useState<StageId>('stage_1_1');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('normal');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedVic = localStorage.getItem('sn_vic_v3');
    const savedCleared = localStorage.getItem('sn_cleared_v3');
    const savedStrats = localStorage.getItem('sn_strats_v3');
    const savedActive = localStorage.getItem('sn_active_v3');
    const savedSelectedStage = localStorage.getItem('sn_selectedStage_v3');
    const savedDifficulty = localStorage.getItem('sn_difficulty_v3');

    if (savedVic) setTotalVictories(parseInt(savedVic, 10));
    if (savedCleared) try { setClearedStages(JSON.parse(savedCleared)); } catch(e) {}
    if (savedStrats) {
      try {
        const parsed = JSON.parse(savedStrats);
        const merged = { ...INITIAL_STRATEGISTS };
        for (const k in parsed) {
          if (merged[k]) {
            merged[k] = { ...merged[k], ...parsed[k] };
          }
        }
        setStrategists(merged);
      } catch(e) {}
    }
    if (savedActive) setActiveStrategist(savedActive as StrategistId);
    if (savedSelectedStage) setSelectedStage(savedSelectedStage as StageId);
    if (savedDifficulty) setDifficulty(savedDifficulty as DifficultyMode);
    setIsLoaded(true);
  }, []);

  const selectStrategist = useCallback((id: StrategistId) => {
    if (strategists[id].isUnlocked) {
      setActiveStrategist(id);
      localStorage.setItem('sn_active_v3', id);
    }
  }, [strategists]);

  const changeDifficulty = useCallback((mode: DifficultyMode) => {
    setDifficulty(mode);
    localStorage.setItem('sn_difficulty_v3', mode);
  }, []);

  const selectTargetStage = useCallback((id: StageId) => {
    setSelectedStage(id);
    localStorage.setItem('sn_selectedStage_v3', id);
  }, []);

  const clearStage = useCallback((stageId: StageId) => {
    const stage = STAGE_DATA.find(s => s.id === stageId)!;
    
    // Add victory
    const nextVic = totalVictories + 1;
    setTotalVictories(nextVic);
    localStorage.setItem('sn_vic_v3', nextVic.toString());

    // Update strategist exp and level
    const nextStrats = { ...strategists };
    const active = nextStrats[activeStrategist];
    active.exp += stage.expReward;
    active.level = Math.floor(active.exp / 100) + 1;
    
    let unlockedId: StrategistId | null = null;
    // Unlock defeated boss
    if (stage.unlockId && !nextStrats[stage.unlockId].isUnlocked) {
      nextStrats[stage.unlockId].isUnlocked = true;
      unlockedId = stage.unlockId;
    }

    setStrategists(nextStrats);
    localStorage.setItem('sn_strats_v3', JSON.stringify(nextStrats));

    // Mark stage cleared
    if (!clearedStages.includes(stageId)) {
      const nextCleared = [...clearedStages, stageId];
      setClearedStages(nextCleared);
      localStorage.setItem('sn_cleared_v3', JSON.stringify(nextCleared));

      // Auto-select next stage if available
      const currentIndex = STAGE_DATA.findIndex(s => s.id === stageId);
      if (currentIndex !== -1 && currentIndex + 1 < STAGE_DATA.length) {
        const nextStageId = STAGE_DATA[currentIndex + 1].id;
        setSelectedStage(nextStageId);
        localStorage.setItem('sn_selectedStage_v3', nextStageId);
      }
    }
    
    return { unlockedId };
  }, [totalVictories, strategists, activeStrategist, clearedStages]);

  const unlockStrategist = useCallback((id: StrategistId): boolean => {
    if (!strategists[id]) return false;
    if (strategists[id].isUnlocked) return false;

    const nextStrats = { ...strategists };
    nextStrats[id].isUnlocked = true;
    setStrategists(nextStrats);
    localStorage.setItem('sn_strats_v3', JSON.stringify(nextStrats));
    return true;
  }, [strategists]);

  const loadState = useCallback((saveData: any) => {
    setTotalVictories(saveData.totalVictories);
    setClearedStages(saveData.clearedStages);
    setStrategists(saveData.strategists);
    setActiveStrategist(saveData.activeStrategist);
    setSelectedStage(saveData.selectedStage);
    setDifficulty(saveData.difficulty);

    localStorage.setItem('sn_vic_v3', saveData.totalVictories.toString());
    localStorage.setItem('sn_cleared_v3', JSON.stringify(saveData.clearedStages));
    localStorage.setItem('sn_strats_v3', JSON.stringify(saveData.strategists));
    localStorage.setItem('sn_active_v3', saveData.activeStrategist);
    localStorage.setItem('sn_selectedStage_v3', saveData.selectedStage);
    localStorage.setItem('sn_difficulty_v3', saveData.difficulty);
  }, []);

  const resetGame = useCallback(() => {
    setTotalVictories(0);
    setClearedStages([]);
    setStrategists(INITIAL_STRATEGISTS);
    setActiveStrategist('jian_yong');
    setSelectedStage('stage_1_1');
    
    localStorage.setItem('sn_vic_v3', '0');
    localStorage.setItem('sn_cleared_v3', JSON.stringify([]));
    localStorage.setItem('sn_strats_v3', JSON.stringify(INITIAL_STRATEGISTS));
    localStorage.setItem('sn_active_v3', 'jian_yong');
    localStorage.setItem('sn_selectedStage_v3', 'stage_1_1');
  }, []);

  const startNewGamePlus = useCallback(() => {
    setClearedStages([]);
    setSelectedStage('stage_1_1');
    
    localStorage.setItem('sn_cleared_v3', JSON.stringify([]));
    localStorage.setItem('sn_selectedStage_v3', 'stage_1_1');
  }, []);

  return useMemo(() => ({
    isLoaded,
    totalVictories,
    clearedStages,
    strategists,
    activeStrategist,
    selectedStage,
    selectStrategist,
    selectTargetStage,
    difficulty,
    changeDifficulty,
    clearStage,
    unlockStrategist,
    loadState,
    resetGame,
    startNewGamePlus,
    playerTitle: getPlayerTitle(totalVictories)
  }), [
    isLoaded, totalVictories, clearedStages, strategists, activeStrategist,
    selectedStage, difficulty, selectStrategist, selectTargetStage,
    changeDifficulty, clearStage, unlockStrategist, loadState,
    resetGame, startNewGamePlus
  ]);
}

