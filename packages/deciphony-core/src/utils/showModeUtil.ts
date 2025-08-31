// 五线谱转简谱
import {MusicScore, NoteHead, NoteNumber} from "../types";
import {AccidentalEnum, MsSymbolTypeEnum, MusicScoreShowModeEnum} from "../musicScoreEnum";
import regionToNoteName from "./core/regionToNoteName";
import {noteNameToSolmization} from "./core/noteNameToSolmization";
import {
    getMsSymbolAccidental,
    getMsSymbolClef,
    getMsSymbolKeySignature,
    hasNoteStem,
    hasNoteTail
} from "./musicScoreDataUtil";
import {msSymbolTemplate} from "./objectTemplateUtil";
import solmizationToNoteName from "./core/solmizationToNoteName";
import noteNameToRegion from "./core/noteNameToRegion";

// 五线谱转简谱
export function standardStaffToNumberNotation(musicScore: MusicScore): void {
    musicScore.showMode = MusicScoreShowModeEnum.numberNotation
    for (let i = 0; i < musicScore.multipleStavesArray.length; i++) {
        const multipleStaves = musicScore.multipleStavesArray[i];

        for (let j = 0; j < multipleStaves.singleStaffArray.length; j++) {
            const singleStaff = multipleStaves.singleStaffArray[j];

            for (let k = 0; k < singleStaff.measureArray.length; k++) {
                const measure = singleStaff.measureArray[k];

                for (let m = 0; m < measure.msSymbolContainerArray.length; m++) {
                    const msSymbolContainer = measure.msSymbolContainerArray[m];

                    for (let n = 0; n < msSymbolContainer.msSymbolArray.length; n++) {
                        const msSymbol = msSymbolContainer.msSymbolArray[n];
                        if (msSymbol.type === MsSymbolTypeEnum.NoteHead) {
                            // 断言为 NoteNumber
                            const noteNumber = msSymbol as unknown as NoteNumber;
                            noteNumber.type = MsSymbolTypeEnum.NoteNumber
                            const {accidental, measureAccidental} = getMsSymbolAccidental(msSymbol, musicScore);
                            let acc: AccidentalEnum = AccidentalEnum.Natural;
                            if (accidental) acc = accidental;
                            else if (measureAccidental) acc = measureAccidental;

                            const clef = getMsSymbolClef(msSymbol, musicScore);
                            const keySignature = getMsSymbolKeySignature(msSymbol, musicScore)
                            const noteName = regionToNoteName(msSymbol.region, acc, clef);
                            const solmization = noteNameToSolmization(noteName, keySignature)
                            noteNumber.solmization = solmization.solmization;
                            noteNumber.octave = solmization.octave
                            // TODO 如果跟随符号会绑定跨小节符号，这里可能不能这样直接置空, 不对！ 跟随符号上绝对不能绑定跨小节符号
                            noteNumber.msSymbolArray = []
                            if (solmization.accidental) {
                                const newAccidental = msSymbolTemplate({
                                    type: MsSymbolTypeEnum.Accidental,
                                    accidental: solmization.accidental
                                });
                                noteNumber.msSymbolArray.push(newAccidental);
                            }
                            delete (msSymbol as any).region;
                        }
                    }
                }
            }
        }
    }
}

// 简谱转五线谱
export function numberNotationToStandardStaff(musicScore: MusicScore): void {
    musicScore.showMode = MusicScoreShowModeEnum.standardStaff
    for (let i = 0; i < musicScore.multipleStavesArray.length; i++) {
        const multipleStaves = musicScore.multipleStavesArray[i];
        for (let j = 0; j < multipleStaves.singleStaffArray.length; j++) {
            const singleStaff = multipleStaves.singleStaffArray[j];
            for (let k = 0; k < singleStaff.measureArray.length; k++) {
                const measure = singleStaff.measureArray[k];
                for (let m = 0; m < measure.msSymbolContainerArray.length; m++) {
                    const msSymbolContainer = measure.msSymbolContainerArray[m];
                    for (let n = 0; n < msSymbolContainer.msSymbolArray.length; n++) {
                        const msSymbol = msSymbolContainer.msSymbolArray[n];
                        if (msSymbol.type === MsSymbolTypeEnum.NoteNumber) {
                            // 断言为 NoteNumber
                            const noteHead = msSymbol as unknown as NoteHead;

                            noteHead.type = MsSymbolTypeEnum.NoteHead
                            const {accidental, measureAccidental} = getMsSymbolAccidental(msSymbol, musicScore);
                            let acc: AccidentalEnum = AccidentalEnum.Natural;
                            if (accidental) acc = accidental;

                            const clef = getMsSymbolClef(msSymbol, musicScore);
                            const keySignature = getMsSymbolKeySignature(msSymbol, musicScore)
                            const noteName = solmizationToNoteName(msSymbol.solmization, keySignature, msSymbol.octave);
                            const region = noteNameToRegion(noteName, clef)
                            noteHead.region = region.staffRegion;
                            noteHead.msSymbolArray = []
                            if (region.accidental) {
                                const newAccidental = msSymbolTemplate({
                                    type: MsSymbolTypeEnum.Accidental,
                                    accidental: region.accidental
                                });
                                noteHead.msSymbolArray.push(newAccidental);
                            }
                            // 添加符杠
                            if (hasNoteStem(noteHead.chronaxie)) {
                                const noteStem = msSymbolTemplate({type: MsSymbolTypeEnum.NoteStem});
                                noteHead.msSymbolArray.push(noteStem);
                            }
                            // 添加符尾
                            if (hasNoteTail(noteHead.chronaxie)) {
                                const noteTail = msSymbolTemplate({
                                    type: MsSymbolTypeEnum.NoteTail,
                                    chronaxie: noteHead.chronaxie
                                });
                                noteHead.msSymbolArray.push(noteTail);
                            }

                            delete (msSymbol as any).region;
                            delete (msSymbol as any).octave;
                        }
                    }
                }
            }
        }
    }
}