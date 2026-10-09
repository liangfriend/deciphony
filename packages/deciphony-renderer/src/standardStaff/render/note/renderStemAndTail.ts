import type {StandardStaffSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import {NoteSymbol} from "@/types/MusicScoreType";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import type {NodeIdMap} from "../types";
import {
    LINE_SPACING_RATIO,
    MIN_STEM_HEIGHT_RATIO,
    STEM_EXTRA_PER_FLAG_SPACES,
    STEM_FLAG_HEAD_CLEARANCE_SPACES,
    STEM_Y_OFFSET,
} from "../constants";
import {chronaxieToBeamLineCount, getNoteTailSkinKey} from "../utils/skinKey";
import {
    GRACE_NOTE_SCALE,
    graceScaleCenterOffsetX,
    graceScaleCenterOffsetY,
    graceTailCenterOffset
} from "@/render/graceNote";

/** 一线一间距离（完整间高） */
function staffSpace(measureHeight: number): number {
    return measureHeight * LINE_SPACING_RATIO * 2;
}

function getStemLength(params: {
    direction: 'up' | 'down';
    headCenterY: number;
    measureY: number;
    measureHeight: number;
    /** 倚音时缩短符干长度 */
    lengthScale?: number;
}): number {
    const {direction, headCenterY, measureY, measureHeight, lengthScale = 1} = params;
    const minStem = MIN_STEM_HEIGHT_RATIO * measureHeight * lengthScale;
    const staffCenterY = measureY + measureHeight / 2;
    const lineSpacing = measureHeight * LINE_SPACING_RATIO;
    const elongationThreshold = lineSpacing * 2;
    let len: number;
    if (direction === 'up') {
        if (headCenterY - staffCenterY + elongationThreshold < minStem / lengthScale) {
            len = minStem;
        } else {
            len = (headCenterY - staffCenterY + elongationThreshold) * lengthScale;
        }
    } else if (direction === 'down') {
        if (staffCenterY - headCenterY + elongationThreshold < minStem / lengthScale) {
            len = minStem;
        } else {
            len = (staffCenterY - headCenterY + elongationThreshold) * lengthScale;
        }
    } else {
        len = minStem;
    }
    return len;
}

/**
 * 有符尾时加长符干：刻谱惯例（钩越多干越长）+ 保证符尾高度不盖过符头。
 */
function stemLengthWithFlags(params: {
    baseLength: number;
    chronaxie: number;
    measureHeight: number;
    lengthScale: number;
    flagHeight?: number;
}): number {
    const {baseLength, chronaxie, measureHeight, lengthScale, flagHeight} = params;
    if (chronaxie > 32) return baseLength;

    const flagCount = chronaxieToBeamLineCount(chronaxie);
    const space = staffSpace(measureHeight) * lengthScale;
    const extra =
        flagCount > 1
            ? (flagCount - 1) * STEM_EXTRA_PER_FLAG_SPACES * space
            : 0;
    let len = baseLength + extra;

    if (flagHeight != null && flagHeight > 0) {
        const clearance = STEM_FLAG_HEAD_CLEARANCE_SPACES * space;
        const minForFlag = flagHeight * lengthScale + clearance;
        if (minForFlag > len) len = minForFlag;
    }
    return len;
}

export type RenderStemAndTailParams = {
    note: NoteSymbol;
    headX: number;
    headY: number;
    headW: number;
    headH: number;
    measureY: number;
    measureHeight: number;
    measureWidth: number;
    skin: StandardStaffSkinPack;
    zIndex: number;
    idMap: NodeIdMap;
    chronaxie?: number;
    direction?: 'up' | 'down';
    stemTargetId?: string;
    headCenterYOther?: number;
    skinName?: string;
    /** 倚音：符干在布局阶段调整 y/h；符尾用 VDom.scale 并做中心缩放 x/y 补偿 */
    isGrace?: boolean;
};

/**
 * 符干与符尾：chronaxie < 256 出符干，≤32 出符尾
 */
export function renderStemAndTail(params: RenderStemAndTailParams): VDom[] {
    const {
        note,
        headX,
        headY,
        headW,
        headH,
        measureY,
        measureHeight,
        skin,
        zIndex,
        stemTargetId,
        headCenterYOther,
        isGrace = false,
    } = params;
    const skinNameForNodes = params.skinName ?? 'default';
    const chronaxie = params.chronaxie ?? 64;
    const direction = params.direction ?? 'up';
    const out: VDom[] = [];
    if (chronaxie >= 256) return out;

    const stemSkin = skin[StandardStaffSkinKeyEnum.NoteStem];
    if (!stemSkin) return out;

    const g = isGrace ? GRACE_NOTE_SCALE : 1;
    const headCenterY = headY + headH / 2;
    const headCenterX = headX + headW / 2;
    const visualHalfW = (headW * g) / 2;

    const tailKey = chronaxie <= 32 ? getNoteTailSkinKey(chronaxie, direction) : undefined;
    const tailSkin = tailKey ? skin[tailKey] : undefined;

    const baseLength = getStemLength({
        direction,
        headCenterY,
        measureY,
        measureHeight,
        lengthScale: g,
    });
    const stemLength = stemLengthWithFlags({
        baseLength,
        chronaxie,
        measureHeight,
        lengthScale: g,
        flagHeight: tailSkin?.h,
    });
    const stemW = stemSkin.w;
    const targetId = stemTargetId ?? note.id ?? '';
    const stemYOffset = STEM_Y_OFFSET * measureHeight * g;
    const chordSpan =
        headCenterYOther != null && headCenterYOther !== headCenterY
            ? Math.abs(headCenterYOther - headCenterY) * g
            : 0;
    const totalStemH = stemLength + chordSpan - stemYOffset;

    if (direction === 'up') {
        const stemX = isGrace ? headCenterX + visualHalfW - stemW : headX + headW - stemW;
        const stemY = headCenterY - stemLength;
        out.push({
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x: stemX,
            y: stemY,
            w: stemW,
            h: totalStemH,
            zIndex,
            tag: 'noteStem',
            skinName: skinNameForNodes,
            targetId,
            skinKey: StandardStaffSkinKeyEnum.NoteStem,
            dataComment: isGrace ? '倚音符干' : '符干',
        });
        if (tailKey && tailSkin) {
            if (isGrace) {
                out.push({
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
                    special: {},
                    x: stemX - graceScaleCenterOffsetX(tailSkin.w, GRACE_NOTE_SCALE),
                    y: stemY - graceScaleCenterOffsetY(tailSkin.h, GRACE_NOTE_SCALE),
                    w: tailSkin.w,
                    h: tailSkin.h,
                    zIndex,
                    tag: 'noteTail',
                    skinName: skinNameForNodes,
                    targetId,
                    skinKey: tailKey,
                    dataComment: '倚音符尾',
                    scale: GRACE_NOTE_SCALE,
                });
            } else {
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
                    skinName: skinNameForNodes,
                    targetId,
                    skinKey: tailKey,
                    dataComment: '符尾',
                });
            }
        }
    } else {
        const stemX = isGrace ? headCenterX - visualHalfW : headX;
        const stemYTop = (headCenterYOther ?? headCenterY) + stemYOffset;
        out.push({
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x: stemX,
            y: stemYTop,
            w: stemW,
            h: totalStemH,
            zIndex,
            tag: 'noteStem',
            skinName: skinNameForNodes,
            targetId,
            skinKey: StandardStaffSkinKeyEnum.NoteStem,
            dataComment: isGrace ? '倚音符干' : '符干',
        });
        if (tailKey && tailSkin) {
            const {dx, dy} = isGrace
                ? graceTailCenterOffset(tailSkin.w, tailSkin.h, 'down', GRACE_NOTE_SCALE)
                : {dx: 0, dy: 0};
            out.push({
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
                special: {},
                x: stemX + dx,
                y: stemYTop + totalStemH - tailSkin.h + dy,
                w: tailSkin.w,
                h: tailSkin.h,
                zIndex,
                tag: 'noteTail',
                skinName: skinNameForNodes,
                targetId,
                skinKey: tailKey,
                dataComment: isGrace ? '倚音符尾' : '符尾',
                ...(isGrace ? {scale: GRACE_NOTE_SCALE} : {}),
            });
        }
    }
    return out;
}

/** 倚音符干（布局 y/h）+ 符尾（VDom.scale + 中心缩放 x/y 补偿） */
export function renderGraceStemAndTail(
    params: Omit<RenderStemAndTailParams, 'isGrace'>,
): VDom[] {
    return renderStemAndTail({...params, isGrace: true});
}
