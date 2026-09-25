import { useState, useRef, useCallback, useEffect } from 'react';

export type HitResult = {
  rawDiffMs: number;
  diffMs: number;
  isHit: boolean;
  time: number;
};

import type { NoteDef } from '../types/rhythm';

type Target = {
  time: number;
  hit: boolean;
  offsetMs: number;
};

export type GameMode = 'training' | 'combat' | 'simulation';
export type Debuff = 'none' | 'mute' | 'blind';

export function useAudioEngine(bpm: number = 120, onError?: (msg: string) => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicConnected, setIsMicConnected] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationOffset, setCalibrationOffset] = useState<number>(() => {
    const saved = localStorage.getItem('sys_calibration');
    return saved ? parseFloat(saved) : 0;
  });
  const [lastHit, setLastHit] = useState<HitResult | null>(null);
  const [transientThreshold, setTransientThreshold] = useState<number>(0.1);

  const [toleranceMs, setToleranceMs] = useState<number>(35); // Initial fallback
  const [stageTargetOffsetMs, setStageTargetOffsetMs] = useState<number>(0);
  
  const [combo, setCombo] = useState(0);
  const [hp, setHp] = useState(100);
  const [isFrozen, setIsFrozen] = useState(false);
  const [, setGodlikeCount] = useState(0);
  const [showGodlikeCutin, setShowGodlikeCutin] = useState(false);

  // Phase 3 states
  const [gameMode, setGameMode] = useState<GameMode>('training');
  const [enemyMaxHp, setEnemyMaxHp] = useState(1000);
  const [enemyHp, setEnemyHp] = useState(1000);
  const [enemyName, setEnemyName] = useState("張飛");
  const [currentBpm, setCurrentBpm] = useState(bpm);
  const [damageMultiplier, setDamageMultiplier] = useState(1.0);
  const [activeDebuff, setActiveDebuff] = useState<Debuff>('none');
  const [showParryCutin, setShowParryCutin] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  
  // Phase 7 Synergy & Skills
  const [activeStrategist, setActiveStrategist] = useState<string>('jian_yong');
  const [isSynergyActive, setIsSynergyActive] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIDRef = useRef<number | null>(null);
  const countdownRef = useRef<number>(0);
  const battleStartTimeRef = useRef<number>(0);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  
  const nextClickTimeRef = useRef<number>(0);
  const clickCountRef = useRef<number>(0);
  
  const nextTargetTimeRef = useRef<number>(0);
  const currentPatternRef = useRef<NoteDef[]>([
    { type: 'note', duration: 4 },
    { type: 'note', duration: 8 },
    { type: 'note', duration: 8 },
    { type: 'rest', duration: 8 },
    { type: 'note', duration: 8 },
    { type: 'note', duration: 4 }
  ]);
  const currentPatternIndexRef = useRef<number>(0);
  
  const targetsRef = useRef<Target[]>([]);
  const calibrationSamplesRef = useRef<number[]>([]);
  
  const isFrozenRef = useRef(false);
  const isCalibratingRef = useRef(isCalibrating);
  const toleranceMsRef = useRef<number>(toleranceMs);
  const stageTargetOffsetMsRef = useRef<number>(stageTargetOffsetMs);
  const calibrationOffsetRef = useRef<number>(calibrationOffset);
  const activeDebuffRef = useRef<Debuff>(activeDebuff);
  const comboRef = useRef(combo);
  const damageMultiplierRef = useRef(damageMultiplier);
  const activeStrategistRef = useRef(activeStrategist);
  const isSynergyActiveRef = useRef(isSynergyActive);
  const consecutiveMissesRef = useRef(0);
  const jianYongMissStreakRef = useRef(0);
  const currentBpmRef = useRef(currentBpm);

  useEffect(() => { isCalibratingRef.current = isCalibrating; }, [isCalibrating]);
  useEffect(() => { toleranceMsRef.current = toleranceMs; }, [toleranceMs]);
  useEffect(() => { stageTargetOffsetMsRef.current = stageTargetOffsetMs; }, [stageTargetOffsetMs]);
  useEffect(() => { calibrationOffsetRef.current = calibrationOffset; }, [calibrationOffset]);
  useEffect(() => { activeDebuffRef.current = activeDebuff; }, [activeDebuff]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { damageMultiplierRef.current = damageMultiplier; }, [damageMultiplier]);
  useEffect(() => { activeStrategistRef.current = activeStrategist; }, [activeStrategist]);
  useEffect(() => { isSynergyActiveRef.current = isSynergyActive; }, [isSynergyActive]);
  useEffect(() => { currentBpmRef.current = currentBpm; }, [currentBpm]);

  const lookahead = 25.0; // ms
  const scheduleAheadTime = 0.1; // s

  const lastMissSoundTimeRef = useRef<number>(0);

  const playSE = useCallback((type: 'miss' | 'hit' | 'just' | 'parry') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;
    
    if (type === 'miss') {
      if (t - lastMissSoundTimeRef.current < 0.2) return; // 200ms cooldown (throttling)
      lastMissSoundTimeRef.current = t;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      gain.gain.setValueAtTime(0.05, t); // 30% of original 0.15
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } else if (type === 'hit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'just') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(1200, t);
      osc1.frequency.linearRampToValueAtTime(1600, t + 0.1);
      osc2.frequency.setValueAtTime(1220, t);
      osc2.frequency.linearRampToValueAtTime(1620, t + 0.1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.3);
      osc2.stop(t + 0.3);
    } else if (type === 'parry') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(3000, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
      gain.gain.setValueAtTime(1.0, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }, []);

  const playGodlikeCutin = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 1.0);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 1.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.0);
  }, []);

  useEffect(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ type: 'set-threshold', value: transientThreshold });
    }
  }, [transientThreshold]);



  const initAudio = useCallback(async () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
      try {
        await audioCtxRef.current.audioWorklet.addModule('/transient-processor.js');
      } catch (err) {
        console.error("Failed to load audio worklet", err);
      }
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playClick = useCallback((time: number, isDownbeat: boolean) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = 'square';
    osc.frequency.value = isDownbeat ? 1200 : 900;
    envelope.gain.setValueAtTime(0.5, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    panner.pan.value = -0.5;

    osc.connect(envelope);
    envelope.connect(panner);
    panner.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const playEnemyNote = useCallback((time: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(150, time + 0.05);
    
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    panner.pan.value = 0.5;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const triggerFreeze = useCallback(() => {
    isFrozenRef.current = true;
    setIsFrozen(true);
    setShowGodlikeCutin(true);
    playGodlikeCutin();
    
    setTimeout(() => {
      isFrozenRef.current = false;
      setIsFrozen(false);
      setShowGodlikeCutin(false);
    }, 1500);
  }, [playGodlikeCutin]);

  const applyMissPenalty = useCallback((hitTime?: number) => {
    setCombo(0);
    consecutiveMissesRef.current += 1;
    jianYongMissStreakRef.current += 1;

    if (gameModeRef.current !== 'simulation') {
      if (consecutiveMissesRef.current >= 3) {
        const finalDamage = (10 * damageMultiplierRef.current) * (isSynergyActiveRef.current ? 0.5 : 1.0);
        setHp(h => Math.max(0, h - finalDamage));
        consecutiveMissesRef.current = 0;
      }
    }

    // Jian Yong Skill: Heal 20 HP after 5 misses
    if (activeStrategistRef.current === 'jian_yong' && jianYongMissStreakRef.current >= 5) {
      setHp(h => Math.min(100, h + 20));
      jianYongMissStreakRef.current = 0;
    }

    setGodlikeCount(0);
    playSE('miss');

    if (hitTime !== undefined) {
      setLastHit({ rawDiffMs: 0, diffMs: -toleranceMsRef.current - 1, isHit: false, time: hitTime });
    }
  }, [playSE]);

  const scheduler = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const currentTime = ctx.currentTime;
    const secondsPerBeat = 60.0 / currentBpmRef.current;

    const calibSec = calibrationOffsetRef.current / 1000.0;
    const thresholdSec = toleranceMsRef.current / 1000.0;

    // 1. Check for missed targets
    if (!isCalibratingRef.current) {
      while (targetsRef.current.length > 0) {
        const t = targetsRef.current[0];
        const expectedTime = t.time + calibSec + (t.offsetMs / 1000.0);
        
        if (currentTime > expectedTime + thresholdSec) {
          const missedTarget = targetsRef.current.shift();
          if (missedTarget && !missedTarget.hit) {
            applyMissPenalty(currentTime);
          }
        } else {
          break;
        }
      }
    } else {
      while (targetsRef.current.length > 0 && currentTime > targetsRef.current[0].time + 1.0) {
        targetsRef.current.shift();
      }
    }
    
    // 2. Schedule Metronome (Click sound)
    while (nextClickTimeRef.current < currentTime + scheduleAheadTime) {

      const isDownbeat = (clickCountRef.current % 4 === 0);
      // Phase 3 Mute Debuff: Skip playing sound if muted
      if (activeDebuffRef.current !== 'mute') {
        playClick(nextClickTimeRef.current, isDownbeat);
      }

      const isLeadIn = clickCountRef.current < 4;
      if (isLeadIn && !isCalibratingRef.current) {
        const beatNum = 4 - clickCountRef.current; // 4, 3, 2, 1
        const timeToClickMs = Math.max(0, (nextClickTimeRef.current - currentTime) * 1000);
        
        // 音が鳴る正確な瞬間に State を更新させる
        setTimeout(() => {
          setCountdown(beatNum);
        }, timeToClickMs);
      } else if (clickCountRef.current === 4 && !isCalibratingRef.current) {
        const timeToClickMs = Math.max(0, (nextClickTimeRef.current - currentTime) * 1000);
        setTimeout(() => {
          setCountdown(0);
        }, timeToClickMs);
      }

      if (isCalibratingRef.current) {
        targetsRef.current.push({ time: nextClickTimeRef.current, hit: false, offsetMs: 0 });
      }

      nextClickTimeRef.current += secondsPerBeat;
      clickCountRef.current++;
    }

    // 3. Schedule Targets (Rhythm pattern)
    if (!isCalibratingRef.current) {
      while (nextTargetTimeRef.current < currentTime + scheduleAheadTime) {
        const note = currentPatternRef.current[currentPatternIndexRef.current];
        
        if (note.type === 'note') {
          targetsRef.current.push({ time: nextTargetTimeRef.current, hit: false, offsetMs: stageTargetOffsetMsRef.current });
          if (activeDebuffRef.current !== 'mute') {
            playEnemyNote(nextTargetTimeRef.current);
          }
        }

        const durationInBeats = 4.0 / note.duration;
        nextTargetTimeRef.current += durationInBeats * secondsPerBeat;
        
        currentPatternIndexRef.current++;
        if (currentPatternIndexRef.current >= currentPatternRef.current.length) {
          currentPatternIndexRef.current = 0;
        }
      }
    }

    timerIDRef.current = window.setTimeout(scheduler, lookahead);
  }, [playClick, playSE]);

  const gameModeRef = useRef<GameMode>(gameMode);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  const stopMetronome = useCallback(() => {
    setIsPlaying(false);
    targetsRef.current = []; // Clear lingering targets!
    if (timerIDRef.current !== null) {
      window.clearTimeout(timerIDRef.current);
      timerIDRef.current = null;
    }
    battleStartTimeRef.current = 0;
    countdownRef.current = 0;
    setCountdown(0);
  }, []);

  const resetBattle = useCallback((
    newEnemyName?: string, 
    newEnemyMaxHp?: number,
    newBpm?: number,
    newDamageMultiplier?: number,
    newPattern?: NoteDef[],
    newToleranceMs?: number,
    newTargetOffsetMs?: number,
    newActiveStrategist?: string,
    newIsSynergyActive?: boolean
  ) => {
    setHp(100);
    if (newEnemyName) setEnemyName(newEnemyName);
    if (newEnemyMaxHp !== undefined) {
      setEnemyMaxHp(newEnemyMaxHp);
      setEnemyHp(newEnemyMaxHp);
    } else {
      setEnemyHp(enemyMaxHp);
    }
    if (newBpm !== undefined) setCurrentBpm(newBpm);
    if (newDamageMultiplier !== undefined) setDamageMultiplier(newDamageMultiplier);
    if (newPattern && newPattern.length > 0) {
      currentPatternRef.current = newPattern;
    } else {
      // Fallback to basic 4-beat pattern if empty or undefined
      currentPatternRef.current = [
        { type: 'note', duration: 4 },
        { type: 'note', duration: 4 },
        { type: 'note', duration: 4 },
        { type: 'note', duration: 4 }
      ];
    }
    if (newToleranceMs !== undefined) setToleranceMs(newToleranceMs);
    if (newTargetOffsetMs !== undefined) setStageTargetOffsetMs(newTargetOffsetMs);
    if (newActiveStrategist !== undefined) setActiveStrategist(newActiveStrategist);
    if (newIsSynergyActive !== undefined) setIsSynergyActive(newIsSynergyActive);
    
    setCombo(0);
    setGodlikeCount(0);
    setIsFrozen(false);
    isFrozenRef.current = false;
    setActiveDebuff('none');
    setLastHit(null);
    targetsRef.current = [];
    consecutiveMissesRef.current = 0;
    jianYongMissStreakRef.current = 0;
  }, [enemyMaxHp]);

  const startMetronome = useCallback(async () => {
    if (!workletNodeRef.current) {
      if (onError) onError("先に「マイク接続」ボタンを押して入力を有効にしてください。");
      return;
    }
    
    stopMetronome();
    await initAudio();
    setIsPlaying(true);
    
    if (gameModeRef.current !== 'training') {
      // Re-apply current parameters implicitly or just reset stats
      setHp(100);
      setCombo(0);
      setEnemyHp(enemyMaxHp);
      setGodlikeCount(0);
      setLastHit(null);
      targetsRef.current = [];
      isFrozenRef.current = false;
      setIsFrozen(false);
      setActiveDebuff('none');
    } else {
      targetsRef.current = [];
      isFrozenRef.current = false;
      setIsFrozen(false);
      setActiveDebuff('none');
      setCombo(0);
      setHp(100);
    }
    
    if (audioCtxRef.current) {
      const secondsPerBeat = 60.0 / currentBpmRef.current;
      const startTime = audioCtxRef.current.currentTime + 0.05;
      
      nextClickTimeRef.current = startTime;
      clickCountRef.current = 0;
      
      const leadInBeats = isCalibratingRef.current ? 0 : 4;
      nextTargetTimeRef.current = startTime + (leadInBeats * secondsPerBeat);
      currentPatternIndexRef.current = 0;

      if (!isCalibratingRef.current) {
        battleStartTimeRef.current = nextTargetTimeRef.current;
        countdownRef.current = 0;
        setCountdown(0);
      } else {
        battleStartTimeRef.current = 0;
        countdownRef.current = 0;
        setCountdown(0);
      }
      
      scheduler();
    }
  }, [initAudio, scheduler, stopMetronome, resetBattle]);

  const handleTransient = useCallback((hitTime: number) => {
    if (!audioCtxRef.current || targetsRef.current.length === 0) return;
    
    // キャリブレーション中ではなく、かつカウントダウン中（リードイン中）は入力を完全に無視する
    if (!isCalibratingRef.current && countdownRef.current > 0) {
      return;
    }

    const calibSec = calibrationOffsetRef.current / 1000.0;
    
    let closestTarget: Target | null = null;
    let minDiffSec = Infinity;

    for (const t of targetsRef.current) {
      if (t.hit) continue;
      const expectedTime = t.time + calibSec + (t.offsetMs / 1000.0);
      const diffSec = Math.abs(hitTime - expectedTime);
      if (diffSec < minDiffSec) {
        minDiffSec = diffSec;
        closestTarget = t;
      }
    }

    if (!closestTarget) return;

    // We consider rawDiff relative to the original click time for display, but diffMs relative to target offset.
    // Wait, let's keep diffMs simple: difference from the EXACT expected time including offset.
    const expectedTimeForHit = closestTarget.time + calibSec + (closestTarget.offsetMs / 1000.0);
    const diffMs = (hitTime - expectedTimeForHit) * 1000;
    const absDiff = Math.abs(diffMs);
    const rawDiffMs = (hitTime - closestTarget.time) * 1000;
    
    const isHit = absDiff <= toleranceMsRef.current;
    
    closestTarget.hit = true;

    if (isCalibratingRef.current) {
      calibrationSamplesRef.current.push(rawDiffMs);
      if (calibrationSamplesRef.current.length >= 5) {
        const sorted = [...calibrationSamplesRef.current].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        setCalibrationOffset(median);
        localStorage.setItem('sys_calibration', median.toString());
        setIsCalibrating(false);
        stopMetronome();
        calibrationSamplesRef.current = [];
      }
    } else {
      const hitResult: HitResult = {
        rawDiffMs: rawDiffMs,
        diffMs: diffMs,
        isHit: isHit,
        time: hitTime
      };
      
      setLastHit(hitResult);

      if (isHit) {
        consecutiveMissesRef.current = 0;
        jianYongMissStreakRef.current = 0;
        setCombo(c => c + 1);
        
        let didParry = false;
        if (gameModeRef.current === 'combat') {
          // Zhou Yu Skill: Increase damage based on combo
          const comboMultiplier = activeStrategistRef.current === 'zhou_yu' ? 1 + (comboRef.current * 0.1) : 1;

          if (absDiff <= 10 && activeDebuffRef.current !== 'none') {
            setActiveDebuff('none');
            setShowParryCutin(true);
            setTimeout(() => setShowParryCutin(false), 2000);
            playSE('parry');
            setEnemyHp(h => Math.max(0, h - (100 * comboMultiplier)));
            didParry = true;
          } else {
            if (absDiff <= 10) setEnemyHp(h => Math.max(0, h - (20 * comboMultiplier)));
            else setEnemyHp(h => Math.max(0, h - (10 * comboMultiplier)));
          }
          
          if (!didParry && activeDebuffRef.current === 'none' && comboRef.current > 0 && comboRef.current % 8 === 0) {
            const rand = Math.random();
            setActiveDebuff(rand > 0.5 ? 'mute' : 'blind');
          }
        }

        if (absDiff <= 10) {
          if (!didParry) playSE('just');
          setGodlikeCount(c => {
            const nextCount = c + 1;
            if (nextCount >= 3) {
              triggerFreeze();
              return 0;
            }
            return nextCount;
          });
        } else {
          playSE('hit');
          setGodlikeCount(0);
        }
      } else {
        applyMissPenalty();
      }
    }
  }, [isCalibrating, stopMetronome, playSE, triggerFreeze]);

  const previewPattern = useCallback(async (pattern: NoteDef[], previewBpm: number) => {
    await initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const secondsPerBeat = 60.0 / previewBpm;
    
    // Play 2 loops (2 measures of 4/4)
    const t0 = ctx.currentTime + 0.1;
    let t = t0;
    
    for (let loop = 0; loop < 2; loop++) {
      for (let i = 0; i < 4; i++) {
        playClick(t + i * secondsPerBeat, i === 0);
      }
      
      let pT = t;
      for (const note of pattern) {
        if (note.type === 'note') {
           playEnemyNote(pT);
        }
        const durationInBeats = 4.0 / note.duration;
        pT += durationInBeats * secondsPerBeat;
      }
      
      t += 4 * secondsPerBeat;
    }
  }, [initAudio, playClick]);

  const startListening = useCallback(async () => {
    await initAudio();
    if (!audioCtxRef.current) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtxRef.current, 'transient-processor');
      workletNodeRef.current = workletNode;
      workletNode.port.postMessage({ type: 'set-threshold', value: transientThreshold });
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'transient') {
           handleTransient(event.data.time);
        }
      };
      source.connect(workletNode);
      workletNode.connect(audioCtxRef.current.destination);
      setIsMicConnected(true);
      return true;
    } catch (err) {
      console.error("Mic access denied or error:", err);
      setIsMicConnected(false);
      if (onError) onError("マイクへのアクセスが拒否されたか、エラーが発生しました。ブラウザの権限設定を確認してください。");
      return false;
    }
  }, [initAudio, handleTransient, transientThreshold, onError]);

  const startCalibration = useCallback(() => {
    if (!workletNodeRef.current) {
      if (onError) onError("先に「マイク接続」ボタンを押して入力を有効にしてください。");
      return;
    }
    stopMetronome();
    setIsCalibrating(true);
    isCalibratingRef.current = true;
    calibrationSamplesRef.current = [];
    startMetronome();
  }, [startMetronome, stopMetronome]);

  const resetCalibration = useCallback(() => {
    setCalibrationOffset(0);
    localStorage.setItem('sys_calibration', '0');
  }, []);

  const setManualCalibration = useCallback((offset: number) => {
    setCalibrationOffset(offset);
    localStorage.setItem('sys_calibration', offset.toString());
  }, []);

  return {
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
  };
}
