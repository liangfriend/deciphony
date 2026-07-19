export type Unit256 = number; // 区分普通number, 这个表示 256=全音符 128=二分 64=四分 32=八分 16=十六分 ...这种形式的单位
export type SequenceItem = {
  midi: number; // midi
  duration: Unit256;
  playTime: Unit256;
  data: any; // 用户自定义数据
};
/** 每个子数组内音符在同一拍点开始播放；下一组开始时间 = 上一组开始时间 + 上一组内最长音符时值 */
export type Sequence = SequenceItem[];
export enum NoteStateEnum {
  'perfect' = 'perfect', // 完美
  'quick-start' = 'quick-start', // 开始早
  'slow-start' = 'slow-start', // 开始晚
  'quick-end' = 'quick-end', // 结束早
  'slow-end' = 'slow-end', // 结束晚
  'miss' = 'miss', // 未弹
  'wrong' = 'wrong', // 错误
  'high-midi' = 'high-midi', // 过高
  'low-midi' = 'low-midi', //过低
  'pending' = 'pending' // 等待测评;
}
export type PlaySequenceItem = {
  midi: number; // midi
  duration: Unit256;
  playTime: Unit256;
  rhythmMark: boolean; // 节奏标记
  completenessMark: boolean; // 完整性标记
  data: any; // 用户自定义数据
  state: NoteStateEnum;
};
export type PlaySequence = PlaySequenceItem[];
export interface DetectRes {
  pitch: string;
  frequency: number;
  /** 静音或未检测到音高时为 0；有效音符为 1～128 */
  midi: number;
}
/** 结果序列 */
export type ResultSequenceItem = {
  midi: number; // 目标midi
  duration: Unit256;
  playTime: Unit256;
  realMidi: number; // 实际midi,取决于当前config下realMidi的得分
  score: number; // 评分 0~100
  relativeFixedMidi: number; // relative模式下会把realMidi修正然后参与score的计算。默认为0
};
export type ResultSequence = ResultSequenceItem[];

export type DetectCallback = (res: DetectRes, currentTime: number) => void;

export type Config = {
  mode: 'relative' | 'absolute';
  // 弹性范围，单位midi,弹性范围内命中 pitchScore得满分
  pitchScoreElasticity: number;
  // 音符开始时刻向左右扩展的命中范围，此范围内命中，获取节奏得分
  rhythmScoreRange: Unit256;
  // 音符两侧向外的扩展命中范围，此范围内命中，获取完整性得分
  completenessScoreRange: Unit256;
};
