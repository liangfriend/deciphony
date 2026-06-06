import { Sequence, PlaySequence, PlaySequenceItem } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 256 时值单位转秒
 * @param dur 时值（256=全音符 128=二分 64=四分 32=八分 …）
 * @param bpm 每分钟拍数
 * @param beatUnit 几分音符为一拍（拍号分母），默认 4=四分音符
 */
export function toSeconds(dur: number, bpm: number, beatUnit: number = 4): number {
  return (dur * beatUnit * 60) / (256 * bpm);
}

/**
 * Sequence -> PlaySequence
 * 每组（子数组）的播放开始位置 = 上一组的开始位置 + 上一组内最长音符时值
 * duration / offset / playTime 均直接使用 256 分音符粒度的原始数值
 * @param sequence 用户传入的序列
 */
export function sequenceToPlaySequence(sequence: Sequence): PlaySequence {
  const result: PlaySequenceItem[] = [];
  let playTime = 0;
  for (let i = 0; i < sequence.length; i++) {
    const items = sequence[i] ?? [];
    let maxDuration = 0;
    for (const item of items) {
      const offset = item.offset ?? 0;
      const total = offset + item.duration;
      if (total > maxDuration) maxDuration = total;
      result.push({
        id: uuidv4(),
        velocity: item.velocity ?? 1,
        toneColor: item.toneColor,
        midi: item.midi,
        duration: item.duration,
        playTime: playTime + offset,
        data: item.data,
        gainNodeKey: item.gainNodeKey as string,
        end: false
      });
    }
    playTime += maxDuration;
  }
  let maxEnd = 0;
  let maxIdx = result.length - 1;
  for (let i = 0; i < result.length; i++) {
    const end = result[i].playTime + result[i].duration;
    if (end > maxEnd) {
      maxEnd = end;
      maxIdx = i;
    }
  }
  if (result.length) result[maxIdx].end = true;
  return result;
}
