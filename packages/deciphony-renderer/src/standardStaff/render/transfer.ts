/*
 * 将 musicScore 转换为平铺的 vDom 列表
 * 计算并输出：复谱表、单谱表、13 个曲谱层面插槽
 * 小节及更细部分由调用方处理（m 插槽处预留空间）
 */

import {Skin, SkinPack, SlotConfig, SlotName, VDom, VDomTagType} from "@/types/common";
import {Measure, MusicScore, NoteSymbol} from "@/types/MusicScoreType";
import {BarlineTypeEnum, DoubleAffiliatedSymbolNameEnum, NoteSymbolTypeEnum, SkinKeyEnum} from "@/enums/musicScoreEnum";
import {defaultSkin} from "@/skins/defaultSkin";
import {BeamTypeEnum} from "@/standardStaff/enums/standardStaffEnum";

/** id -> 以 vDom.tag 为键的 VDom 对象，便于按 tag 查找同一 id 下的音符头/符干/符尾等 */
export type NodeIdMap = Map<string, Partial<Record<VDomTagType, VDom>>>;

function setNodeIdMap(map: NodeIdMap, id: string, vdom: VDom): void {
  let obj = map.get(id);
  if (!obj) {
    obj = {};
    map.set(id, obj);
  }
  obj[vdom.tag] = vdom;
}

function getSlotH(config: SlotConfig | undefined, name: SlotName): number {
  return config?.[name]?.h ?? 0;
}

function getSlotW(config: SlotConfig | undefined, name: SlotName): number {
  return config?.[name]?.w ?? 0;
}

/**
 * 将 musicScore 转换为平铺的 vDom 列表
 * @param musicScore 曲谱数据（纯展示数据，不含插槽配置）
 * @param slotConfig 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关
 * @param options 额外配置：measureHeight 控制小节高度，skin 用于符号宽高
 */
