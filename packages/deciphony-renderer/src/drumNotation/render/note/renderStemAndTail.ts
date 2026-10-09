import type {DrumNotationSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import {DrumNotationSkinKeyEnum} from "@/drumNotation/enums/drumNotationSkinKeyEnum";
import {
    LINE_SPACING_RATIO,
    MIN_STEM_HEIGHT_RATIO,
    STEM_EXTRA_PER_FLAG_SPACES,
    STEM_FLAG_HEAD_CLEARANCE_SPACES,
} from "../constants";
import {chronaxieToBeamLineCount, getNoteTailSkinKey} from "../utils/skinKey";
import type {DrumVoice} from "../types";
import {
    GRACE_NOTE_SCALE,
    graceScaleCenterOffsetX,
    graceScaleCenterOffsetY,
    graceTailCenterOffset,
} from "@/render/graceNote";

function staffSpace(measureHeight: number): number {
    return measureHeight * LINE_SPACING_RATIO * 2;
}

function getStemLength(direction: DrumVoice, headCenterY: number, measureY: number, measureHeight: number): number {
    const minStem = MIN_STEM_HEIGHT_RATIO * measureHeight;
    const staffCenterY = measureY + measureHeight / 2;
    const elongationThreshold = measureHeight * LINE_SPACING_RATIO * 2;
    const len = direction === 'up'
        ? headCenterY - staffCenterY + elongationThreshold
        : staffCenterY - headCenterY + elongationThreshold;
    return Math.max(len, minStem);
}

function stemLengthWithFlags(
    baseLength: number,
    chronaxie: number,
    measureHeight: number,
    lengthScale: number,
    flagHeight?: number,
): number {
    if (chronaxie > 32) return baseLength;
    const flagCount = chronaxieToBeamLineCount(chronaxie);
    const space = staffSpace(measureHeight) * lengthScale;
    const extra = flagCount > 1 ? (flagCount - 1) * STEM_EXTRA_PER_FLAG_SPACES * space : 0;
    let len = baseLength + extra;
    if (flagHeight != null && flagHeight > 0) {
        const minForFlag = flagHeight * lengthScale + STEM_FLAG_HEAD_CLEARANCE_SPACES * space;
        if (minForFlag > len) len = minForFlag;
    }
    return len;
}

export type RenderStemAndTailParams = {
    headX: number;
    headY: number;
    headW: number;
    headH: number;
    stemAttachY: number;
    measureY: number;
    measureHeight: number;
    skin: DrumNotationSkinPack;
    zIndex: number;
    chronaxie: number;
    direction: DrumVoice;
    stemTargetId: string;
    skinName?: string;
    /** 倚音：head* 为未缩放盒子，符干按视觉符头定位并缩短；符尾用 VDom.scale 并做中心缩放补偿 */
    isGrace?: boolean;
};

/**
 * 符干与符尾：chronaxie < 256 出符干，≤32 出符尾
 */
export function renderStemAndTail(params: RenderStemAndTailParams): VDom[] {
    const {headX, headY, headW, headH, stemAttachY, measureY, measureHeight, skin, zIndex, chronaxie, direction, isGrace = false} = params;
    const skinNameForNodes = params.skinName ?? 'default';
    const targetId = params.stemTargetId;
    const out: VDom[] = [];
    if (chronaxie >= 256) return out;

    const stemSkin = skin[DrumNotationSkinKeyEnum.NoteStem];
    if (!stemSkin) return out;

    const g = isGrace ? GRACE_NOTE_SCALE : 1;
    const headCenterY = headY + headH / 2;
    const headCenterX = headX + headW / 2;
    const visualHalfW = (headW * g) / 2;
    const tailKey = chronaxie <= 32 ? getNoteTailSkinKey(chronaxie, direction) : undefined;
    const tailSkin = tailKey ? skin[tailKey] : undefined;
    const stemLength = stemLengthWithFlags(
        getStemLength(direction, headCenterY, measureY, measureHeight) * g,
        chronaxie,
        measureHeight,
        g,
        tailSkin?.h,
    );
    const stemW = stemSkin.w;
    const stemComment = isGrace ? '倚音符干' : '符干';
    const tailComment = isGrace ? '倚音符尾' : '符尾';

    if (direction === 'up') {
        const stemX = headCenterX + visualHalfW - stemW;
        const stemY = headCenterY - stemLength;
        out.push({
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x: stemX,
            y: stemY,
            w: stemW,
            h: Math.max(0, stemAttachY - stemY),
            zIndex,
            tag: 'noteStem',
            skinName: skinNameForNodes,
            targetId,
            skinKey: DrumNotationSkinKeyEnum.NoteStem,
            dataComment: stemComment,
        });
        if (tailKey && tailSkin) {
            out.push({
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
                special: {},
                x: isGrace ? stemX - graceScaleCenterOffsetX(tailSkin.w, g) : stemX,
                y: isGrace ? stemY - graceScaleCenterOffsetY(tailSkin.h, g) : stemY,
                w: tailSkin.w,
                h: tailSkin.h,
                zIndex,
                tag: 'noteTail',
                skinName: skinNameForNodes,
                targetId,
                skinKey: tailKey,
                dataComment: tailComment,
                ...(isGrace ? {scale: g} : {}),
            });
        }
    } else {
        const stemX = headCenterX - visualHalfW;
        const stemYTop = stemAttachY;
        const stemH = Math.max(0, headCenterY + stemLength - stemYTop);
        out.push({
            startPoint: {x: 0, y: 0},
            endPoint: {x: 0, y: 0},
            special: {},
            x: stemX,
            y: stemYTop,
            w: stemW,
            h: stemH,
            zIndex,
            tag: 'noteStem',
            skinName: skinNameForNodes,
            targetId,
            skinKey: DrumNotationSkinKeyEnum.NoteStem,
            dataComment: stemComment,
        });
        if (tailKey && tailSkin) {
            const {dx, dy} = isGrace ? graceTailCenterOffset(tailSkin.w, tailSkin.h, 'down', g) : {dx: 0, dy: 0};
            out.push({
                startPoint: {x: 0, y: 0},
                endPoint: {x: 0, y: 0},
                special: {},
                x: stemX + dx,
                y: stemYTop + stemH - tailSkin.h + dy,
                w: tailSkin.w,
                h: tailSkin.h,
                zIndex,
                tag: 'noteTail',
                skinName: skinNameForNodes,
                targetId,
                skinKey: tailKey,
                dataComment: tailComment,
                ...(isGrace ? {scale: g} : {}),
            });
        }
    }
    return out;
}
