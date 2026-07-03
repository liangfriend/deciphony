import { Config, DetectRes, NoteStateEnum, PlaySequence, Sequence, Unit256 } from './types';
import pitchDetect from './pitch-detect';
import { _audioContext } from './ContextManager';
import { emptyMidiMap } from './constant';

// type ScoredSequenceItem = Sequence[number] & { score: number };
//
// const state: 'playing' | 'paused' | 'stopped' = 'stopped';
let bpm = 120;
/** 最近一次 loadSequence 的副本，用于 clearData 时还原 playSequence */
let lastLoadedSequence: Sequence = [];
// 剩余的sequence, 方便快速查找当前项
let playSequence: PlaySequence = [];
// 播放序列
export const playMap = new Map<number, Unit256[][]>(emptyMidiMap);
// 已经播放的序列
export const playedMap = {
  raw: new Map<number, Unit256[][]>(emptyMidiMap),
  fixed: new Map<number, Unit256[][]>(emptyMidiMap),
  absorbed: new Map<number, Unit256[][]>(emptyMidiMap)
};
// 开始播放时的currentTime
export let startTime = 0;
// 播放设置
const config: Config = {
  mode: 'relative',
  pitchScoreElasticity: 2,
  rhythmScoreRange: 16,
  completenessScoreRange: 0
};
export function setBpm(newBpm: number) {
  bpm = newBpm;
}
/** 合并更新判分/吸附配置；未传字段保持不变 */
export function setJudgeConfig(partial: Partial<Config>): void {
  if (partial.mode !== undefined) {
    config.mode = partial.mode;
  }
  if (partial.pitchScoreElasticity !== undefined) {
    config.pitchScoreElasticity = Math.max(0, partial.pitchScoreElasticity);
  }
  if (partial.rhythmScoreRange !== undefined) {
    config.rhythmScoreRange = Math.max(0, partial.rhythmScoreRange);
  }
  if (partial.completenessScoreRange !== undefined) {
    config.completenessScoreRange = Math.max(0, partial.completenessScoreRange);
  }
}

export function getJudgeConfig(): Readonly<Config> {
  return { ...config };
}
export type TuneJudgeScoreSnapshot = {
  real: {
    pitchScore: number;
    rhythmScore: number;
    completenessScore: number;
  };
  total: {
    pitchScore: number;
    rhythmScore: number;
    completenessScore: number;
  };
};

export type TuneJudgeProgressPayload = {
  curTime: number;
  curTime256: Unit256;
  realMidi: number;
  targetMidi: number;
  midiFixedOffset: number;
  midiAdsorbedOffset: number;
  midi: number;
  fixedMidi: number;
  adsorbedMidi: number;
  playedMap: {
    raw: Map<number, number[][]>;
    fixed: Map<number, number[][]>;
    absorbed: Map<number, number[][]>;
  };
  score: TuneJudgeScoreSnapshot;
};

// 回调
let progressCallback: (data: TuneJudgeProgressPayload) => void;

export function setProgressCallback(cb: (data: TuneJudgeProgressPayload) => void) {
  progressCallback = cb;
}
// ======== 分数 ==========
const score: TuneJudgeScoreSnapshot = {
  real: {
    pitchScore: 0,
    rhythmScore: 0,
    completenessScore: 0
  },
  total: {
    pitchScore: 0,
    rhythmScore: 0,
    completenessScore: 0
  }
};

export function getScoreSnapshot(): TuneJudgeScoreSnapshot {
  return {
    real: { ...score.real },
    total: { ...score.total }
  };
}

let preMidi = 0;
let preFixedMidi = 0;
let preAbsorbedMidi = 0;

/** 暂停时刻的 AudioContext 时间；恢复时用于补偿 startTime，避免时间轴跳变 */
let pauseWallTime = 0;
let isPaused = false;

