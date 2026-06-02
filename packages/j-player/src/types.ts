export type Unit256 = number; // 区分普通number, 这个表示 256=全音符 128=二分 64=四分 32=八分 16=十六分 ...这种形式的单位
/**
 * 建议使用PlaySequence, sequene是有缺陷的，会取一维数组里最长的音符结束时间作为下一组数组的开始播放时间，不够灵活
 * */
export type SequenceItem = {
  velocity?: number; // 在全局音量基础*velocity=实际音量
  toneColor: string; // 音色名称
  midi: number; // midi -1为休止符
  duration: Unit256; // 播放时值：256=全音符 128=二分 64=四分 32=八分 16=十六分 ...
  data?: any; // 用于用户自定义需要传递的数据
  /** 分组音量：总线 → 该 key 的持久 GainNode → 本音符；不传则音符直连总线 */
  gainNodeKey?: string;
  offset?: Unit256; // 延时播放时值，同 duration 规则
};
/** 每个子数组内音符在同一拍点开始播放；下一组开始时间 = 上一组开始时间 + 上一组内最长音符时值 */
export type Sequence = SequenceItem[][];

/** NPlayer 内部以 256 分音符为最小粒度存储时值与位置 */
export type PlaySequenceItem = {
  id: string;
  velocity?: number;
  toneColor: string;
  midi: number;
  duration: Unit256; // 持续时值（256=全音符 128=二分 64=四分 32=八分 …）
  playTime: Unit256; // 开始播放位置（同 duration 单位）
  data: any;
  /** 分组音量：总线 → 该 key 的持久 GainNode → 本音符；不传则音符直连总线 */
  gainNodeKey?: string;
  end: boolean; // 结尾标记, 这个会起功能性作用，触发end事件等，所以一定要手动写好
};

export type PlaySequence = PlaySequenceItem[];

export type ToneColor = Record<number, string>; // midi：dataurl或url
// ================================================= MPlayer =========================================================
/** 每小节拍数（拍号分子），常见 2–12；1–16 覆盖教学与流行/古典常用拍号 */
export type TimeSignatureNumerator =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16;

/** 几分音符为一拍（拍号分母），4=四分音符，8=八分音符 */
export type BeatUnit = 2 | 4 | 8 | 16;

/**
 * 拍号 `"分子/分母"`，分母同 BeatUnit（2=二分音符为一拍，4=四分，8=八分，16=十六分）。
 * 共 16×4=64 种；更罕见的拍号可用 `string` 或扩展分子联合。
 */
export type TimeSignature = `${TimeSignatureNumerator}/${BeatUnit}`;

/** 节拍器强度 */
export type Intensity = 'strong' | 'weak' | 'secondary';

/** 节拍器单拍（一小节内的一条点击），时值与位置均以 256 分音符为粒度 */
export type MetronomeSequenceItem = {
  id: string;
  intensity: Intensity;
  duration: Unit256;
  playTime: Unit256;
  data: { beatIndex: number };
  end: boolean;
};

/** 一小节的节拍器序列（循环播放时每到小节末 onEnd 再 play） */
export type MetronomeSequence = MetronomeSequenceItem[];

/** MPlayer 内部生成节拍序列时的选项 */
export type MetronomeSequenceGenOption = {
  /**
   * 将「单小节」节拍型沿时间轴重复拼接的次数。
   * 1：默认；2：如 2/4 的 [strong, weak] 变为 [strong, weak, strong, weak]（总长 2 小节）。
   */
  copyCount: number;
};

/** 节拍器音色 */
export type MetronomeColor = Record<Intensity, string>; // 第二个参数是dataurl或url