export function musicScoreToVDom(
    musicScore: MusicScore,
    slotConfig?: SlotConfig,
    options?: { measureHeight?: number; skin?: Skin },
): VDom[] {
  // 用于通过 id 快速查找，值为以 vDom.tag 为键的对象（如 note、noteStem、noteTail、affiliation）
  const nodeIdMap: NodeIdMap = new Map();


  const {width, grandStaffs} = musicScore;
  const config = slotConfig ?? {};
  const measureHeight = options?.measureHeight ?? 45;
  const skinPack: SkinPack = options?.skin?.default ?? defaultSkin;
  const vDoms: VDom[] = [];

  const gLW = getSlotW(config, 'g-l');
  const gRW = getSlotW(config, 'g-r');
  const sLW = getSlotW(config, 's-l');
  const sRW = getSlotW(config, 's-r');
  const grandStaffX = gLW + sLW;
  const grandStaffW = width - gLW - gRW - sLW - sRW;

  const gUH = getSlotH(config, 'g-u');
  const gDH = getSlotH(config, 'g-d');
  const sUH = getSlotH(config, 's-u');
  const sDH = getSlotH(config, 's-d');
  const mUH = getSlotH(config, 'm-u');
  const mDH = getSlotH(config, 'm-d');
  // 当前累加的y值总值
  let scoreCurrentY = 0;
  // 遍历复谱表
  for (const grandStaff of grandStaffs) {
    //复谱表内y值开始值
    const grandStaffStartY = scoreCurrentY;

    // 复谱表左侧插槽（先占位，高度稍后补全）
    let glSlot: VDom = {} as VDom
    if (gLW > 0) {
      glSlot = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: 0,
        y: grandStaffStartY,
        w: gLW,
        h: 0,
        zIndex: 1000,
        tag: 'slot',
        skinName: 'default',
        targetId: '',
        slotName: 'g-l',
        dataComment: '复谱表左侧插槽',
      }
      vDoms.push(glSlot);
    }
    let grSlot: VDom = {} as VDom
    if (gRW > 0) {
      grSlot = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: width - gRW,
        y: grandStaffStartY,
        w: gRW,
        h: 0,
        zIndex: 1000,
        tag: 'slot',
        skinName: 'default',
        targetId: '',
        slotName: 'g-r',
        dataComment: '复谱表右侧插槽',
      }
      vDoms.push(grSlot);
    }
    let grandStaffCurrentY = grandStaffStartY;
    vDoms.push({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: grandStaffX,
      y: grandStaffCurrentY,
      w: grandStaffW,
      h: grandStaff.uSpace,
      zIndex: 1000,
      tag: 'space',
      skinName: 'default',
      targetId: '',
      dataComment: '复谱表上边距',
    });
    grandStaffCurrentY += grandStaff.uSpace
    vDoms.push({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: grandStaffX,
      y: grandStaffCurrentY,
      w: grandStaffW,
      h: gUH,
      zIndex: 1000,
      tag: 'slot',
      skinName: 'default',
      targetId: '',
      slotName: 'g-u',
      dataComment: '复谱表上方插槽',
    });
    grandStaffCurrentY += gUH;
    // 遍历单谱表
    for (let i = 0; i < grandStaff.staves.length; i++) {

      //单谱表内y值开始值
      const singleStaffStartY = grandStaffStartY + grandStaffCurrentY;
      const staff = grandStaff.staves[i];
      // 单谱表上下内边距高度
      const staffUSpaceI = staff.uSpaceI
      const staffDSpaceI = staff.dSpaceI
      // 单谱表上下外边距高度
      const staffUSpaceO = staff.uSpaceO
      const staffDSpaceO = staff.dSpaceO

      // 单谱表内总小节宽度系数
      let totalWidthRatioForMeasure = 0
      for (let i = 0; i < staff.measures.length; i++) {
        const measure = staff.measures[i];
        totalWidthRatioForMeasure += getMeasureWidthRatio(measure)
      }

      const slSlot: VDom = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: gLW,
        y: singleStaffStartY,
        w: sLW,
        h: 0,
        zIndex: 1000,
        tag: 'slot',
        skinName: 'default',
        targetId: '',
        slotName: 's-l',
        dataComment: '单谱表左侧插槽',
      }
      vDoms.push(slSlot);
      const srSlot: VDom = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: width - gLW - gRW,
        y: singleStaffStartY,
        w: sRW,
        h: 0,
        zIndex: 1000,
        tag: 'slot',
        skinName: 'default',
        targetId: '',
        slotName: 's-r',
        dataComment: '单谱表右侧插槽',
      }
      vDoms.push(srSlot);
      vDoms.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: staffUSpaceO,
        zIndex: 1000,
        tag: 'space',
        skinName: 'default',
        targetId: '',
        dataComment: '单谱表上外边距',
      });
      grandStaffCurrentY += staffUSpaceO;

      vDoms.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: sUH,
        zIndex: 1000,
        tag: 'slot',
        skinName: 'default',
        targetId: '',
        slotName: 's-u',
        dataComment: '单谱表上方插槽',
      });
      grandStaffCurrentY += sUH;


      // 当前积累的横向宽度
      let measureCurrentX = grandStaffX
      for (let i = 0; i < staff.measures.length; i++) {
        const measure = staff.measures[i];
        // 获取小节宽度
        const measureWdith = getMeasureWidthRatio(measure) / totalWidthRatioForMeasure * grandStaffW
        const vdom: VDom = {
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: measureCurrentX,
          y: grandStaffCurrentY,
          w: measureWdith,
          h: mUH,
          zIndex: 1000,
          tag: 'slot',
          skinName: 'default',
          targetId: '',
          slotName: 'm-u',
          dataComment: '小节上方插槽',
        };
        vDoms.push(vdom);
        measureCurrentX += measureWdith
      }
      grandStaffCurrentY += mUH

      // 下面小节要复用，所以重置为grandStaffX
      measureCurrentX = grandStaffX

      vDoms.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: staffUSpaceI,
        zIndex: 1000,
        tag: 'space',
        skinName: 'default',
        targetId: '',
        dataComment: '单谱表上内边距',
      });
      grandStaffCurrentY += staffUSpaceI;

      for (let i = 0; i < staff.measures.length; i++) {
        const measure = staff.measures[i];
        const measureWdith = getMeasureWidthRatio(measure) / totalWidthRatioForMeasure * grandStaffW
        const vdom: VDom = {
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: measureCurrentX,
          y: grandStaffCurrentY,
          w: measureWdith,
          h: measureHeight,
          zIndex: 1000,
          tag: 'measure',
          skinName: 'default',
          targetId: measure.id,
          dataComment: '小节',
          skinKey: SkinKeyEnum.Measure,
        };
        vDoms.push(vdom);
        setNodeIdMap(nodeIdMap, measure.id, vdom);
        measureCurrentX += measureWdith
      }
      // 小节插槽是覆盖上去的，所以不会增加grandStaffCurrentY


      // 下面小节要复用，所以重置为grandStaffX
      measureCurrentX = grandStaffX

      // 小节插槽
      for (let i = 0; i < staff.measures.length; i++) {
        const measure = staff.measures[i];
        // 获取小节宽度
        const measureWdith = getMeasureWidthRatio(measure) / totalWidthRatioForMeasure * grandStaffW
        // 小节符号渲染（前置谱号→前置调号→前置拍号→音符→后置谱号→小节线→后置调号→后置拍号）
        const symbolVDoms = renderSymbol({
          measure,
          measureX: measureCurrentX,
          measureY: grandStaffCurrentY,
          measureWidth: measureWdith,
          measureHeight,
          skin: skinPack,
          idMap: nodeIdMap
        });
        vDoms.push(...symbolVDoms);
        // ================================================== beam =======================================================
        // 1. 获取音符组：符杠方向相同 & 有符尾(chronaxie<=32) & beamType 正确
        const beamGroups: NoteSymbol[][] = [];
        for (let i = 0; i < measure.notes.length; i++) {
          const note = measure.notes[i];
          const preNote = measure.notes[i - 1];
          const nextNote = measure.notes[i + 1];
          const hasTail = note.chronaxie <= 32;
          const preHasTail = preNote?.chronaxie <= 32;
          const nextHasTail = nextNote?.chronaxie <= 32;
          const canBeamWithNext = nextNote && note.type === NoteSymbolTypeEnum.Note && nextNote.type === NoteSymbolTypeEnum.Note
              && hasTail && nextHasTail && note.direction === nextNote.direction
              && note.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(nextNote.beamType);
          const canBeamWithPre = preNote && preNote.direction === note.direction && preHasTail && hasTail
              && preNote.beamType !== BeamTypeEnum.None && ![BeamTypeEnum.None, BeamTypeEnum.OnlyRight].includes(note.beamType);

          if (canBeamWithPre && beamGroups.length > 0) {
            beamGroups[beamGroups.length - 1].push(note);
            continue;
          }
          if (canBeamWithNext) {
            beamGroups.push([note]);
          }
        }
        const beamGroupsFiltered = beamGroups.filter(g => g.length >= 2);
        // 2. 计算符杠斜率（逐个「第 k 与最后」取倾斜度最小，再限制 ±30°）
        const minStemLength = MIN_STEM_HEIGHT_RATIO * measureHeight;
        for (const group of beamGroupsFiltered) {
          const direction = group[0].direction;
          const stemEnds: Array<{ x: number; y: number }> = [];
          for (const note of group) {
            const stem = nodeIdMap.get(note.id)?.noteStem;
            if (!stem) continue;
            const x = stem.x;
            const y = direction === 'up' ? stem.y : stem.y + stem.h;
            stemEnds.push({x, y});
          }
          if (stemEnds.length < 2) continue;
          const {inclination, anchor} = computeBeamSlope(stemEnds, direction);
          const firstX = stemEnds[0].x;
          const firstY = stemEnds[0].y;

          // 3. 按 x 计算符杠上的 y，更新符干 vdom：符干从音符头接到符杠，h = 头心到符杠的距离，y = 符杠端（上）或头心（下）
          for (const note of group) {
            const stem = nodeIdMap.get(note.id)?.noteStem as VDom | undefined;
            const noteVDom = nodeIdMap.get(note.id)?.note;
            if (!stem || !noteVDom) continue;
            const headCenterY = noteVDom.y + noteVDom.h / 2;
            const stemX = stem.x;
            const beamY = anchor.y + inclination * (stemX - anchor.x);
            if (direction === 'up') {
              const desiredH = headCenterY - beamY;

              stem.h = Math.max(desiredH, minStemLength);
              stem.y = headCenterY - stem.h;

            } else {
              const desiredH = beamY - headCenterY;
              stem.h = Math.max(desiredH, minStemLength);
              stem.y = headCenterY;
            }
          }
        }

        // 使用符杠时去掉组内音符的单独符尾（符杠替代符尾）
        const beamedNoteIds = new Set(beamGroupsFiltered.flat().map(n => n.id));
        const startIdx = vDoms.length - symbolVDoms.length;
        for (let i = vDoms.length - 1; i >= startIdx; i--) {
          const node = vDoms[i];
          if (node.tag === 'noteTail' && beamedNoteIds.has(node.targetId)) {
            vDoms.splice(i, 1);
          }
        }

        // 4. 计算音符要渲染的符杠条数，每条的模式

        // 5. 渲染符干

        vDoms.push({
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: measureCurrentX,
          y: grandStaffCurrentY,
          w: measureWdith,
          h: measureHeight,
          zIndex: 1000,
          tag: 'slot',
          skinName: 'default',
          targetId: '',
          slotName: 'm',
          dataComment: '小节插槽',
        });
        measureCurrentX += measureWdith
      }
      grandStaffCurrentY += measureHeight;

      // 下面小节要复用，所以重置为grandStaffX
      measureCurrentX = grandStaffX

      // 单谱表下内边距
      vDoms.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: staffDSpaceI,
        zIndex: 1000,
        tag: 'space',
        skinName: 'default',
        targetId: '',
        dataComment: '单谱表下内边距',
      });
      grandStaffCurrentY += staffDSpaceI;

      // 小节下插槽
      for (let i = 0; i < staff.measures.length; i++) {
        const measure = staff.measures[i];
        // 获取小节宽度
        const measureWdith = getMeasureWidthRatio(measure) / totalWidthRatioForMeasure * grandStaffW
        vDoms.push({
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: measureCurrentX,
          y: grandStaffCurrentY,
          w: measureWdith,
          h: mDH,
          zIndex: 1000,
          tag: 'slot',
          skinName: 'default',
          targetId: '',
          slotName: 'm-d',
          dataComment: '小节下方插槽',
        });
        measureCurrentX += measureWdith
      }
      grandStaffCurrentY += mDH

      // 没有用到的地方了，但还是重置一下，保持规范
      measureCurrentX = grandStaffX

      vDoms.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: sDH,
        zIndex: 1000,
        tag: 'slot',
        skinName: 'default',
        targetId: '',
        slotName: 's-d',
        dataComment: '单谱表下方插槽',
      });
      grandStaffCurrentY += sDH;

      vDoms.push({
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: grandStaffX,
        y: grandStaffCurrentY,
        w: grandStaffW,
        h: staffDSpaceO,
        zIndex: 1000,
        tag: 'space',
        skinName: 'default',
        targetId: '',
        dataComment: '单谱表下外边距',
      });
      grandStaffCurrentY += staffDSpaceO;
      slSlot.h = grandStaffCurrentY - singleStaffStartY
      srSlot.h = grandStaffCurrentY - singleStaffStartY
    }

    vDoms.push({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: grandStaffX,
      y: grandStaffCurrentY,
      w: grandStaffW,
      h: gDH,
      zIndex: 1000,
      tag: 'slot',
      skinName: 'default',
      targetId: '',
      slotName: 'g-d',
      dataComment: '复谱表下方插槽',
    });
    grandStaffCurrentY += gDH;

    // 复谱表下边距
    vDoms.push({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: grandStaffX,
      y: grandStaffCurrentY,
      w: grandStaffW,
      h: grandStaff.dSpace,
      zIndex: 1000,
      tag: 'space',
      skinName: 'default',
      targetId: '',
      dataComment: '复谱表下边距',
    });
    grandStaffCurrentY += grandStaff.dSpace

    const grandStaffH = grandStaffCurrentY - grandStaffStartY;
    // 将当前复谱表y值更新到当前总值
    // 这个总值目前还没有用到
    scoreCurrentY = grandStaffCurrentY;


    // 补全 g-l、g-r 的高度
    if (gLW > 0) {
      glSlot.h = grandStaffH
    }
    if (gRW > 0) {
      grSlot.h = grandStaffH
    }
  }
  // double 附属型符号渲染（slur 等：起始/结束在对应音符中心点）
  renderDoubleAffiliatedSymbol({idMap: nodeIdMap, musicScore, VDoms: vDoms});
  return vDoms;
}

