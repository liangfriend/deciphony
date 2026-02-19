/**
 * 符杠处理：按符干方向分组、计算斜率、渲染符杠、调整符干、移除被连符杠音符的符尾
 */

import type {StandardStaffSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import {NoteSymbol} from "@/types/MusicScoreType";
import {BeamTypeEnum} from "@/standardStaff/enums/standardStaffEnum";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type {NodeIdMap} from "../types";
import {BEAM_LINE_SPACING, BEAM_THICKNESS, MIN_STEM_HEIGHT_RATIO} from "../constants";
import {chronaxieToBeamLineCount} from "../utils/skinKey";
import {computeBeamSlope} from "./beamSlope";

type BeamGroupMember = { note: NoteSymbol; voice: 1 | 2 };

function getExtremeNotesInfoId(n: NoteSymbol, voice: 1 | 2): string | undefined {
  const beat = voice === 1 ? n.voicePart1[0] : n.voicePart2[0];
  if (!beat || beat.notesInfo.length === 0) return undefined;
  const directionUp = voice === 1 ? n.direction === 'up' : n.direction !== 'up';
  const regions = beat.notesInfo.map((no) => no.region);
  const extremeRegion = directionUp ? Math.max(...regions) : Math.min(...regions);
  return beat.notesInfo.find((no) => no.region === extremeRegion)?.id;
}

function getVoiceForDirection(n: NoteSymbol, direction: 'up' | 'down'): 1 | 2 {
  return n.direction === direction ? 1 : 2;
}

function getBeatForDirection(n: NoteSymbol, direction: 'up' | 'down') {
  const voice = getVoiceForDirection(n, direction);
  const beat = voice === 1 ? n.voicePart1[0] : n.voicePart2[0];
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
}): void {
  const {measure, nodeIdMap, vDoms, symbolVDomsLength, skin, measureHeight, measureLineWidth} = params;
  const minStemLength = MIN_STEM_HEIGHT_RATIO * (measureHeight - 5 * measureLineWidth);
  const beamGroupsUp = buildBeamGroups(measure, 'up');
  const beamGroupsDown = buildBeamGroups(measure, 'down');

  const processBeamGroup = (group: BeamGroupMember[], direction: 'up' | 'down') => {
    const stemEnds: Array<{ x: number; y: number }> = [];
    for (const {note, voice} of group) {
      const stemId = getExtremeNotesInfoId(note, voice);
      const stem = stemId ? nodeIdMap.get(stemId)?.noteStem : undefined;
      if (!stem) continue;
      const x = stem.x;
      const y = direction === 'up' ? stem.y : stem.y + stem.h;
      stemEnds.push({x, y});
    }
    if (stemEnds.length < 2) return;
    const {inclination, anchor} = computeBeamSlope(stemEnds, direction);
    const stemSkin = skin[StandardStaffSkinKeyEnum.NoteStem];
    const stemHalfW = stemSkin ? stemSkin.w / 2 : 0;
    const lineCount = Math.min(...group.map(({note, voice}) => {
      const beat = voice === 1 ? note.voicePart1[0] : note.voicePart2[0];
      return chronaxieToBeamLineCount(beat!.chronaxie);
    }));
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
    const nStems = stemEnds.length;
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
            lines: Array.from({length: lineCount}, () => ({})),
            spacing: BEAM_LINE_SPACING * measureHeight,
            thickness: BEAM_THICKNESS * measureHeight,
            direction,
          },
        },
        x: 0, y: 0, w: 0, h: 0,
        zIndex: 1001,
        tag: 'affiliation',
        skinName: 'default',
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
  for (let i = vDoms.length - 1; i >= startIdx; i--) {
    const node = vDoms[i];
    if (node.tag === 'noteTail' && node.targetId && beamedNoteHeadIds.has(node.targetId)) {
      vDoms.splice(i, 1);
    }
  }
}
