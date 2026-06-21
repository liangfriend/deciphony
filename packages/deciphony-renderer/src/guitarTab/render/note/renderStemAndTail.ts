import type {GuitarTabSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import {NoteSymbol} from "@/types/MusicScoreType";
import {GuitarTabSkinKeyEnum} from "@/guitarTab/enums/guitarTabSkinKeyEnum";
import type {NodeIdMap} from "../types";
import {LINE_SPACING_RATIO, MIN_STEM_HEIGHT_RATIO, STEM_Y_OFFSET} from "../constants";
import {getNoteTailSkinKey} from "../utils/skinKey";
import {
    GRACE_NOTE_SCALE,
    graceScaleCenterOffsetX,
    graceScaleCenterOffsetY,
    graceTailCenterOffset
} from "@/render/graceNote";

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

export type RenderStemAndTailParams = {
    note: NoteSymbol;
    headX: number;
    headY: number;
    headW: number;
    headH: number;
    measureY: number;
    measureHeight: number;
    measureWidth: number;
    skin: GuitarTabSkinPack;
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

    const stemSkin = skin[GuitarTabSkinKeyEnum.NoteStem];
    if (!stemSkin) return out;

    const g = isGrace ? GRACE_NOTE_SCALE : 1;
    const headCenterY = headY + headH / 2;
    const headCenterX = headX + headW / 2;
    const visualHalfW = (headW * g) / 2;

    const stemLength = getStemLength({
        direction,
        headCenterY,
        measureY,
        measureHeight,
        lengthScale: g,
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
            skinKey: GuitarTabSkinKeyEnum.NoteStem,
            dataComment: isGrace ? '倚音符干' : '符干',
        });
        if (chronaxie <= 32) {
            const tailKey = getNoteTailSkinKey(chronaxie, direction);
            const tailSkin = skin[tailKey];
            let noteTailYOffset = 0;
            if (chronaxie === 2) noteTailYOffset = measureHeight / 8;
            if (chronaxie === 1) noteTailYOffset = measureHeight * 2 / 8;
            if (tailSkin) {
                if (isGrace) {
                    out.push({
                        startPoint: {x: 0, y: 0},
                        endPoint: {x: 0, y: 0},
                        special: {},
                        x: stemX - graceScaleCenterOffsetX(tailSkin.w, GRACE_NOTE_SCALE),
                        y: stemY - noteTailYOffset - graceScaleCenterOffsetY(tailSkin.h, GRACE_NOTE_SCALE),
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
                        y: stemY - noteTailYOffset,
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
            skinKey: GuitarTabSkinKeyEnum.NoteStem,
            dataComment: isGrace ? '倚音符干' : '符干',
        });
        if (chronaxie <= 32) {
            const tailKey = getNoteTailSkinKey(chronaxie, direction);
            const tailSkin = skin[tailKey];
            let noteTailYOffset = 0;
            if (chronaxie === 8) noteTailYOffset = measureHeight / 8;
            if (chronaxie === 4) noteTailYOffset = measureHeight * 2 / 8;
            if (chronaxie === 2) noteTailYOffset = measureHeight * 3 / 8;
            if (chronaxie === 1) noteTailYOffset = measureHeight * 4 / 8;
            if (tailSkin) {
                const {dx, dy} = isGrace
                    ? graceTailCenterOffset(tailSkin.w, tailSkin.h, 'down', GRACE_NOTE_SCALE)
                    : {dx: 0, dy: 0};
                out.push({
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
                    special: {},
                    x: stemX + dx,
                    y: stemYTop + totalStemH - tailSkin.h + noteTailYOffset + dy,
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
    }
    return out;
}

/** 倚音符干（布局 y/h）+ 符尾（VDom.scale + 中心缩放 x/y 补偿） */
export function renderGraceStemAndTail(
    params: Omit<RenderStemAndTailParams, 'isGrace'>,
): VDom[] {
    return renderStemAndTail({...params, isGrace: true});
}