// 获取小节的宽度系数
function getMeasureWidthRatio(meausre: Measure) {
  let acc = 0
  // 小节本身的宽度系数
  acc += meausre.widthRatioForMeasure
  // 音符宽度系数
  for (let i = 0; i < meausre.notes.length; i++) {
    const item = meausre.notes[i];
    if (item.widthRatioForMeasure) {
      acc += item.widthRatioForMeasure
    }
  }
  // 小节线宽度系数
  if (meausre.barline) {
    acc += meausre.barline.widthRatioForMeasure
  }
  // 前置谱号宽度系数
  if (meausre.clef_f) {
    acc += meausre.clef_f.widthRatioForMeasure
  }
  // 后置谱号宽度系数
  if (meausre.clef_b) {
    acc += meausre.clef_b.widthRatioForMeasure
  }
  // 前置调号宽度系数
  if (meausre.keySignature_f) {
    acc += meausre.keySignature_f.widthRatioForMeasure
  }
  // 后置调号宽度系数
  if (meausre.keySignature_b) {
    acc += meausre.keySignature_b.widthRatioForMeasure
  }
  // 前置拍号宽度系数
  if (meausre.timeSignature_f) {
    acc += meausre.timeSignature_f.widthRatioForMeasure
  }
  // 后置拍号宽度系数
  if (meausre.timeSignature_b) {
    acc += meausre.timeSignature_b.widthRatioForMeasure
  }
  return acc
}

