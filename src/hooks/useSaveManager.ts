import { useState, useEffect } from 'react';

export type SaveSlot = {
  slotId: number;
  name: string;
  date: string;
  totalVictories: number;
  clearedStages: string[];
  strategists: any; // using any for simplicity to avoid circular dep
  activeStrategist: string;
  selectedStage: string;
  difficulty: string;
};

export function useSaveManager() {
  const [saveSlots, setSaveSlots] = useState<(SaveSlot | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = () => {
    const slots = [];
    for (let i = 1; i <= 5; i++) {
      const data = localStorage.getItem(`sn_save_slot_${i}`);
      if (data) {
        try {
          slots.push(JSON.parse(data));
        } catch (e) {
          console.warn(`Failed to parse save slot ${i}, data corrupted:`, e);
          slots.push(null);
        }
      } else {
        slots.push(null);
      }
    }
    setSaveSlots(slots);
  };

  const saveToSlot = (slotId: number, state: Omit<SaveSlot, 'slotId' | 'date'>) => {
    const now = new Date();
    const save: SaveSlot = {
      ...state,
      slotId,
      date: `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    };
    localStorage.setItem(`sn_save_slot_${slotId}`, JSON.stringify(save));
    loadSlots();
  };

  const deleteSlot = (slotId: number) => {
    localStorage.removeItem(`sn_save_slot_${slotId}`);
    loadSlots();
  };

  return { saveSlots, saveToSlot, deleteSlot };
}
