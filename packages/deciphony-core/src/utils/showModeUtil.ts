// 五线谱转简谱
import {MusicScore, NoteHead, NoteNumber} from "../types";
import {AccidentalEnum, ChronaxieEnum, MsSymbolTypeEnum, MusicScoreShowModeEnum} from "../musicScoreEnum";
import {
    getMsSymbolAccidental,
    getMsSymbolClef,
    getMsSymbolKeySignature,
    hasNoteStem,
    hasNoteTail
} from "./musicScoreDataUtil";
import {msSymbolTemplate} from "./objectTemplateUtil";
import solmizationToMidi from "./core/solmizationToMidi";
import midiToRegion from "./core/midiToRegion";
import regionToMidi from "./core/regionToMidi";
import midiToSolmization from "./core/midiToSolmization";
import {addChildMsSymbol, addMsSymbol} from "./changeStructureUtil";

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
                            const noteNumber = JSON.parse(JSON.stringify(msSymbol)) as unknown as NoteNumber;
                            noteNumber.type = MsSymbolTypeEnum.NoteNumber
                            const {accidental, measureAccidental} = getMsSymbolAccidental(msSymbol, musicScore);
                            let acc: AccidentalEnum = accidental
                            if (measureAccidental && acc === AccidentalEnum.Natural) acc = measureAccidental;

                            const clef = getMsSymbolClef(msSymbol, musicScore);
                            const keySignature = getMsSymbolKeySignature(msSymbol, musicScore)
                            const midi = regionToMidi(msSymbol.region, acc, clef);
                            const solmization = midiToSolmization(midi, keySignature)
                            noteNumber.solmization = solmization.solmization;
                            noteNumber.octave = solmization.octave
                            noteNumber.msSymbolArray = []
                            // 添加NoteDot
                            if(solmization.octave !== 4) {
                                const noteDot = msSymbolTemplate({type:MsSymbolTypeEnum.NoteDot, octave: solmization.octave})
                                noteNumber.msSymbolArray.push(noteDot);
                                noteNumber.msSymbolArray
                                addChildMsSymbol(noteDot,noteNumber,musicScore)
                            }
                            // 添加toneLine
                            // 添加变音符号
                            if (solmization.accidental) {
                                const newAccidental = msSymbolTemplate({
                                    type: MsSymbolTypeEnum.Accidental,
                                    accidental: solmization.accidental
                                });
                                addChildMsSymbol(newAccidental,noteNumber,musicScore)
                            }
                            delete (msSymbol as any).region;
                            Object.assign(msSymbol, noteNumber)
                        }
                    }
                }
            }
        }
    }
}

// 简谱转五线谱
export function numberNotationToStandardStaff(musicScore: MusicScore): void {

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
                            // 断言为 NoteNumber, 深拷贝
                            const noteHead = JSON.parse(JSON.stringify(msSymbol)) as unknown as NoteHead;


                            const {accidental, measureAccidental} = getMsSymbolAccidental(msSymbol, musicScore);
                            let acc: AccidentalEnum = accidental
                            if (measureAccidental && acc === AccidentalEnum.Natural) acc = measureAccidental;

                            const clef = getMsSymbolClef(msSymbol, musicScore);
                            const keySignature = getMsSymbolKeySignature(msSymbol, musicScore)
                            const midi = solmizationToMidi(msSymbol.solmization, acc as Exclude<AccidentalEnum, AccidentalEnum.Natural>, keySignature, msSymbol.octave)
                            const region = midiToRegion(midi, clef)
                            noteHead.region = region.staffRegion;
                            noteHead.vueKey = Date.now()
                            noteHead.msSymbolArray = []
                            // TODO 这里要重构，简谱和五线谱不一样的，增加了增时线和时值线
                            if (region.accidental) {
                                const newAccidental = msSymbolTemplate({
                                    type: MsSymbolTypeEnum.Accidental,
                                    accidental: region.accidental
                                });
                                addChildMsSymbol(newAccidental,noteHead,musicScore)
                            }
                            noteHead.type = MsSymbolTypeEnum.NoteHead
                            // 添加符杠
                            if (hasNoteStem(noteHead.chronaxie)) {
                                const noteStem = msSymbolTemplate({type: MsSymbolTypeEnum.NoteStem});
                                noteStem.index = noteHead.index;
                                addChildMsSymbol(noteStem,noteHead,musicScore)
                            }
                            // 添加符尾
                            if (hasNoteTail(noteHead.chronaxie)) {
                                const noteTail = msSymbolTemplate({
                                    type: MsSymbolTypeEnum.NoteTail,
                                    chronaxie: noteHead.chronaxie
                                });
                                addChildMsSymbol(noteTail,noteHead,musicScore)
                            }

                            delete (msSymbol as any).region;
                            delete (msSymbol as any).octave;
                            Object.assign(msSymbol, noteHead)
                            musicScore.vueKey = Math.random()*Date.now()
                        }
                    }
                }
            }
        }
    }
    musicScore.showMode = MusicScoreShowModeEnum.standardStaff
}