import { useState, useCallback, useRef } from 'react';

export type EventType = 'start' | 'parry' | 'disadvantage' | 'advantage' | 'miss' | 'synergy_activation';

export type ChatMessage = {
  id: string;
  text: string;
  timestamp: number;
};

// 共通のAI呼び出し関数
const callStrategistAI = async (prompt: string): Promise<string> => {
  const response = await fetch('/api/strategist-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!response.ok) throw new Error("API Request Failed");
  const data = await response.json();
  return data.text.replace(/[\r\n"「」]/g, '').trim();
};

export function useGeminiStrategist() {
  const [currentLine, setCurrentLine] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 排他制御用のRef（UIをブロックせず、連打されたイベントを破棄する防波堤）
  const isFetchingRef = useRef(false);

  const requestReaction = useCallback(async (
    playerTitle: string,
    strategistName: string,
    strategistLevel: number,
    persona: string,
    eventType: EventType,
    combo: number,
    enemyHp: number,
    aiPromptOverride?: string
  ) => {
    if (isFetchingRef.current) return; 
    
    setIsLoading(true);
    isFetchingRef.current = true;

    try {
      let eventDesc = "";
      switch (eventType) {
        case 'start': eventDesc = "開戦時（気合を入れる）"; break;
        case 'parry': eventDesc = "敵の計略を神算で打破した"; break;
        case 'disadvantage': eventDesc = "敵の計略（デバフ）を受けた"; break;
        case 'advantage': eventDesc = `${combo}コンボ達成の猛攻`; break;
        case 'miss': eventDesc = "コンボが途切れ、ダメージを受けた"; break;
        case 'synergy_activation': eventDesc = "歴史的に縁深い戦場に出陣し、地の利や過去の因縁から士気が最高潮に達している"; break;
      }

      const overrideText = aiPromptOverride ? `\n（特別状況: ${aiPromptOverride}）` : "";

      const prompt = `【システム指示：絶対遵守】
${persona}

【現在の状況】
プレイヤーの階級: ${playerTitle}
軍師のレベル(絆): ${strategistLevel}
発生したイベント: ${eventDesc} (敵HP: ${enemyHp})${overrideText}

【出力ルール】
・上記の人格と状況に完全に合致するセリフを「20文字以内」で出力せよ。
・改行、カギ括弧、状況説明などのメタテキストは一切含めず、純粋なセリフのみを返すこと。`;
      
      const cleanText = await callStrategistAI(prompt);
      const finalLine = `【Lv.${strategistLevel}】${cleanText}`;
      
      setCurrentLine(finalLine);
      setChatHistory(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        text: finalLine,
        timestamp: Date.now()
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const requestBriefing = useCallback(async (
    playerTitle: string,
    strategistName: string,
    currentInt: number,
    persona: string,
    rhythmOnomatopoeia: string,
    gimmick: string
  ) => {
    if (isFetchingRef.current) return;
    setIsLoading(true);
    isFetchingRef.current = true;

    try {
      const prompt = `【システム指示：絶対遵守】
${persona}

【敵軍の解析結果】
敵の基本リズムパターン: ${rhythmOnomatopoeia}
敵の計略・特殊ギミック: ${gimmick || 'なし'}

【あなたの知力による制限】
あなたの現在の知力は ${currentInt} です。
・知力が50未満の場合、リズムパターンの雰囲気（早い、遅い、休符が多い等）だけをぼんやりと伝えてください。
・知力が50以上の場合、「敵は${rhythmOnomatopoeia}のリズムですぞ」など、正確なリズムパターンを伝えてください。
・知力が90以上の場合、リズムに加えて敵の計略（${gimmick}）も完全に見破り、具体的な対策を教えてください。

【出力ルール】
・上記の人格と知力制限に完全に合致し、プレイヤーへの対策と「模擬戦（練習）をしますか？」という提案を「30文字以内」で出力せよ。
・改行、カギ括弧、状況説明などのメタテキストは一切含めず、純粋なセリフのみを返すこと。`;
      
      const cleanText = await callStrategistAI(prompt);
      const finalLine = `【軍議】${cleanText}`;
      
      setCurrentLine(finalLine);
      setChatHistory(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        text: finalLine,
        timestamp: Date.now()
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    setCurrentLine('');
  }, []);

  const requestIdleChat = useCallback(async (
    playerTitle: string,
    persona: string
  ) => {
    if (isFetchingRef.current) return;
    
    setIsLoading(true);
    isFetchingRef.current = true;

    try {
      const prompt = `【システム指示：絶対遵守】
${persona}

【現在の状況】
現在、出陣前の陣幕で待機中です。
プレイヤーの階級: ${playerTitle}

【出力ルール】
・上記の人格に従い、主君に対して気の利いた独り言や世間話を「15文字程度」で発言してください。
・改行、カギ括弧、状況説明などのメタテキストは一切含めず、純粋なセリフのみを返すこと。`;
      
      const cleanText = await callStrategistAI(prompt);
      
      setCurrentLine(cleanText);
      setChatHistory(prev => [...prev, { id: Date.now().toString(), text: cleanText, timestamp: Date.now() }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  return { currentLine, chatHistory, isLoading, requestReaction, requestBriefing, requestIdleChat, clearChatHistory };
}

