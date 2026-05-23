/**
 * 符杠处理：按符干方向分组、计算斜率、渲染符杠、调整符干、移除被连符杠音符的符尾
 */

import type {StandardStaffSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import {NoteSymbol} from "@/types/MusicScoreType";
import {NoteSymbolTypeEnum} from "@/enums/musicScoreEnum";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type {NodeIdMap} from "../types";
import {BEAM_LINE_SPACING, BEAM_PARTIAL_SCALE, BEAM_THICKNESS, MIN_STEM_HEIGHT_RATIO} from "../constants";
import {chronaxieToBeamLineCount} from "../utils/skinKey";
import {computeBeamSlope} from "./beamSlope";
import {getVoiceGroupForDirection} from "../utils/note";

type BeamGroupMember = { note: NoteSymbol; direction: 'up' | 'down' };

function getExtremeNotesInfoId(n: NoteSymbol, direction: 'up' | 'down'): string | undefined {
  if (n.type !== NoteSymbolTypeEnum.Note) return undefined;
  const group = getVoiceGroupForDirection(n, direction);
  if (!group || group.notesInfo.length === 0) return undefined;
  const directionUp = direction === 'up';
  const regions = group.notesInfo.map((no) => no.region);
  const extremeRegion = directionUp ? Math.max(...regions) : Math.min(...regions);
  return group.notesInfo.find((no) => no.region === extremeRegion)?.id;
}

function buildBeamGroups(measure: { notes: NoteSymbol[] }, direction: 'up' | 'down'): BeamGroupMember[][] {
  const groups: BeamGroupMember[][] = [];
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i];
    const group = getVoiceGroupForDirection(note, direction);
    const nextNote = i < measure.notes.length - 1 ? measure.notes[i + 1] : undefined;
    const nextGroup = nextNote ? getVoiceGroupForDirection(nextNote, direction) : undefined;
    if (!group || group.notesInfo.length === 0) continue;
    const hasTail = group.chronaxie <= 32;
    const preGroup = i > 0 ? getVoiceGroupForDirection(measure.notes[i - 1]!, direction) : undefined;
    const preHasTail = preGroup && preGroup.chronaxie <= 32;
    const nextHasTail = nextGroup && nextGroup.chronaxie <= 32;
    const canBeamWithNext = nextNote && nextGroup && hasTail && nextHasTail
      && group.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(nextGroup.beamType);
    const canBeamWithPre = preGroup && preHasTail && hasTail
      && preGroup.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(group.beamType);
    const member: BeamGroupMember = {note, direction};
    if (canBeamWithPre && groups.length > 0) {
      groups[groups.length - 1]!.push(member);
      continue;
    }
    if (canBeamWithNext) groups.push([member]);
  }
  return groups.filter((g) => g.length >= 2);
}

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
  const processBeamGroup = (group: BeamGroupMember[], direction: 'up' | 'down') => {
    const stemEnds: Array<{ x: number; y: number }> = [];
    for (const {note, direction: dir} of group) {
      if (note.type !== NoteSymbolTypeEnum.Note) continue;
      const stemId = getExtremeNotesInfoId(note, dir);
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
    const beamCounts = group.map(({note, direction: dir}) => {
      const voiceGroup = getVoiceGroupForDirection(note, dir)!;
      return chronaxieToBeamLineCount(voiceGroup.chronaxie);
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
        if (leftmost >= 0) for (let i = nStems - 1; i >= 0; i--) if (beamCounts[i]! > L) {
          rightmost = i;
          break;
        }
        if (leftmost < 0 || seg < leftmost || seg > rightmost) {
          row.push({type: 'none'});
          continue;
        }
        if (leftmost === rightmost) {
          row.push({type: seg === 0 ? 'right' : seg === nStems - 1 ? 'left' : 'both', scaleX: BEAM_PARTIAL_SCALE});
        } else if (seg === leftmost) row.push({type: 'right'});
        else if (seg === rightmost) row.push({type: 'left'});
        else row.push({type: 'both'});
      }
      linesPerSegment.push(row);
    }
    for (const {note, direction: dir} of group) {
      const stemId = getExtremeNotesInfoId(note, dir);
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
      const leftX = j === 0 ? stemEnds[0]!.x : (stemEnds[j - 1]!.x + stemEnds[j]!.x) / 2;
      const rightX = j === nStems - 1 ? stemEnds[nStems - 1]!.x : (stemEnds[j]!.x + stemEnds[j + 1]!.x) / 2;
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
            lines: linesPerSegment[j]!,
            centerX: stemEnds[j]!.x + stemHalfW,
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
    ...beamGroupsUp.flat().map(({note, direction}) => getExtremeNotesInfoId(note, direction)).filter((id): id is string => id != null),
    ...beamGroupsDown.flat().map(({note, direction}) => getExtremeNotesInfoId(note, direction)).filter((id): id is string => id != null),
  ]);
  const startIdx = vDoms.length - symbolVDomsLength;
  for (let i = vDoms.length - 1; i >= startIdx; i--) {
    const node = vDoms[i];
    if (node.tag === 'noteTail' && node.targetId && beamedNoteHeadIds.has(node.targetId)) {
      vDoms.splice(i, 1);
    }
  }
}
