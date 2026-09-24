import type { NoteDef } from '../hooks/useGameState';

export function generateRhythmOnomatopoeia(pattern: NoteDef[]): string {
  return pattern.map(n => {
    if (n.type === 'rest') return 'ウン';
    if (n.duration === 4) return 'タン';
    if (n.duration === 8) return 'タタ'; // For 8th notes, typically played faster
    if (n.duration === 16) return 'ツッ'; 
    return 'タン';
  }).join('・');
}
