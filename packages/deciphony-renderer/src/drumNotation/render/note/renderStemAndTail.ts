import type {DrumNotationSkinPack} from "@/types/common";
import {VDom} from "@/types/common";
import {DrumNotationSkinKeyEnum} from "@/drumNotation/enums/drumNotationSkinKeyEnum";
import {LINE_SPACING_RATIO, MIN_STEM_HEIGHT_RATIO} from "../constants";
import {getNoteTailSkinKey} from "../utils/skinKey";
import type {DrumVoice} from "../types";

function getStemLength(direction: DrumVoice, headCenterY: number, measureY: number, measureHeight: number): number {
    const minStem = MIN_STEM_HEIGHT_RATIO * measureHeight;
    const staffCenterY = measureY + measureHeight / 2;
    const elongationThreshold = measureHeight * LINE_SPACING_RATIO * 2;
    const len = direction === 'up'
        ? headCenterY - staffCenterY + elongationThreshold
        : staffCenterY - headCenterY + elongationThreshold;
    return Math.max(len, minStem);
}

export type RenderStemAndTailParams = {
    /** 符杠一端的音符头（up 取最高音，down 取最低音），符干长度从其中心量起 */
    headX: number;
    headY: number;
    headW: number;
    headH: number;
    /** 符干接音符头一端的 y（up 为符干底端，down 为符干顶端），由音符头类型决定 */
    stemAttachY: number;
    measureY: number;
    measureHeight: number;
    skin: DrumNotationSkinPack;
    zIndex: number;
    chronaxie: number;
    direction: DrumVoice;
    stemTargetId: string;
    skinName?: string;
};

/**
 * 符干与符尾：chronaxie < 256 出符干，≤32 出符尾
 */
export function renderStemAndTail(params: RenderStemAndTailParams): VDom[] {
    const {headX, headY, headW, headH, stemAttachY, measureY, measureHeight, skin, zIndex, chronaxie, direction} = params;
    const skinNameForNodes = params.skinName ?? 'default';
    const targetId = params.stemTargetId;
    const out: VDom[] = [];
    if (chronaxie >= 256) return out;

    const stemSkin = skin[DrumNotationSkinKeyEnum.NoteStem];
    if (!stemSkin) return out;

    const headCenterY = headY + headH / 2;
    const stemLength = getStemLength(direction, headCenterY, measureY, measureHeight);
    const stemW = stemSkin.w;

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
            h: Math.max(0, stemAttachY - stemY),
            zIndex,
            tag: 'noteStem',
            skinName: skinNameForNodes,
            targetId,
            skinKey: DrumNotationSkinKeyEnum.NoteStem,
            dataComment: '符干',
        });
        if (chronaxie <= 32) {
            const tailKey = getNoteTailSkinKey(chronaxie, direction);
            const tailSkin = skin[tailKey];
            let noteTailYOffset = 0;
            if (chronaxie === 2) noteTailYOffset = measureHeight / 8;
            if (chronaxie === 1) noteTailYOffset = measureHeight * 2 / 8;
            if (tailSkin) {
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
    } else {
        const stemX = headX;
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
            dataComment: '符干',
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
                out.push({
                    startPoint: {x: 0, y: 0},
                    endPoint: {x: 0, y: 0},
                    special: {},
                    x: stemX,
                    y: stemYTop + stemH - tailSkin.h + noteTailYOffset,
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
    return out;
}
