/**
 * 符杠处理：按符干方向分组、计算斜率、渲染符杠、调整符干、移除被连符杠音符的符尾
 */

import type {StandardStaffSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import {NoteSymbol} from "@/types/MusicScoreType";
import {NoteSymbolTypeEnum} from "@/enums/musicScoreEnum";
import {BeamTypeEnum} from "@/standardStaff/enums/standardStaffEnum";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type {NodeIdMap} from "../types";
import {BEAM_LINE_SPACING, BEAM_PARTIAL_SCALE, BEAM_THICKNESS, MIN_STEM_HEIGHT_RATIO} from "../constants";
import {chronaxieToBeamLineCount} from "../utils/skinKey";
import {computeBeamSlope} from "./beamSlope";

type BeamGroupMember = { note: NoteSymbol; voice: 1 | 2 };

// 找到一个和弦里符杠方向最高的音符
function getExtremeNotesInfoId(n: NoteSymbol, voice: 1 | 2): string | undefined {
  if (n.type !== NoteSymbolTypeEnum.Note) return undefined;
  const beat = voice === 1 ? n.voicePart : n.voicePart2;
  if (!beat || beat.notesInfo.length === 0) return undefined;
  const directionUp = voice === 1 ? n.direction === 'up' : n.direction !== 'up';
  const regions = beat.notesInfo.map((no) => no.region);
  const extremeRegion = directionUp ? Math.max(...regions) : Math.min(...regions);
  return beat.notesInfo.find((no) => no.region === extremeRegion)?.id;
}

function getVoiceForDirection(n: NoteSymbol & {
  type: 'Note';
  direction: 'up' | 'down'
}, direction: 'up' | 'down'): 1 | 2 {
  return n.direction === direction ? 1 : 2;
}

function getBeatForDirection(n: NoteSymbol, direction: 'up' | 'down') {
  if (n.type !== NoteSymbolTypeEnum.Note) return undefined;
  const voice = getVoiceForDirection(n, direction);
  const beat = voice === 1 ? n.voicePart : n.voicePart2;
  return beat?.notesInfo.length ? beat : undefined;
}

function buildBeamGroups(measure: { notes: NoteSymbol[] }, direction: 'up' | 'down'): BeamGroupMember[][] {
  const groups: BeamGroupMember[][] = [];
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i];
    const beat = getBeatForDirection(note, direction);
    const nextNote = i < measure.notes.length - 1 ? measure.notes[i + 1] : undefined;
    const nextBeat = nextNote ? getBeatForDirection(nextNote, direction) : undefined;
    if (!beat || beat.notesInfo.length === 0) continue;
    const hasTail = beat.chronaxie <= 32;
    const preBeat = i > 0 ? getBeatForDirection(measure.notes[i - 1], direction) : undefined;
    const preHasTail = preBeat && preBeat.chronaxie <= 32;
    const nextHasTail = nextBeat && nextBeat.chronaxie <= 32;
    const canBeamWithNext = nextNote && nextBeat && hasTail && nextHasTail
      && beat.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(nextBeat.beamType);
    const canBeamWithPre = preBeat && preHasTail && hasTail
      && preBeat.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(beat.beamType);
    const voice = getVoiceForDirection(note, direction);
    const member: BeamGroupMember = {note, voice};
    if (canBeamWithPre && groups.length > 0) {
      groups[groups.length - 1].push(member);
      continue;
    }
    if (canBeamWithNext) groups.push([member]);
  }
  return groups.filter((g) => g.length >= 2);
}

