/** 简谱音符垂直布局（主音与倚音共用） */

export function noteCenterY(
  measureY: number,
  measureHeight: number,
  stackIndex: number,
  noteH = measureHeight,
  yOffset = 0,
): number {
  return measureY + measureHeight / 2 - stackIndex * noteH + yOffset;
}

function getOctaveDotHeight(
  octaveDot: number | undefined,
  dotH: number,
  fOff: number,
  spacing: number,
  isUpper: boolean,
): number {
  if (octaveDot == null || octaveDot === 0) return 0;
  const need = isUpper ? octaveDot > 0 : octaveDot < 0;
  if (!need) return 0;
  const count = Math.abs(octaveDot);
  return fOff + count * dotH + Math.max(0, count - 1) * spacing;
}

/** 和弦各声部八度点累加 y 偏移 */
export function computeOctaveDotYOffsets(
  allNotes: { syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X'; octaveDot?: number }[],
  dotH: number,
  fOff: number,
  spacing: number,
  lastEdgeMargin: number,
): number[] {
  const offsets: number[] = [];
  const skip = (s: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'X') => s === 0 || s === 'X';
  for (let k = 0; k < allNotes.length; k++) {
    let acc = 0;
    for (let j = 0; j < k; j++) {
      const upperJ = skip(allNotes[j].syllable) ? 0 : getOctaveDotHeight(allNotes[j].octaveDot, dotH, fOff, spacing, true);
      const lowerJ1 = j + 1 < allNotes.length && !skip(allNotes[j + 1].syllable)
        ? getOctaveDotHeight(allNotes[j + 1].octaveDot, dotH, fOff, spacing, false)
        : 0;
      acc += upperJ + lowerJ1;
      if (upperJ > 0 && lowerJ1 > 0) acc += lastEdgeMargin;
    }
    offsets.push(-acc);
  }
  return offsets;
}