/** 小节线类型 -> skin 键 */
function getBarlineSkinKey(barlineType: BarlineTypeEnum): SkinKeyEnum {
  const map: Record<BarlineTypeEnum, SkinKeyEnum> = {
    [BarlineTypeEnum.Single_barline]: SkinKeyEnum.Single_barline,
    [BarlineTypeEnum.Double_barline]: SkinKeyEnum.Double_barline,
    [BarlineTypeEnum.StartRepeat_barline]: SkinKeyEnum.StartRepeat_barline,
    [BarlineTypeEnum.EndRepeat_barline]: SkinKeyEnum.EndRepeat_barline,
    [BarlineTypeEnum.Dashed_barline]: SkinKeyEnum.Dashed_barline,
    [BarlineTypeEnum.Final_barline]: SkinKeyEnum.Final_barline,
    [BarlineTypeEnum.Start_end_repeat_barline]: SkinKeyEnum.Start_end_repeat_barline,
    [BarlineTypeEnum.Dotted_barline]: SkinKeyEnum.Dotted_barline,
    [BarlineTypeEnum.Reverse_barline]: SkinKeyEnum.Reverse_barline,
    [BarlineTypeEnum.Heavy_barline]: SkinKeyEnum.Heavy_barline,
    [BarlineTypeEnum.Heavy_double_barline]: SkinKeyEnum.Heavy_double_barline,
  };
  return map[barlineType] ?? SkinKeyEnum.Single_barline;
}

/** 时值 chronaxie → 音符头皮肤（256=全 128=二分 64=四分，更短用四分头） */
function getNoteHeadSkinKey(chronaxie: number): SkinKeyEnum {
  if (chronaxie >= 256) return SkinKeyEnum.NoteHead_1;
  if (chronaxie >= 128) return SkinKeyEnum.NoteHead_2;
  return SkinKeyEnum.NoteHead_3;
}