// 符杠的渲染函数，特别复杂！
export function processBeam(params: {
  measure: { notes: NoteSymbol[] };
  nodeIdMap: NodeIdMap;
  vDoms: VDom[];
  symbolVDomsLength: number;
  skin: StandardStaffSkinPack;
  measureHeight: number;
  measureLineWidth: number;
  skinName?: string;
}): void {
  const {measure, nodeIdMap, vDoms, symbolVDomsLength, skin, measureHeight, measureLineWidth, skinName} = params;
  const skinNameForNodes = skinName ?? 'default';
  const minStemLength = MIN_STEM_HEIGHT_RATIO * (measureHeight - 5 * measureLineWidth);
  const beamGroupsUp = buildBeamGroups(measure, 'up');
  const beamGroupsDown = buildBeamGroups(measure, 'down');
  // 渲染符杠
  const processBeamGroup = (group: BeamGroupMember[], direction: 'up' | 'down') => {
    const stemEnds: Array<{ x: number; y: number }> = [];
    // 找到符干的端点
    for (const {note, voice} of group) {
      if (note.type !== NoteSymbolTypeEnum.Note) continue;
      const stemId = getExtremeNotesInfoId(note, voice);
      const stem = stemId ? nodeIdMap.get(stemId)?.noteStem : undefined;
      if (!stem) continue;
      const x = stem.x;
      const y = direction === 'up' ? stem.y : stem.y + stem.h;
      stemEnds.push({x, y});
    }
    if (stemEnds.length < 2) return;
    // 得到斜率和锚点
    const {inclination, anchor} = computeBeamSlope(stemEnds, direction);
    const stemSkin = skin[StandardStaffSkinKeyEnum.NoteStem];
    const stemHalfW = stemSkin ? stemSkin.w / 2 : 0;
    // 需要渲染几条线：取组内最大，以支持“第一条全连、第二条半连”
    const beamCounts = group.map(({note, voice}) => {
      const beat = voice === 1 ? note.voicePart : note.voicePart2!;
      return chronaxieToBeamLineCount(beat.chronaxie);
    });
    const lineCount = Math.max(...beamCounts);
    const nStems = stemEnds.length;
    type BeamLineSpec = { type: 'left' | 'right' | 'both' | 'none'; scaleX?: number };
    const linesPerSegment: BeamLineSpec[][] = [];
    for (let seg = 0; seg < nStems; seg++) {
      const row: BeamLineSpec[] = [];
      for (let L = 0; L < lineCount; L++) {
        const leftmost = beamCounts.findIndex((c) => c > L);
        let rightmost = -1;
        if (leftmost >= 0) for (let i = nStems - 1; i >= 0; i--) if (beamCounts[i] > L) { rightmost = i; break; }
        if (leftmost < 0 || seg < leftmost || seg > rightmost) {
          row.push({ type: 'none' });
          continue;
        }
        if (leftmost === rightmost) {
          // 非全连：仅此段有该条杠，用 BEAM_PARTIAL_SCALE 向两侧收缩
          row.push({ type: seg === 0 ? 'right' : seg === nStems - 1 ? 'left' : 'both', scaleX: BEAM_PARTIAL_SCALE });
        } else if (seg === leftmost) row.push({ type: 'right' });
        else if (seg === rightmost) row.push({ type: 'left' });
        else row.push({ type: 'both' }); // 中间段全连，scaleX 默认 1
      }
      linesPerSegment.push(row);
    }
    // 中间的音符高的某些情况，两侧stem要进行延长
    for (const {note, voice} of group) {
      const stemId = getExtremeNotesInfoId(note, voice);
      const stem = stemId ? (nodeIdMap.get(stemId)?.noteStem as VDom | undefined) : undefined;
      if (!stem) continue;
      const beamY = anchor.y + inclination * (stem.x - anchor.x);
      const stemTop = stem.y;
      const stemBottom = stem.y + stem.h;
      if (direction === 'up') {
        stem.y = beamY;
        stem.h = Math.max(stemBottom - beamY, minStemLength);
      } else {
        stem.h = Math.max(beamY - stemTop, minStemLength);
      }
    }
    const overlap = 1;
    for (let j = 0; j < nStems; j++) {
      const leftX = j === 0 ? stemEnds[0].x : (stemEnds[j - 1].x + stemEnds[j].x) / 2;
      const rightX = j === nStems - 1 ? stemEnds[nStems - 1].x : (stemEnds[j].x + stemEnds[j + 1].x) / 2;
      const leftXAdj = j > 0 ? leftX - overlap : leftX;
      const rightXAdj = j < nStems - 1 ? rightX + overlap : rightX;
      const leftY = anchor.y + inclination * (leftXAdj - anchor.x);
      const rightY = anchor.y + inclination * (rightXAdj - anchor.x);
      const dx = stemHalfW;
      const dy = 0;
      vDoms.push({
        startPoint: {x: leftXAdj + dx, y: leftY + dy},
        endPoint: {x: rightXAdj + dx, y: rightY + dy},
        special: {
          beam: {
            lines: linesPerSegment[j],
            centerX: stemEnds[j].x + stemHalfW,
            spacing: BEAM_LINE_SPACING * measureHeight,
            thickness: BEAM_THICKNESS * measureHeight,
            direction,
          },
        },
        x: 0, y: 0, w: 0, h: 0,
        zIndex: 1200,
        tag: 'noteBeam',
        skinName: skinNameForNodes,
        targetId: '',
        dataComment: '符杠',
      });
    }
  };

  for (const g of beamGroupsUp) processBeamGroup(g, 'up');
  for (const g of beamGroupsDown) processBeamGroup(g, 'down');

  const beamedNoteHeadIds = new Set<string>([
    ...beamGroupsUp.flat().map(({
                                  note,
                                  voice
                                }) => getExtremeNotesInfoId(note, voice)).filter((id): id is string => id != null),
    ...beamGroupsDown.flat().map(({
                                    note,
                                    voice
                                  }) => getExtremeNotesInfoId(note, voice)).filter((id): id is string => id != null),
  ]);
  const startIdx = vDoms.length - symbolVDomsLength;
  // 去掉符尾
  for (let i = vDoms.length - 1; i >= startIdx; i--) {
    const node = vDoms[i];
    if (node.tag === 'noteTail' && node.targetId && beamedNoteHeadIds.has(node.targetId)) {
      vDoms.splice(i, 1);
    }
  }
}
