import type { StrategistId, StageId } from '../data/strategists';

import type { NoteDef } from '../types/rhythm';

export const STAGE_DATA: Array<{ 
  id: StageId; enemyName: string; unlockId: StrategistId; maxHp: number; desc: string; expReward: number;
  bpm: number; damageMultiplier: number; pattern: NoteDef[]; aiPrompt?: string;
  chapter: string; targetOffsetMs: number;
  extraUnlockIds?: StrategistId[];
  extraUnlockCondition?: (finalHp: number) => StrategistId[];
}> = [
  // ==========================================
  // 第1章：黄巾の乱（184年） - 【基礎】4分音符のみ
  // ==========================================
  { 
    id: 'stage_1_1', enemyName: '程遠志', unlockId: 'dummy', maxHp: 300, desc: '【初級】基礎の4分音符。手始めの相手', expReward: 50,
    bpm: 80, damageMultiplier: 0.5, 
    pattern: [{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第1章: 黄巾の乱', targetOffsetMs: 0
  },
  { 
    id: 'stage_1_2', enemyName: '張宝', unlockId: 'yellow_turban', maxHp: 500, desc: '【初級】少しテンポアップ', expReward: 100,
    bpm: 90, damageMultiplier: 0.8, 
    pattern: [{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第1章: 黄巾の乱', targetOffsetMs: 0
  },
  { 
    id: 'stage_1_3', enemyName: '張角', unlockId: 'jian_yong', maxHp: 800, desc: '【中級】黄巾賊の首領。BPM100の壁', expReward: 200,
    bpm: 100, damageMultiplier: 1.0, 
    pattern: [{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第1章: 黄巾の乱', targetOffsetMs: 0
  },

  // ==========================================
  // 第2章：反董卓連合（190年） - 【8分音符】表と裏の理解
  // ==========================================
  { 
    id: 'stage_2_1', enemyName: '華雄', unlockId: 'sun_qian', maxHp: 1000, desc: '【中級】8分音符の導入。表裏を感じろ', expReward: 250,
    bpm: 90, damageMultiplier: 1.2, 
    pattern: [{type:'note',duration:8},{type:'note',duration:8},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第2章: 反董卓連合', targetOffsetMs: 0
  },
  { 
    id: 'stage_2_2', enemyName: '呂布', unlockId: 'lu_bu', maxHp: 1500, desc: '【上級】人中の呂布。連続する8分音符', expReward: 400,
    bpm: 100, damageMultiplier: 1.5, 
    pattern: [{type:'note',duration:8},{type:'note',duration:8},{type:'note',duration:8},{type:'note',duration:8},{type:'note',duration:4}],
    chapter: '第2章: 反董卓連合', targetOffsetMs: 0
  },
  { 
    id: 'stage_2_3', enemyName: '董卓', unlockId: 'li_ru', maxHp: 2000, desc: '【上級】暴虐の魔王。4分と8分の混合', expReward: 500,
    bpm: 110, damageMultiplier: 1.5, 
    pattern: [{type:'note',duration:4},{type:'note',duration:8},{type:'note',duration:8},{type:'note',duration:4}],
    chapter: '第2章: 反董卓連合', targetOffsetMs: 0,
    extraUnlockIds: ['fa_zheng']
  },

  // ==========================================
  // 第3章：官渡の戦い（200年） - 【テンポ変化】極端なBPM変動
  // ==========================================
  { 
    id: 'stage_3_1', enemyName: '顔良', unlockId: 'mi_zhu', maxHp: 1800, desc: '【中級】重く遅い一撃。極端なスローペース', expReward: 400,
    bpm: 60, damageMultiplier: 2.0, 
    pattern: [{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第3章: 官渡の戦い', targetOffsetMs: 0
  },
  { 
    id: 'stage_3_2', enemyName: '文醜', unlockId: 'tian_feng', maxHp: 1800, desc: '【上級】怒涛の猛攻。高速BPMへの対応', expReward: 500,
    bpm: 140, damageMultiplier: 1.0, 
    pattern: [{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第3章: 官渡の戦い', targetOffsetMs: 0
  },
  { 
    id: 'stage_3_3', enemyName: '袁紹', unlockId: 'ju_shou', maxHp: 2500, desc: '【超兵】河北の覇者。BPM100での変則リズム', expReward: 700,
    bpm: 100, damageMultiplier: 1.5, 
    pattern: [{type:'note',duration:8},{type:'note',duration:4},{type:'note',duration:8},{type:'note',duration:4}],
    chapter: '第3章: 官渡の戦い', targetOffsetMs: 0
  },

  // ==========================================
  // 第4章：赤壁の戦い（208年） - 【シンコペーション】
  // ==========================================
  { 
    id: 'stage_4_1', enemyName: '曹仁', unlockId: 'lu_su', maxHp: 2200, desc: '【上級】鉄壁の守り。裏拍から入るリズム', expReward: 600,
    bpm: 90, damageMultiplier: 1.2, 
    pattern: [{type:'rest',duration:8},{type:'note',duration:8},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第4章: 赤壁の戦い', targetOffsetMs: 0
  },
  { 
    id: 'stage_4_2', enemyName: '張遼', unlockId: 'cheng_yu', maxHp: 2800, desc: '【超兵】遼来々。食ってかかるシンコペーション', expReward: 800,
    bpm: 100, damageMultiplier: 1.8, 
    pattern: [{type:'note',duration:4},{type:'rest',duration:8},{type:'note',duration:8},{type:'note',duration:4}],
    chapter: '第4章: 赤壁の戦い', targetOffsetMs: 0
  },
  { 
    id: 'stage_4_3', enemyName: '曹操', unlockId: 'zhou_yu', maxHp: 4000, desc: '【極級】乱世の奸雄。30msのディレイ攻撃', expReward: 1200,
    bpm: 110, damageMultiplier: 2.0, 
    pattern: [{type:'note',duration:8},{type:'note',duration:8},{type:'rest',duration:8},{type:'note',duration:8},{type:'note',duration:4}],
    chapter: '第4章: 赤壁の戦い', targetOffsetMs: 30,
    extraUnlockIds: ['zhou_yu', 'lu_xun']
  },

  // ==========================================
  // 第5章：漢中攻防戦（219年） - 【休符】無音の計
  // ==========================================
  { 
    id: 'stage_5_1', enemyName: '張郃', unlockId: 'liu_ye', maxHp: 3000, desc: '【上級】巧みな用兵。休符による間の支配', expReward: 800,
    bpm: 80, damageMultiplier: 1.5, 
    pattern: [{type:'note',duration:4},{type:'rest',duration:4},{type:'note',duration:4},{type:'rest',duration:4}],
    chapter: '第5章: 漢中攻防戦', targetOffsetMs: 0
  },
  { 
    id: 'stage_5_2', enemyName: '夏侯淵', unlockId: 'fa_zheng', maxHp: 3500, desc: '【極級】神速の将。高速休符でリズムを崩せ', expReward: 1000,
    bpm: 100, damageMultiplier: 1.5, 
    pattern: [{type:'note',duration:8},{type:'rest',duration:8},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第5章: 漢中攻防戦', targetOffsetMs: 0
  },
  { 
    id: 'stage_5_3', enemyName: '曹操 (漢中)', unlockId: 'xun_you', maxHp: 5000, desc: '【極級】鶏肋。変則的な休符と強攻撃の波', expReward: 1500,
    bpm: 120, damageMultiplier: 2.2, 
    pattern: [{type:'rest',duration:4},{type:'note',duration:8},{type:'note',duration:8},{type:'note',duration:4}],
    chapter: '第5章: 漢中攻防戦', targetOffsetMs: 20
  },

  // ==========================================
  // 第6章：夷陵の戦い（222年） - 【16分音符】細かな刻み
  // ==========================================
  { 
    id: 'stage_6_1', enemyName: '孫桓', unlockId: 'lu_meng', maxHp: 4000, desc: '【極級】16分音符の導入。指先の限界へ', expReward: 1200,
    bpm: 90, damageMultiplier: 1.2, 
    pattern: [{type:'note',duration:16},{type:'note',duration:16},{type:'note',duration:8},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第6章: 夷陵の戦い', targetOffsetMs: 0
  },
  { 
    id: 'stage_6_2', enemyName: '潘璋', unlockId: 'zhang_zhao', maxHp: 4500, desc: '【極級】罠を張る将。連続する16分音符', expReward: 1400,
    bpm: 100, damageMultiplier: 1.5, 
    pattern: [{type:'note',duration:4},{type:'note',duration:16},{type:'note',duration:16},{type:'note',duration:16},{type:'note',duration:16}],
    chapter: '第6章: 夷陵の戦い', targetOffsetMs: 0
  },
  { 
    id: 'stage_6_3', enemyName: '陸遜', unlockId: 'lu_xun', maxHp: 6000, desc: '【修羅】白面書生の火攻め。16分と休符の複合', expReward: 2000,
    bpm: 110, damageMultiplier: 2.5, 
    pattern: [{type:'note',duration:16},{type:'rest',duration:16},{type:'note',duration:8},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第6章: 夷陵の戦い', targetOffsetMs: 20
  },

  // ==========================================
  // 第7章：諸葛亮の北伐（227年〜） - 【低BPM】インナークロック
  // ==========================================
  { 
    id: 'stage_7_1', enemyName: '王双', unlockId: 'pang_tong', maxHp: 5000, desc: '【極級】異民族の猛将。BPM60の重圧', expReward: 1500,
    bpm: 60, damageMultiplier: 3.0, 
    pattern: [{type:'note',duration:4},{type:'note',duration:4},{type:'rest',duration:4},{type:'note',duration:4}],
    chapter: '第7章: 諸葛亮の北伐', targetOffsetMs: 0
  },
  { 
    id: 'stage_7_2', enemyName: '郭淮', unlockId: 'jiang_wei', maxHp: 5500, desc: '【修羅】対蜀防衛線の要。BPM50の極低速', expReward: 1800,
    bpm: 50, damageMultiplier: 2.5, 
    pattern: [{type:'note',duration:4},{type:'rest',duration:8},{type:'note',duration:8},{type:'note',duration:4}],
    chapter: '第7章: 諸葛亮の北伐', targetOffsetMs: 0
  },
  { 
    id: 'stage_7_3', enemyName: '司馬懿 (長安)', unlockId: 'ma_liang', maxHp: 7000, desc: '【修羅】堅守専破。BPM40の狂気、焦りは死を招く', expReward: 2500,
    bpm: 40, damageMultiplier: 4.0, 
    pattern: [{type:'note',duration:4},{type:'note',duration:8},{type:'rest',duration:8},{type:'note',duration:4}],
    chapter: '第7章: 諸葛亮の北伐', targetOffsetMs: 0
  },

  // ==========================================
  // 第8章：秋風五丈原 - 【総決算】
  // ==========================================
  { 
    id: 'stage_8_1', enemyName: '鄧艾', unlockId: 'man_chong', maxHp: 6500, desc: '【修羅】山越えの奇襲。変則16分音符', expReward: 2000,
    bpm: 90, damageMultiplier: 2.0, 
    pattern: [{type:'rest',duration:16},{type:'note',duration:16},{type:'note',duration:8},{type:'note',duration:4},{type:'note',duration:4}],
    chapter: '第8章: 秋風五丈原', targetOffsetMs: 10
  },
  { 
    id: 'stage_8_2', enemyName: '鍾会', unlockId: 'zhong_hui', maxHp: 7000, desc: '【修羅】野心の俊才。高速BPMと休符の乱舞', expReward: 2500,
    bpm: 120, damageMultiplier: 2.2, 
    pattern: [{type:'note',duration:8},{type:'rest',duration:8},{type:'note',duration:16},{type:'note',duration:16},{type:'note',duration:8},{type:'note',duration:4}],
    chapter: '第8章: 秋風五丈原', targetOffsetMs: 0
  },
  { 
    id: 'stage_8_3', enemyName: '司馬懿 (五丈原)', unlockId: 'sima_yi', maxHp: 9999, desc: '【神話】死せる孔明生ける仲達を走らす。完全なる譜面', expReward: 5000,
    bpm: 130, damageMultiplier: 3.0, 
    pattern: [{type:'note',duration:8},{type:'note',duration:16},{type:'rest',duration:16},{type:'note',duration:8},{type:'note',duration:4}],
    chapter: '第8章: 秋風五丈原', targetOffsetMs: 50,
    extraUnlockIds: ['guo_jia', 'xun_yu'],
    extraUnlockCondition: (finalHp: number) => finalHp === 100 ? ['zhuge_liang', 'zuo_ci'] : []
  }
];
