/**
 * dr-edit 对外 API：按锚点增删复谱表/单谱表/小节（纯数据，无 UI）。
 * 自定义编辑形态可直接使用；标准交互见 editHelper/useRenderEdit。
 */
import type {GrandStaff, Measure, MusicScore, SingleStaff} from '@deciphony/renderer';
import type {MusicScoreTypeEnum} from '@deciphony/renderer';
import {
  indexOfGrandStaff,
  indexOfMeasure,
  indexOfSingleStaff,
  insertGrandStaff as spliceGrandStaff,
  insertSingleStaff as spliceSingleStaff,
  insertMeasure as spliceMeasure,
  removeGrandStaff,
  removeMeasure,
  removeSingleStaff,
} from './score-builder';

// =================================复谱表（挂在曲谱上，需要 score）========================================

export function addGrandStaff(score: MusicScore): GrandStaff {
  return spliceGrandStaff(score, score.grandStaffs.length);
}

export function insertGrandStaff(
  score: MusicScore,
  anchor: GrandStaff,
  position: 'before' | 'after',
): GrandStaff {
  const idx = indexOfGrandStaff(score, anchor);
  if (idx < 0) throw new Error('复谱表不属于该曲谱');
  const at = position === 'before' ? idx : idx + 1;
  return spliceGrandStaff(score, at);
}

export function deleteGrandStaff(score: MusicScore, target: GrandStaff): void {
  const idx = indexOfGrandStaff(score, target);
  if (idx < 0) throw new Error('复谱表不属于该曲谱');
  removeGrandStaff(score, idx);
}

// =================================单谱表（挂在复谱表上）========================================

export function insertSingleStaff(
  grandStaff: GrandStaff,
  anchor: SingleStaff,
  position: 'before' | 'after',
  options?: {notationType?: MusicScoreTypeEnum},
): SingleStaff {
  const idx = indexOfSingleStaff(grandStaff, anchor);
  if (idx < 0) throw new Error('单谱表不属于该复谱表');
  const at = position === 'before' ? idx : idx + 1;
  return spliceSingleStaff(grandStaff, at, options);
}

export function addSingleStaff(
  grandStaff: GrandStaff,
  options?: {notationType?: MusicScoreTypeEnum},
): SingleStaff {
  return spliceSingleStaff(grandStaff, grandStaff.staves.length, options);
}

export function deleteSingleStaff(grandStaff: GrandStaff, target: SingleStaff): void {
  const idx = indexOfSingleStaff(grandStaff, target);
  if (idx < 0) throw new Error('单谱表不属于该复谱表');
  removeSingleStaff(grandStaff, idx);
}

// =================================小节（挂在单谱表上）========================================

export function insertMeasure(
  singleStaff: SingleStaff,
  anchor: Measure,
  position: 'before' | 'after',
  options?: {notationType?: MusicScoreTypeEnum},
): Measure {
  const idx = indexOfMeasure(singleStaff, anchor);
  if (idx < 0) throw new Error('小节不属于该单谱表');
  const at = position === 'before' ? idx : idx + 1;
  return spliceMeasure(singleStaff, at, options);
}

export function addMeasure(
  singleStaff: SingleStaff,
  options?: {notationType?: MusicScoreTypeEnum},
): Measure {
  return spliceMeasure(singleStaff, singleStaff.measures.length, options);
}

export function deleteMeasure(singleStaff: SingleStaff, target: Measure): void {
  const idx = indexOfMeasure(singleStaff, target);
  if (idx < 0) throw new Error('小节不属于该单谱表');
  removeMeasure(singleStaff, idx);
}

// =================================音符操作========================================
// 五线 / 简谱音符见 score-builder。吉他谱与尤克里里谱共用下列 API（弦数 6 / 4）。

export {
    appendTabNoteInfo,
    createTabNote,
    createTabRest,
    ensureTabNoteChord,
    insertTabNote,
    insertTabRest,
    isTabHeadInfo,
    locateTabBendById,
    locateTabNoteInfoById,
    setSlurType,
    setTabNoteChord,
    setTabNoteInfoBeamType,
    setTabNoteInfoBend,
    setTabNoteInfoRegion,
    setTabNoteInfoRegionRange,
    setTabNoteInfoValue,
    setTabNoteSlap,
    tabStringCount,
} from './score-builder/tabNote'

// 鼓谱：notes 为上下声部 {up, down}；音符与休止符时值均 ≤ 四分
export {
    DRUM_CHRONAXIES,
    DRUM_MAX_CHRONAXIE,
    DRUM_REST_DEFAULT_REGION,
    appendDrumNote,
    appendDrumNotesInfo,
    appendDrumRest,
    clampDrumChronaxie,
    computeDrumVoiceOnsetBefore,
    createDrumNote,
    createDrumNotesInfo,
    createDrumRest,
    drumSlotDuration,
    ensureMeasureVoices,
    getDrumVoiceSlots,
    insertDrumNote,
    insertDrumRest,
    isDrumNoteBody,
    isDrumNotesInfo,
    isDrumRestBody,
    locateDrumNotesInfoById,
    locateDrumRestById,
    removeDrumNotesInfo,
    removeDrumRest,
    removeDrumSlot,
    setDrumNoteAugmentationDot,
    setDrumNoteBeamType,
    setDrumNoteChronaxie,
    setDrumNotesInfoGhost,
    setDrumNotesInfoHeadType,
    setDrumNotesInfoRegion,
    setDrumRestAugmentationDot,
    setDrumRestChronaxie,
    setDrumRestRegion,
} from './score-builder/drumNote'
export type {
    CreateDrumNotesInfoOptions,
    CreateDrumRestOptions,
    DrumVoice,
    LocatedDrumNotesInfo,
    LocatedDrumRest,
} from './score-builder/drumNote'
