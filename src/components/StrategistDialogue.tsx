import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '../hooks/useGeminiStrategist';

type StrategistDialogueProps = {
  strategistName: string;
  strategistLevel: number;
  currentInt: number;
  chatHistory: ChatMessage[];
  isLoading: boolean;
};

export const StrategistDialogue: React.FC<StrategistDialogueProps> = ({
  strategistName,
  strategistLevel,
  currentInt,
  chatHistory,
  isLoading
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:20px_20px] opacity-20"></div>
        <div className="flex items-center space-x-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-indigo-900 border-2 border-indigo-500 flex items-center justify-center text-xl font-black text-indigo-200">
            {strategistName.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-tight tracking-wider">{strategistName}</h2>
            <div className="text-xs text-indigo-400 font-mono">軍師 (絆Lv.{strategistLevel})</div>
          </div>
        </div>
        <div className="text-right relative z-10">
          <div className="text-[10px] text-slate-400">知力</div>
          <div className="text-xl font-black text-amber-400 tracking-tighter">{currentInt}</div>
        </div>
      </div>

      {/* Main Dialogue Area (Scrollable) */}
      <div 
        className="flex-1 p-4 overflow-y-auto custom-scrollbar relative flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 space-y-4"
      >
        {/* Background Decorative element */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
          <span className="text-[10rem] font-serif">言</span>
        </div>

        {chatHistory.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-slate-600 text-sm z-10 relative">
            出陣して軍師の助言を聞こう
          </div>
        ) : (
          <div className="flex flex-col justify-end min-h-full space-y-4 z-10 relative pt-10">
            <AnimatePresence initial={false}>
              {chatHistory.map((msg) => {
                // Remove the prefix like "【Lv.1】" for display in the bubble if it exists
                const cleanLine = msg.text.replace(/^【.*?】/, '');
                
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex flex-col items-end self-end max-w-[90%]"
                  >
                    <div className="text-[10px] text-slate-500 mb-1 px-1 flex items-center space-x-2">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="bg-indigo-600/20 border border-indigo-500/50 text-indigo-100 p-4 rounded-2xl rounded-tr-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                      <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">
                        {cleanLine}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <AnimatePresence>
              {isLoading && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 text-indigo-400 self-end bg-indigo-900/10 p-3 rounded-2xl rounded-tr-sm border border-indigo-900/50"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-[10px] tracking-widest ml-2">策を講じています...</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