/** 时值 chronaxie → 休止符皮肤（256→rest_1 全 … 1→rest_9） */
function getRestSkinKey(chronaxie: number): SkinKeyEnum {
  const map: Record<number, SkinKeyEnum> = {
    256: SkinKeyEnum.rest_1,
    128: SkinKeyEnum.rest_2,
    64: SkinKeyEnum.rest_3,
    32: SkinKeyEnum.rest_4,
    16: SkinKeyEnum.rest_5,
    8: SkinKeyEnum.rest_6,
    4: SkinKeyEnum.rest_7,
    2: SkinKeyEnum.rest_8,
    1: SkinKeyEnum.rest_9,
  };
  return map[chronaxie] ?? SkinKeyEnum.rest_4;
}

/** 时值 chronaxie ≤32（八分及更短）→ 符尾皮肤（32→NoteTail_1, 16→2, …, 1→6） */
function getNoteTailSkinKey(chronaxie: number): SkinKeyEnum {
  const map: Record<number, SkinKeyEnum> = {
    32: SkinKeyEnum.NoteTail_1,
    16: SkinKeyEnum.NoteTail_2,
    8: SkinKeyEnum.NoteTail_3,
    4: SkinKeyEnum.NoteTail_4,
    2: SkinKeyEnum.NoteTail_5,
    1: SkinKeyEnum.NoteTail_6,
  };
  return map[chronaxie] ?? SkinKeyEnum.NoteTail_1;
}

/** 一节高度（一线或一间的距离） */
const LINE_SPACING_RATIO = 1 / 8;

/** 符杠最大倾斜角度（度） */
const BEAM_MAX_SLOPE_DEG = 30;

/** 最小符干高度相对小节高度的比例（如 3/4 表示最小符干 = 3/4 * measureHeight） */
const MIN_STEM_HEIGHT_RATIO = 7 / 8;

/**
 * 符杠斜率：同一组音符依次「与尾部音符」连线，按三种情况取斜率（stemEnds 与符杠相接处：up=stem.y，down=stem.y+stem.h）。
 * 符干朝上时 y 越小表示符干离小节越远（越往上）。
 * 情况1：所有中间音符连线斜率均小于等于两侧连线，且小于最大斜率 → 斜率为两侧音符连线（首尾）。
 * 情况2：存在中间音符连线斜率大于两侧连线 → 斜率为 0（符杠平行于小节）。
 * 情况3：存在中间音符连线斜率大于两侧其一且该斜率小于最大斜率 → 斜率为该中间音符连线（当前与情况2 统一为：大于两侧则取 0）。
 */
function computeBeamSlope(stemEnds: Array<{ x: number; y: number }>, direction: 'up' | 'down'): {
  inclination: number,
  anchor: { x: number, y: number }
} {
  const n = stemEnds.length;
  const last = stemEnds[n - 1];
  const first = stemEnds[0];
  let curAnchor = null;
  // 判断如果中间有音符比两侧大，直接=0
  if (direction === 'up') {
    const minY = Math.min(first.y, last.y)

    for (let i = 1; i < (n - 1); i++) {
      const curStemPosition = stemEnds[i];
      if (curStemPosition.y <= minY) {
        if (!curAnchor) {
          curAnchor = {x: stemEnds[0].x, y: curStemPosition.y};
        } else if (curAnchor.y > curStemPosition.y) {
          curAnchor.y = curStemPosition.y;
        }
      }
    }
  } else { // 向下的情况
    const maxY = Math.min(first.y, last.y)
    for (let i = 1; i < (n - 1); i++) {
      const curStemPosition = stemEnds[i];
      if (curStemPosition.y >= maxY) {
        if (!curAnchor) {
          curAnchor = {x: stemEnds[0].x, y: curStemPosition.y};
        } else if (curAnchor.y > curStemPosition.y) {
          curAnchor.y = curStemPosition.y;
        }
      }
    }
  }
  // 存在中间音符远离度大于两侧音符的情况，直接返回0斜率
  if (curAnchor) {
    return {inclination: 0, anchor: curAnchor};
  }
  // 有音符大于两侧其一的情况
  let curInclination = (last.y - first.y) / (last.x - first.x)
  curAnchor = first
  // 最大斜率
  const maxSlope = Math.tan((BEAM_MAX_SLOPE_DEG * Math.PI) / 180); // tan30 = 0.57


  // 判断两端音符连线是上坡还是下坡
  let isNegative = curInclination < 0
  curAnchor = isNegative ? last : first
  for (let i = 1; i < (n - 1); i++) {

    const curStemPosition = stemEnds[i];
    // 下坡的情况
    if (!isNegative) {
      // 出现了上坡就直接continue
      if ((curStemPosition.y - first.y) < 0) continue
      // 斜率是正的，找出最小的那个
      curInclination = Math.min(curInclination, (curStemPosition.y - first.y) / (curStemPosition.x - first.x))
    } else { // 上坡的情况
      // 出现了下坡就直接continue
      if ((last.y - curStemPosition.y) > 0) continue
      // 斜率是负的，找出最小的那个
      curInclination = Math.max(curInclination, (last.y - curStemPosition.y) / (last.x - curStemPosition.x))
    }

  }
  return {inclination: curInclination, anchor: curAnchor};
}

