/**
 * @deciphony/extensions — @deciphony/renderer 扩展集合
 *
 * 推荐按子路径导入，避免 API 重名：
 *   import { drTitle } from '@deciphony/extensions/dr-title'
 *   import { createMusicScore } from '@deciphony/extensions/dr-edit/score-builder'
 *   import { insertMeasure } from '@deciphony/extensions/dr-edit'
 */

export * from './dr-title'
export * from './dr-lyrics'
export * from './dr-play'
export * from './dr-play-highlight'
export * from './dr-musicxml-transfer'
export * from './dr-numberNotation-transfer'
export * from './chord-builder'
export * from './audio-to-score'
export * from './scoreUtil'
export {
  transposeMusicScore,
  resolveScoreKeySignature,
  shiftMusicScoreBySemitones,
  type TransposeOptions,
  type ShiftSemitoneOptions,
} from './transpose'

// dr-edit 与 score-builder 存在同名函数（如 insertMeasure），请走子路径：
//   @deciphony/extensions/dr-edit
//   @deciphony/extensions/dr-edit/score-builder
