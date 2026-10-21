/**
 * 鼓谱符杠处理（按声部）。
 *
 * 整体流程：
 * 1. 在一个声部内扫描槽位，把相邻可连杠的音符分成若干组（符干方向即声部方向）；
 * 2. 每组：收集符干接点 → 算斜率 → 规划每根符杠线的绘制方式 → 拉长符干至符杠 → 生成符杠 VDom；
 * 3. 被连杠的音符移除符尾（符尾由符杠替代）。
 *
 * 符杠 VDom 以 noteBeam 标签输出，实际绘制由 beam.vue 根据 special.beam 渲染。
 */

import type {DrumNotationSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import type {DrumNote, MeasureNoteSlot} from "@/types/MusicScoreType";
import {BeamTypeEnum} from "@/enums/musicScoreEnum";
import {DrumNotationSkinKeyEnum} from "@/drumNotation/enums/drumNotationSkinKeyEnum";
import type {DrumVoice, NodeIdMap} from "../types";
import {BEAM_LINE_SPACING, BEAM_PARTIAL_SCALE, BEAM_THICKNESS, MIN_STEM_HEIGHT_RATIO} from "../constants";
import {chronaxieToBeamLineCount} from "../utils/skinKey";
import {computeBeamSlope} from "./beamSlope";
import {isDrumNote, slotSymbol} from "../utils/staffSlot";
import {markBeamLineRuns} from "@/render/beamLineRuns";

/** 连杠用的时值 / beamType 取首个 notesInfo（与五线谱声部组一致） */
function leadInfo(note: DrumNote) {
  return note.notesInfo[0];
}

/** 符杠连在「最靠符杠一侧」的音符符干上：up 取 region 最大，down 取 region 最小 */
function getExtremeNotesInfoId(note: DrumNote, direction: DrumVoice): string | undefined {
  if (note.notesInfo.length === 0) return undefined;
  const regions = note.notesInfo.map((n) => n.region);
  const extremeRegion = direction === 'up' ? Math.max(...regions) : Math.min(...regions);
  return note.notesInfo.find((n) => n.region === extremeRegion)?.id;
}

function drumNoteAt(slots: MeasureNoteSlot[], i: number): DrumNote | undefined {
  const slot = slots[i];
  if (!slot) return undefined;
  const sym = slotSymbol(slot);
  return isDrumNote(sym) && sym.notesInfo.length > 0 ? sym : undefined;
}

/**
 * 把声部内音符按视觉顺序（左→右）划分连杠组。
 *
 * 连杠条件（与相邻音符）：
 * - 双方时值 ≤ 32（有符尾，可连杠）；
 * - 当前音符 beamType ≠ None；
 * - 下一音符 beamType 不是 None / OnlyRight（OnlyRight 只连右侧，不能作为被连入的一端）。
 */
function buildBeamGroups(slots: MeasureNoteSlot[]): DrumNote[][] {
  const groups: DrumNote[][] = [];
  for (let i = 0; i < slots.length; i++) {
    const note = drumNoteAt(slots, i);
    if (!note) continue;
    const cur = leadInfo(note)!;
    const pre = drumNoteAt(slots, i - 1);
    const next = drumNoteAt(slots, i + 1);
    const preInfo = pre ? leadInfo(pre) : undefined;
    const nextInfo = next ? leadInfo(next) : undefined;
    const hasTail = cur.chronaxie <= 32;
    const canBeamWithNext = nextInfo && hasTail && nextInfo.chronaxie <= 32
      && cur.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(nextInfo.beamType);
    const canBeamWithPre = preInfo && preInfo.chronaxie <= 32 && hasTail
      && preInfo.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(cur.beamType);
    if (canBeamWithPre && groups.length > 0) {
      groups[groups.length - 1]!.push(note);
      continue;
    }
    if (canBeamWithNext) groups.push([note]);
  }
  return groups.filter((g) => g.length >= 2);
}

/** 返回移除的符尾数量（本小节符号区间随之缩短） */
export function processBeam(params: {
  slots: MeasureNoteSlot[];
  direction: DrumVoice;
  nodeIdMap: NodeIdMap;
  vDoms: VDom[];
  /** 本小节符号 VDom 在 vDoms 中的起始下标（push 符号前记录） */
  symbolVDomsStartIdx: number;
  symbolVDomsLength: number;
  skin: DrumNotationSkinPack;
  measureHeight: number;
  measureLineWidth: number;
  skinName?: string;
}): number {
  const {slots, direction, nodeIdMap, vDoms, symbolVDomsStartIdx, symbolVDomsLength, skin, measureHeight, measureLineWidth, skinName} = params;
  const skinNameForNodes = skinName ?? 'default';
  const minStemLength = MIN_STEM_HEIGHT_RATIO * (measureHeight - 5 * measureLineWidth);
  const beamGroups = buildBeamGroups(slots);

  const processBeamGroup = (group: DrumNote[]) => {
    // --- 1. 收集符干与符杠的接点（左→右）---
    const stemEnds: Array<{ x: number; y: number }> = [];
    for (const note of group) {
      const stemId = getExtremeNotesInfoId(note, direction);
      const stem = stemId ? nodeIdMap.get(stemId)?.noteStem : undefined;
      if (!stem) continue;
      stemEnds.push({x: stem.x, y: direction === 'up' ? stem.y : stem.y + stem.h});
    }
    if (stemEnds.length < 2) return;

    // --- 2. 斜率与符干半宽 ---
    const {inclination, anchor} = computeBeamSlope(stemEnds, direction);
    const stemSkin = skin[DrumNotationSkinKeyEnum.NoteStem];
    const stemHalfW = stemSkin ? stemSkin.w / 2 : 0;

    // --- 3. 规划每段符杠上各条线的绘制方式 ---
    const beamCounts = group.map((note) => chronaxieToBeamLineCount(leadInfo(note)!.chronaxie));
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

    // --- 4. 拉长符干，使符干顶端/底端到达符杠 ---
    for (const note of group) {
      const stemId = getExtremeNotesInfoId(note, direction);
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

    // --- 5. 为每个音符位置生成一段符杠 VDom ---
    const beamStart = vDoms.length;
    for (let j = 0; j < nStems; j++) {
      const leftX = j === 0 ? stemEnds[0]!.x : (stemEnds[j - 1]!.x + stemEnds[j]!.x) / 2;
      const rightX = j === nStems - 1 ? stemEnds[nStems - 1]!.x : (stemEnds[j]!.x + stemEnds[j + 1]!.x) / 2;
      const leftY = anchor.y + inclination * (leftX - anchor.x);
      const rightY = anchor.y + inclination * (rightX - anchor.x);
      vDoms.push({
        startPoint: {x: leftX + stemHalfW, y: leftY},
        endPoint: {x: rightX + stemHalfW, y: rightY},
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
        skinKey: DrumNotationSkinKeyEnum.NoteBeam,
        targetId: '',
        dataComment: '符杠',
      });
    }
    markBeamLineRuns(vDoms, beamStart);
  };

  for (const g of beamGroups) processBeamGroup(g);

  // --- 6. 移除被连杠音符的符尾 ---
  const beamedNoteHeadIds = new Set<string>(
    beamGroups.flat()
      .map((note) => getExtremeNotesInfoId(note, direction))
      .filter((id): id is string => id != null),
  );
  // 符号 VDom 区间为 [startIdx, endIdx)；不能用 vDoms.length 反推（其后还 push 了反复记号 / 附属 / 符杠）
  const startIdx = symbolVDomsStartIdx;
  const endIdx = symbolVDomsStartIdx + symbolVDomsLength;
  let removed = 0;
  for (let i = endIdx - 1; i >= startIdx; i--) {
    const node = vDoms[i];
    if (node.tag === 'noteTail' && node.targetId && beamedNoteHeadIds.has(node.targetId)) {
      vDoms.splice(i, 1);
      removed++;
    }
  }
  return removed;
}