/**
 * 符干高度：动态计算，最小为 3/4 小节高。
 * 仅当音符头明显超出中线（超过 3 个线间距）时才拉长：向上仅当在中线以上超 3 间距，向下仅当在中线以下超 3 间距。
 * 皮肤包中符干的 h 不使用。
 */
function getStemLength(params: {
  direction: 'up' | 'down';
  headCenterY: number;
  measureY: number;
  measureHeight: number;
}): number {
  const {direction, headCenterY, measureY, measureHeight} = params;
  const minStem = MIN_STEM_HEIGHT_RATIO * measureHeight;
  const staffCenterY = measureY + measureHeight / 2;
  const lineSpacing = measureHeight * LINE_SPACING_RATIO;
  // 现在是超过中线开始拉长，改动这个可以改变这个值
  const elongationThreshold = lineSpacing * 2
  if (direction === 'up') {
    if ((headCenterY - staffCenterY + elongationThreshold) < minStem) {
      return minStem
    } else {
      return (headCenterY - staffCenterY + elongationThreshold);
    }
  }
  if (direction === 'down') {
    if ((staffCenterY - headCenterY + elongationThreshold) < minStem) {
      return minStem
    } else {
      return (staffCenterY - headCenterY + elongationThreshold);
    }
  }
  return minStem;
}

/**
 * 符干与符尾：chronaxie < 256 出符干（全音符无符干），≤32 出符尾。符干高度由 getStemLength 动态计算（皮肤 h 无效）。
 * 后续可扩展 beam 等，此处仅单音符符干符尾。
 */
function renderStemAndTail(params: {
  note: NoteSymbol;
  headX: number;
  headY: number;
  headW: number;
  headH: number;
  measureY: number;
  measureHeight: number;
  skin: SkinPack;
  zIndex: number;
  idMap: NodeIdMap;
}): VDom[] {
  const {note, headX, headY, headW, headH, measureY, measureHeight, skin, zIndex} = params;
  const out: VDom[] = [];
  if (note.type === NoteSymbolTypeEnum.Rest || note.chronaxie >= 256) return out;

  const stemSkin = skin[SkinKeyEnum.NoteStem];
  if (!stemSkin) return out;

  const direction = note.direction;
  const headCenterY = headY + headH / 2;
  const stemLength = getStemLength({direction, headCenterY, measureY, measureHeight});
  const stemW = stemSkin.w;

  const targetId = note.id ?? '';
  if (direction === 'up') {
    const stemX = headX + headW - stemW;
    const stemY = headCenterY - stemLength;
    out.push({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: stemX,
      y: stemY,
      w: stemW,
      h: stemLength,
      zIndex,
      tag: 'noteStem',
      skinName: 'default',
      targetId: targetId,
      skinKey: SkinKeyEnum.NoteStem,
      dataComment: '符干',
    });
    if (note.chronaxie <= 32) {
      const tailSkin = skin[getNoteTailSkinKey(note.chronaxie)];
      if (tailSkin) {
        out.push({
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: stemX,
          y: stemY,
          w: tailSkin.w,
          h: tailSkin.h,
          zIndex,
          tag: 'noteTail',
          skinName: 'default',
          targetId: targetId,
          skinKey: getNoteTailSkinKey(note.chronaxie),
          dataComment: '符尾',
        });
      }
    }
  } else {
    const stemX = headX;
    const stemY = headCenterY;
    out.push({
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x: stemX,
      y: stemY,
      w: stemW,
      h: stemLength,
      zIndex,
      tag: 'noteStem',
      skinName: 'default',
      targetId: targetId,
      skinKey: SkinKeyEnum.NoteStem,
      dataComment: '符干',
    });
    if (note.chronaxie <= 32) {
      const tailSkin = skin[getNoteTailSkinKey(note.chronaxie)];
      if (tailSkin) {
        out.push({
          startPoint: {x: 0, y: 0},
          endPoint: {x: 0, y: 0},
          special: {},
          x: stemX,
          y: stemY + stemLength - tailSkin.h,
          w: tailSkin.w,
          h: tailSkin.h,
          zIndex,
          tag: 'noteTail',
          skinName: 'default',
          targetId: targetId,
          skinKey: getNoteTailSkinKey(note.chronaxie),
          dataComment: '符尾',
        });
      }
    }
  }
  return out;
}

type RenderSymbolParams = {
  measure: Measure;
  measureX: number;
  measureY: number;
  measureWidth: number;
  measureHeight: number;
  skin: SkinPack;
  idMap: NodeIdMap;
};

/**
 * 小节上符号的渲染顺序：前置谱号 → 前置调号 → 前置拍号 → 音符（宽度域内均匀分布）→ 后置谱号 → 小节线 → 后置调号 → 后置拍号
 * 前置/后置符号无宽度域，按皮肤宽从左/右依次排布；音符有宽度域，按 widthRatio 比例在域内均匀分布，音符头在各自子域内居中。
 */
