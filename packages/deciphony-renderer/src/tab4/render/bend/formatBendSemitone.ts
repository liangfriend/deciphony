/** 推弦阶段标注：2 为 full，其余为 x/4（0.5→1/4，1→2/4，1.5→3/4，2.5→5/4） */
export function formatBendSemitoneLabel(semitone: number): string {
  if (semitone === 2) return 'full';
  return `${Math.round(semitone * 2)}/4`;
}
