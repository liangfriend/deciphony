import { Sequence, PlaySequence } from './types';
/**
 * 256 时值单位转秒
 * @param dur 时值（256=全音符 128=二分 64=四分 32=八分 …）
 * @param bpm 每分钟拍数
 * @param beatUnit 几分音符为一拍（拍号分母），默认 4=四分音符
 */
export declare function toSeconds(dur: number, bpm: number, beatUnit?: number): number;
/**
 * Sequence -> PlaySequence
 * 每组（子数组）的播放开始位置 = 上一组的开始位置 + 上一组内最长音符时值
 * duration / offset / playTime 均直接使用 256 分音符粒度的原始数值
 * @param sequence 用户传入的序列
 */
export declare function sequenceToPlaySequence(sequence: Sequence): PlaySequence;