function renderSymbol(params: RenderSymbolParams): VDom[] {
  const {measure, measureX, measureY, measureWidth, measureHeight, skin, idMap} = params;
  const out: VDom[] = [];
  const z = 1001;

  type RightPart = { skinKey: SkinKeyEnum; tag: VDom['tag']; dataComment: string; targetId: string };

  // 1. 前置符号宽度（无宽度域，固定皮肤宽）
  let prefixW = 0;
  if (measure.clef_f) {
    const item = skin[SkinKeyEnum.Treble];
    if (item) prefixW += item.w;
  }
  if (measure.keySignature_f) {
    const item = skin[SkinKeyEnum.Sharp];
    if (item) prefixW += item.w;
  }
  if (measure.timeSignature_f) {
    const item = skin[SkinKeyEnum['4_4']];
    if (item) prefixW += item.w;
  }

  // 2. 后置符号宽度（无宽度域，固定皮肤宽）
  const rightParts: RightPart[] = [];
  if (measure.clef_b) {
    const vdom: RightPart = {
      skinKey: SkinKeyEnum.Treble,
      tag: 'clef_b',
      dataComment: '后置谱号',
      targetId: measure.clef_b.id ?? ''
    };
    rightParts.push(vdom);
  }
  if (measure.barline) {
    const vdom: RightPart = {
      skinKey: getBarlineSkinKey(measure.barline.barlineType),
      tag: 'barline',
      dataComment: '小节线',
      targetId: measure.barline.id ?? ''
    };
    rightParts.push(vdom);
  }
  if (measure.keySignature_b) {
    const vdom: RightPart = {
      skinKey: SkinKeyEnum.Sharp,
      tag: 'keySignature_b',
      dataComment: '后置调号',
      targetId: measure.keySignature_b.id ?? ''
    };
    rightParts.push(vdom);
  }
  if (measure.timeSignature_b) {
    const vdom: RightPart = {
      skinKey: SkinKeyEnum['4_4'],
      tag: 'timeSignature_b',
      dataComment: '后置拍号',
      targetId: measure.timeSignature_b.id ?? ''
    };
    rightParts.push(vdom);
  }
  let suffixW = 0;
  for (const p of rightParts) {
    const item = skin[p.skinKey];
    if (item) suffixW += item.w;
  }

  // 3. 音符宽度域 = 小节宽度 - 前置 - 后置
  const noteDomainW = Math.max(0, measureWidth - prefixW - suffixW);

  const pushSymbol = (x: number, skinKey: SkinKeyEnum, tag: VDom['tag'], dataComment: string, targetId: string) => {
    const item = skin[skinKey];
    if (!item) return;
    const y = measureY + (measureHeight - item.h) / 2;
    const vdom: VDom = {
      startPoint: {x: 0, y: 0},
      endPoint: {x: 0, y: 0},
      special: {},
      x, y, w: item.w, h: item.h, zIndex: z, tag, skinName: 'default', targetId, skinKey, dataComment
    };
    out.push(vdom);
    if (targetId) {
      setNodeIdMap(idMap, targetId, vdom);
    }
  };

  // 4. 输出前置符号（从左向右）
  let x = measureX;
  if (measure.clef_f) {
    pushSymbol(x, SkinKeyEnum.Treble, 'clef_f', '前置谱号', measure.clef_f.id ?? '');
    const item = skin[SkinKeyEnum.Treble];
    if (item) x += item.w;
  }
  if (measure.keySignature_f) {
    pushSymbol(x, SkinKeyEnum.Sharp, 'keySignature_f', '前置调号', measure.keySignature_f.id ?? '');
    const item = skin[SkinKeyEnum.Sharp];
    if (item) x += item.w;
  }
  if (measure.timeSignature_f) {
    pushSymbol(x, SkinKeyEnum['4_4'], 'timeSignature_f', '前置拍号', measure.timeSignature_f.id ?? '');
    const item = skin[SkinKeyEnum['4_4']];
    if (item) x += item.w;
  }

  // 5. 音符：在宽度域内按 widthRatio 比例均匀分布，音符头在各自子域内居中
  const notes = measure.notes;
  const totalNoteRatio = notes.reduce((sum, n) => sum + (n.widthRatioForMeasure || n.widthRatio || 0), 0);
  const domainStartX = measureX + prefixW;
  // region：0 第一线、1 第一间… 越大越高（y 越小），与 NoteSymbol.region 注释一致
  const noteCenterY = (region: number) =>
      measureY + measureHeight - region * (measureHeight / 8);
  const useEqualSlots = notes.length > 0 && totalNoteRatio <= 0;

  if (notes.length > 0) {
    let accRatio = 0;
    const slotWidth = useEqualSlots ? noteDomainW / notes.length : 0;
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const nextNote = notes[i + 1];
      const ratio = useEqualSlots ? 1 : (note.widthRatioForMeasure || note.widthRatio || 0);
      const slotW = useEqualSlots ? slotWidth : (ratio / totalNoteRatio) * noteDomainW;
      const slotStartX = domainStartX + (useEqualSlots ? i * slotWidth : (accRatio / totalNoteRatio) * noteDomainW);
      if (!useEqualSlots) accRatio += ratio;
      const isRest = note.type === NoteSymbolTypeEnum.Rest;
      const headKey = isRest ? getRestSkinKey(note.chronaxie) : getNoteHeadSkinKey(note.chronaxie);
      const item = skin[headKey];
      if (!item) continue;
      const tag: VDom['tag'] = isRest ? 'rest' : 'note';
      const dataComment = isRest ? '休止符' : '音符';
      const ny = isRest
          ? measureY + (measureHeight - item.h) / 2
          : noteCenterY(note.region) - item.h / 2;
      const headX = slotStartX + (slotW - item.w) / 2;
      const vdom: VDom = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {},
        x: headX,
        y: ny,
        w: item.w,
        h: item.h,
        zIndex: z,
        tag,
        skinName: 'default',
        targetId: note.id,
        skinKey: headKey,
        dataComment,
      }
      out.push(vdom);
      setNodeIdMap(idMap, note.id, vdom);
      if (!isRest) {
        const stemTailVDoms = renderStemAndTail({
          note,
          headX,
          headY: ny,
          headW: item.w,
          headH: item.h,
          measureY,
          measureHeight,
          skin,
          zIndex: z,
          idMap,
        });
        for (let i = 0; i < stemTailVDoms.length; i++) {
          const v = stemTailVDoms[i];
          out.push(v);
          // 符干、符尾按 tag 存入 nodeIdMap（同一 note.id 下 noteStem / noteTail）
          if (v.targetId) setNodeIdMap(idMap, v.targetId, v);
        }
      }
    }
  }

  // 6. 输出后置符号（从右向左紧贴小节右端）
  x = measureX + measureWidth - suffixW;
  for (const p of rightParts) {
    pushSymbol(x, p.skinKey, p.tag, p.dataComment, p.targetId);
    const item = skin[p.skinKey];
    if (item) x += item.w;
  }

  return out;
}

