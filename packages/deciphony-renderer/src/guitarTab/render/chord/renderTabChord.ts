import type {VDom} from '@/types/common';
import {GuitarTabSkinKeyEnum} from '@/guitarTab/enums/guitarTabSkinKeyEnum';
import type {tabChord} from '@/types/MusicScoreType';
import {GUITAR_TAB_CHORD_Y_OFFSET_RATIO} from '../constants';

function tabChordToSpecial(chord: tabChord): NonNullable<VDom['special']['tabChord']> {
    const {
        id: _id,
        relativeX: _rx,
        relativeY: _ry,
        relativeW: _rw,
        relativeH: _rh,
        width,
        height,
        stringCount,
        name,
        fretCount,
        baseFret,
        barres,
        tuning,
        stringStates,
        textSize,
        nameSize,
    } = chord;
    return {
        width,
        height,
        stringCount,
        name,
        fretCount,
        baseFret,
        barres,
        tuning,
        stringStates,
        ...(textSize !== undefined ? {textSize} : {}),
        ...(nameSize !== undefined ? {nameSize} : {}),
    };
}

export function buildTabChordVDom(params: {
    chord: tabChord;
    slotCenterX: number;
    measureY: number;
    measureHeight: number;
    targetId: string;
    skinName: string;
    zIndex: number;
}): VDom {
    const {chord, slotCenterX, measureY, measureHeight, targetId, skinName, zIndex} = params;
    const w = chord.width;
    const h = chord.height;
    return {
        x: slotCenterX,
        y: measureY - h - measureHeight * GUITAR_TAB_CHORD_Y_OFFSET_RATIO,
        w,
        h,
        zIndex,
        tag: 'tabChord',
        skinKey: GuitarTabSkinKeyEnum.TabChord,
        skinName,
        targetId,
        startPoint: {x: 0, y: 0},
        endPoint: {x: 0, y: 0},
        special: {tabChord: tabChordToSpecial(chord)},
        dataComment: '和弦图',
    };
}