/** 本秒内累积的「目标 midi − 检测 midi」样本，用于每秒更新移调修正 */
let offsetSamplesThisPeriod: number[] = [];
// 修正值（整半音移调，把检测音高对齐到谱面区域）
let midiFixedOffset = 0;
/** 是否已完成至少一次「按秒」修正（首秒不与前值混合，避免从 0 拖尾） */
let midiOffsetLocked = false;
let lastMidiFixedOffsetUpdateTime = -Infinity; // 上次更新时间，单位 AudioContext 秒

/** 每秒新修正与旧值的混合比例，越大越跟新一秒的统计 */
const MIDI_OFFSET_SEC_BLEND = 0.65;
/** 本秒至少多少帧才更新，避免刚开始样本太少 实际是至少多少次返回有效midi,这个不易太大*/
const MIDI_OFFSET_MIN_SAMPLES = 6;
/** 样本中同一「四舍五入半音」占比 ≥ 此值时，用众数（抗抖音、易锁定八度） */
const MIDI_OFFSET_MODE_RATIO = 0.42;

function median(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  const s = [...samples].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** 从一秒内的偏移样本选一个整半音修正：共识强用众数，否则用中位数四舍五入 */
function pickMidiOffsetFromSamples(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  const n = samples.length;
  const counts = new Map<number, number>();
  for (const x of samples) {
    const k = Math.round(x);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let modeKey = 0;
  let modeCount = -1;
  for (const [k, c] of counts) {
    if (c > modeCount) {
      modeCount = c;
      modeKey = k;
    }
  }
  const medR = Math.round(median(samples));
  return modeCount / n >= MIDI_OFFSET_MODE_RATIO ? modeKey : medR;
}

/**
 * 加载序列
 * 将序列按照interval分割成小块，并添加到playSequence中
 * 如果不满interval的，则余下的playTime形成一个小块，添加到playSequence中
 */
export function loadSequence(seq: Sequence) {
  lastLoadedSequence = [...seq];
  playSequence = [
    ...seq.map((e) => {
      return {
        ...e,
        rhythmMark: false,
        completenessMark: false,
        state: NoteStateEnum.pending as const
      };
    })
  ];
  playMap.clear();
  playedMap.raw.clear();
  playedMap.fixed.clear();
  playedMap.absorbed.clear();
  for (const [k] of emptyMidiMap) {
    playMap.set(k, []);
    playedMap.raw.set(k, []);
    playedMap.fixed.set(k, []);
    playedMap.absorbed.set(k, []);
  }
  for (let i = 0; i < seq.length; i++) {
    const item = seq[i];
    const targetSeq = playMap.get(item.midi);
    if (targetSeq) {
      targetSeq.push([item.playTime, item.playTime + item.duration]);
    }
  }
  // 去除不合理的midi值
  const noteSeq = seq.filter((e) => validMidi(e.midi));
  score.total.pitchScore = noteSeq.reduce((acc, cur) => {
    return acc + cur.duration;
  }, 0);
  score.total.rhythmScore = noteSeq.length;
  score.total.completenessScore = noteSeq.length;
}
export function getPlaySequence() {
  return playSequence.slice();
}

/** 清空已唱轨（playedMap），并重置连音状态；可选还原 playSequence 以便再次从头检测 */
export function clearData() {
  playedMap.raw.clear();
  playedMap.fixed.clear();
  playedMap.absorbed.clear();
  for (const [k] of emptyMidiMap) {
    playedMap.raw.set(k, []);
    playedMap.fixed.set(k, []);
    playedMap.absorbed.set(k, []);
  }
  playSequence = [
    ...lastLoadedSequence.map((e) => {
      return { ...e, rhythmMark: false, completenessMark: false, state: NoteStateEnum.pending };
    })
  ];
  preMidi = 0;
  preFixedMidi = 0;
  preAbsorbedMidi = 0;
  pauseWallTime = 0;
  isPaused = false;
  offsetSamplesThisPeriod = [];
  midiFixedOffset = 0;
  midiOffsetLocked = false;
  lastMidiFixedOffsetUpdateTime = _audioContext?.currentTime ?? -Infinity;
  score.real.pitchScore = 0;
  score.real.rhythmScore = 0;
  score.real.completenessScore = 0;
}
/**
 * 开始 / 恢复麦克风检测
 * - 首次 play：重置 startTime 与移调状态
 * - pause 后 play：仅补偿暂停时长，保持 playedMap 时间轴连续
 */
export async function play(micStream?: MediaStream) {
  if (!_audioContext) {
    throw new Error('请先调用startTuneJudge');
  }
  if (isPaused && pauseWallTime > 0) {
    startTime += _audioContext.currentTime - pauseWallTime;
    lastMidiFixedOffsetUpdateTime = _audioContext.currentTime;
    pauseWallTime = 0;
    isPaused = false;
  } else {
    offsetSamplesThisPeriod = [];
    midiFixedOffset = 0;
    midiOffsetLocked = false;
    startTime = _audioContext.currentTime;
    lastMidiFixedOffsetUpdateTime = startTime;
  }
  if (micStream) {
    await pitchDetect.startDetectWithStream(micStream, check);
  } else {
    await pitchDetect.startDetect(check);
  }
}
export function pause() {
  if (_audioContext) {
    pauseWallTime = _audioContext.currentTime;
  }
  isPaused = true;
  pitchDetect.dispose();
}
/**
 *
 */
export function stop() {
  pitchDetect.dispose();
  finalizeNoteStates();
  pauseWallTime = 0;
  isPaused = false;
}

/** 音符窗口内判定为「唱到」的最小交集（Unit256） */
const MIN_SINGING_OVERLAP_UNIT256 = 4;

/**
 * 对 playSequence 中仍为 pending 的音符计算终态（停止或播放结束时调用）
 */
export function finalizeNoteStates(): PlaySequence {
  for (const item of playSequence) {
    if (item.state === NoteStateEnum.pending) {
      item.state = computeNoteState(item);
    }
  }
  return playSequence.slice();
}

function computeNoteState(item: PlaySequence[number]): NoteStateEnum {
  const { playTime, duration, midi } = item;
  const noteEnd = playTime + duration;

  let targetOverlap = 0;
  let firstTargetOnset = Infinity;
  const targetPlayed = playedMap.absorbed.get(midi) ?? [];
  for (const seg of targetPlayed) {
    const bounds = segmentBounds(seg);
    if (!bounds) continue;
    const t0 = Math.max(playTime, bounds.start);
    const t1 = Math.min(noteEnd, bounds.end);
    if (t1 > t0) {
      targetOverlap += t1 - t0;
      if (bounds.start < firstTargetOnset) {
        firstTargetOnset = bounds.start;
      }
    }
  }

  let wrongOverlap = 0;
  for (const [m, segs] of playedMap.absorbed.entries()) {
    if (m === midi) continue;
    for (const seg of segs) {
      const bounds = segmentBounds(seg);
      if (!bounds) continue;
      const t0 = Math.max(playTime, bounds.start);
      const t1 = Math.min(noteEnd, bounds.end);
      if (t1 > t0) {
        wrongOverlap += t1 - t0;
      }
    }
  }

  if (targetOverlap < MIN_SINGING_OVERLAP_UNIT256 && wrongOverlap < MIN_SINGING_OVERLAP_UNIT256) {
    return NoteStateEnum.miss;
  }

  if (wrongOverlap > targetOverlap) {
    return NoteStateEnum.wrong;
  }

  if (firstTargetOnset < playTime - config.rhythmScoreRange) {
    return NoteStateEnum['quick-start'];
  }

  if (!item.rhythmMark) {
    return NoteStateEnum['slow-start'];
  }

  if (item.rhythmMark && item.completenessMark) {
    return NoteStateEnum.perfect;
  }

  if (targetOverlap >= MIN_SINGING_OVERLAP_UNIT256) {
    return NoteStateEnum['slow-start'];
  }

  return NoteStateEnum.miss;
}

function tryFinalizePassedNotes(cur256Time: Unit256): void {
  const tail = config.completenessScoreRange;
  for (const item of playSequence) {
    if (item.state !== NoteStateEnum.pending) continue;
    if (cur256Time > item.playTime + item.duration + tail) {
      item.state = computeNoteState(item);
    }
  }
}

function check(result: DetectRes, currentTime: number) {
  const elapsedTime = currentTime - startTime;
  const cur256Time = secondsToUnit256(elapsedTime, bpm);
  let curItem = null;
  // 被修正过的midi，推荐用于音轨条展示
  let fixedMidi = 0;
  // 被修正的midi经过吸附操作后的midi, 用于score计算
  let adsorbedMidi = 0;
  let midiAdsorbedOffset = 0;
  // 遍历找到当前播放的音符 TODO 我不喜欢这样遍历，有待优化
  for (let i = 0; i < playSequence.length; i++) {
    const item = playSequence[i];
    if (item.playTime <= cur256Time && item.playTime + item.duration > cur256Time) {
      curItem = item;
      break;
    }
  }
  tryFinalizePassedNotes(cur256Time);

  if (result.midi <= 0) {
    const data = {
      curTime: elapsedTime,
      curTime256: cur256Time,
      realMidi: result.midi,
      targetMidi: curItem?.midi ?? -1,
      midiFixedOffset: midiFixedOffset,
      midiAdsorbedOffset: midiAdsorbedOffset,
      midi: result.midi,
      fixedMidi,
      adsorbedMidi,
      playedMap: playedMap,
      score
    };
    // 回调出去
    progressCallback?.(data);
    return;
  }

  if (curItem) {
    fixedMidi = result.midi;
    adsorbedMidi = fixedMidi;

    offsetSamplesThisPeriod.push(curItem.midi - result.midi);

    // 每秒用本段样本重算移调修正（不用全历史平均，避免错音把整体拉偏）
    if (currentTime - lastMidiFixedOffsetUpdateTime >= 1) {
      if (offsetSamplesThisPeriod.length >= MIDI_OFFSET_MIN_SAMPLES) {
        const candidate = pickMidiOffsetFromSamples(offsetSamplesThisPeriod);
        if (!midiOffsetLocked) {
          midiFixedOffset = candidate;
          midiOffsetLocked = true;
        } else {
          midiFixedOffset = Math.round(
            midiFixedOffset * (1 - MIDI_OFFSET_SEC_BLEND) + candidate * MIDI_OFFSET_SEC_BLEND
          );
        }
      }
      offsetSamplesThisPeriod = [];
      lastMidiFixedOffsetUpdateTime = currentTime;
    }

    fixedMidi += midiFixedOffset;
    // console.log('chicken', midiFixedOffset, fixedMidi);
    adsorbedMidi = fixedMidi;
    // 计算吸附值
    if (
      fixedMidi + config.pitchScoreElasticity >= curItem.midi &&
      fixedMidi - config.pitchScoreElasticity <= curItem.midi
    ) {
      midiAdsorbedOffset = curItem.midi - fixedMidi;
      adsorbedMidi += midiAdsorbedOffset;
    }
  }
  // 遍历计算节奏得分&完整性得分
  for (let i = 0; i < playSequence.length; i++) {
    const item = playSequence[i];
    // 最终用于算分的midi值
    const scoreMidi = config.mode === 'absolute' ? result.midi : adsorbedMidi;
    // 标定节奏得分，防止重复，rhythm属性设置true
    if (
      item.playTime - config.rhythmScoreRange <= cur256Time &&
      item.playTime + config.rhythmScoreRange > cur256Time &&
      scoreMidi === curItem?.midi
    ) {
      item.rhythmMark = true;
    }
    if (
      item.playTime - config.completenessScoreRange <= cur256Time &&
      item.playTime + item.duration + config.completenessScoreRange > cur256Time &&
      scoreMidi === curItem?.midi
    ) {
      item.completenessMark = true;
    }
  }
  // 赋值节奏分
  score.real.rhythmScore = playSequence.reduce((acc, cur) => {
    if (cur.rhythmMark) return acc + 1;
    return acc;
  }, 0);
  // 赋值完整分
  score.real.completenessScore = playSequence.reduce((acc, cur) => {
    if (cur.completenessMark) return acc + 1;
    return acc;
  }, 0);
  const curSeq = playedMap.raw.get(result.midi)!;
  if (preMidi === result.midi && curSeq.length > 0) {
    curSeq[curSeq.length - 1][1] = cur256Time;
  } else {
    curSeq.push([cur256Time, cur256Time]);
  }

  if (curItem && fixedMidi >= 1 && fixedMidi <= 128) {
    const curFixedSeq = playedMap.fixed.get(fixedMidi)!;
    if (preFixedMidi === fixedMidi && curFixedSeq.length > 0) {
      curFixedSeq[curFixedSeq.length - 1][1] = cur256Time;
    } else {
      curFixedSeq.push([cur256Time, cur256Time]);
    }
  }

  if (curItem && adsorbedMidi >= 1 && adsorbedMidi <= 128) {
    const curAbsorbedSeq = playedMap.absorbed.get(adsorbedMidi)!;
    if (preAbsorbedMidi === adsorbedMidi && curAbsorbedSeq.length > 0) {
      curAbsorbedSeq[curAbsorbedSeq.length - 1][1] = cur256Time;
    } else {
      curAbsorbedSeq.push([cur256Time, cur256Time]);
    }
  }
  // 音准：同一 midi 上，谱面时段与已唱时段的交集总长度（Unit256）
  score.real.pitchScore = pitchIntersectionUnit256(playMap, playedMap.absorbed);
  const data = {
    curTime: elapsedTime,
    curTime256: cur256Time,
    realMidi: result.midi,
    targetMidi: curItem?.midi ?? -1,
    midiFixedOffset: midiFixedOffset,
    midiAdsorbedOffset: midiAdsorbedOffset,
    midi: result.midi,
    fixedMidi,
    adsorbedMidi,
    playedMap: playedMap,
    score
  };
  // 回调出去
  progressCallback?.(data);

  preMidi = result.midi;
  preFixedMidi = fixedMidi;
  preAbsorbedMidi = adsorbedMidi;
}
/*
 * midi转频率
 * */
// function midiToFrequency(midi: number) {
//   if (midi < 0) return 0;
//   return 440 * Math.pow(2, (midi - 69) / 12);
// }
/*
 * 音准评分
 * */
// function midiToScore(midi: number, targetMidi: number) {
//   if (midi <= 0 || midi > 128) return 0;
//   if (targetMidi <= 0 || targetMidi > 128) return 0;
//
//   if (diffCents <= 10) return 100;
//   if (diffCents >= 100) return 0;
//   return Math.round(100 - ((diffCents - 10) / 90) * 100);
// }

/**
 * Unit256 换算：四分音符=64，时长=64/64*60/bpm
 * 反推：elapsed(sec) -> unit256 = elapsed * 64 * bpm / 60
 */
function secondsToUnit256(seconds: number, bpm: number) {
  return (seconds * 64 * bpm) / 60;
}

/**
 * midi合法性检测
 */
function validMidi(midi: number | string) {
  if (typeof midi !== 'number') return false;
  if (midi <= 0 || midi > 128) return false;

  return true;
}

/** 单段归一化为 [start,end]，start<=end */
function segmentBounds(seg: number[]): { start: number; end: number } | null {
  if (!seg || seg.length < 2) return null;
  const a = seg[0];
  const b = seg[1];
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/**
 * 每个 midi 键上，playMap 与 playedMap 中所有 [start,end] 两两求时间轴交集长度并累加（Unit256）
 */
function pitchIntersectionUnit256(
  play: Map<number, number[][]>,
  played: Map<number, number[][]>
): number {
  let sum = 0;
  for (const [midi, playSegs] of play.entries()) {
    const playedSegs = played.get(midi);
    if (!playedSegs?.length || !playSegs.length) continue;
    for (const ps of playSegs) {
      const P = segmentBounds(ps);
      if (!P) continue;
      for (const ts of playedSegs) {
        const T = segmentBounds(ts);
        if (!T) continue;
        const t0 = Math.max(P.start, T.start);
        const t1 = Math.min(P.end, T.end);
        sum += Math.max(0, t1 - t0);
      }
    }
  }
  return sum;
}