type RenderDoubleAffiliatedSymbolParams = {
  musicScore: MusicScore,
  VDoms: VDom[]
  idMap: NodeIdMap,
};

function renderDoubleAffiliatedSymbol(params: RenderDoubleAffiliatedSymbolParams) {
  const {musicScore, idMap, VDoms} = params;
  const symbols = musicScore.affiliatedSymbols ?? [];
  for (let i = 0; i < symbols.length; i++) {
    const affiliatedSymbol = symbols[i];
    if (affiliatedSymbol.name === DoubleAffiliatedSymbolNameEnum.slur) {
      const startNote = idMap.get(affiliatedSymbol.startId)?.note;
      const endNote = idMap.get(affiliatedSymbol.endId)?.note;
      if (!startNote || !endNote) continue;
      const slurData = affiliatedSymbol.data?.slur;
      const relStart = slurData?.relativeStartPoint ?? {x: 0, y: 0};
      const relEnd = slurData?.relativeEndPoint ?? {x: 0, y: 0};
      // 起始点和结束点 = 音符中心 + data.slur 相对偏移（附属型符号ui规则）
      const startPoint = {
        x: startNote.x + startNote.w / 2 + relStart.x,
        y: startNote.y + startNote.h / 2 + relStart.y,
      };
      const endPoint = {
        x: endNote.x + endNote.w / 2 + relEnd.x,
        y: endNote.y + endNote.h / 2 + relEnd.y,
      };
      const defaultSlur = {
        relativeStartPoint: {x: 0, y: 0},
        relativeEndPoint: {x: 0, y: 0},
        relativeControlPoint: {x: 0, y: 0},
        thickness: 2,
      };
      const slurVDom: VDom = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        startPoint,
        endPoint,
        targetId: affiliatedSymbol.id,
        zIndex: 1001,
        tag: 'affiliation',
        skinName: 'default',
        dataComment: '连音线',
        special: {
          slur: slurData ? JSON.parse(JSON.stringify(slurData)) : defaultSlur,
        },
      };
      VDoms.push(slurVDom);
    }
    if (affiliatedSymbol.name === DoubleAffiliatedSymbolNameEnum.volta) {
      // volta：小节上方紧贴，宽度=小节宽，高度=measureHeight；relativeW/relativeH 生效（附属型符号ui规则）
      const measureVDom = idMap.get(affiliatedSymbol.startId)?.measure;
      if (!measureVDom) continue;
      const measureH = measureVDom.h;
      const voltaW = measureVDom.w + (affiliatedSymbol.relativeW ?? 0);
      // 默认高度1/2小节高度
      const voltaH = measureH / 2 + (affiliatedSymbol.relativeH ?? 0);
      const voltaX = measureVDom.x + (affiliatedSymbol.relativeX ?? 0);
      const voltaY = measureVDom.y - voltaH;
      const voltaVDom: VDom = {
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {volta: affiliatedSymbol.data?.volta ?? {}},
        x: voltaX,
        y: voltaY,
        w: voltaW,
        h: voltaH,
        zIndex: 1001,
        tag: 'affiliation',
        skinName: 'default',
        targetId: affiliatedSymbol.id,
        dataComment: '反复房子',
      };
      VDoms.push(voltaVDom);
    }
  }
}