// 五线谱转简谱
import {MusicScore, NoteHead, NoteNumber} from "../types";
import {
    AccidentalEnum,
    ChronaxieEnum,
    MsSymbolContainerTypeEnum,
    MsSymbolTypeEnum,
    MusicScoreShowModeEnum
} from "../musicScoreEnum";
import {
    getMsSymbolAccidental,
    getMsSymbolClef,
    getMsSymbolKeySignature,
    hasNoteStem,
    hasNoteTail,
    msSymbolPropertiesInherit
} from "./musicScoreDataUtil";
import {msSymbolContainerTemplate, msSymbolTemplate} from "./objectTemplateUtil";
import solmizationToMidi from "./core/solmizationToMidi";
import midiToRegion from "./core/midiToRegion";
import regionToMidi from "./core/regionToMidi";
import midiToSolmization from "./core/midiToSolmization";
import {addChildMsSymbol, addMsSymbol, addMsSymbolContainer, removeMsSymbolContainer} from "./changeStructureUtil";

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
                        // 遇到noteHead转换成noteNumber
                        if (msSymbol.type === MsSymbolTypeEnum.NoteHead) {
                            // 断言为 NoteNumber
                            const noteNumber = msSymbolTemplate({type:MsSymbolTypeEnum.NoteNumber,chronaxie:ChronaxieEnum.quarter}) as NoteNumber;
                            // 继承原符号的id和绑定的跨小节符号
                            msSymbolPropertiesInherit(noteNumber,msSymbol)
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
                            // 设置chronaxie
                            if(![ChronaxieEnum.whole,ChronaxieEnum.half,ChronaxieEnum.quarter].includes(msSymbol.chronaxie)){
                                noteNumber.chronaxie = msSymbol.chronaxie;
                            }

                            // 删除原noteHead
                            msSymbolContainer.msSymbolArray.splice(n,1);
                            // 添加新noteNumber
                            addMsSymbol(noteNumber,msSymbolContainer,musicScore,n)
                            // 添加NoteDot
                            if(solmization.octave !== 4) {
                                const noteDot = msSymbolTemplate({type:MsSymbolTypeEnum.NoteDot, octave: solmization.octave})
                                addChildMsSymbol(noteDot,noteNumber,musicScore)
                            }
                            // 添加减时线
                            if(![ChronaxieEnum.whole,ChronaxieEnum.half,ChronaxieEnum.quarter].includes(noteNumber.chronaxie)) {
                                const chronaxieReducingLine = msSymbolTemplate({type:MsSymbolTypeEnum.ChronaxieReducingLine,chronaxie: noteNumber.chronaxie})
                                addChildMsSymbol(chronaxieReducingLine,noteNumber,musicScore)
                            }
                            // 添加变音符号
                            if (solmization.accidental) {
                                const newAccidental = msSymbolTemplate({
                                    type: MsSymbolTypeEnum.Accidental,
                                    accidental: solmization.accidental
                                });
                                addChildMsSymbol(newAccidental,noteNumber,musicScore)
                            }
                        }

                        // 在noteNumber后方添加对应数量的增时线
                        if(msSymbol.type === MsSymbolTypeEnum.NoteHead) {
                            if(msSymbol.chronaxie === ChronaxieEnum.whole){

                                for(let d = 0; d < 3; d++) {
                                    const chronaxieIncreasingLine = msSymbolTemplate({type:MsSymbolTypeEnum.ChronaxieIncreasingLine})
                                    const chronaxieIncreasingLineContainer = msSymbolContainerTemplate({type:MsSymbolContainerTypeEnum.variable})
                                    addMsSymbolContainer(chronaxieIncreasingLineContainer,msSymbolContainer,musicScore,'after')
                                    addMsSymbol(chronaxieIncreasingLine,chronaxieIncreasingLineContainer,musicScore,'after')
                                }
                                m+=3

                            }else if(msSymbol.chronaxie === ChronaxieEnum.half) {
                                const chronaxieIncreasingLine = msSymbolTemplate({type:MsSymbolTypeEnum.ChronaxieIncreasingLine})
                                const chronaxieIncreasingLineContainer = msSymbolContainerTemplate({type:MsSymbolContainerTypeEnum.variable})
                                addMsSymbolContainer(chronaxieIncreasingLineContainer,msSymbolContainer,musicScore,'after')
                                addMsSymbol(chronaxieIncreasingLine,chronaxieIncreasingLineContainer,musicScore,'after')
                                m+=1
                            }
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
                        if(msSymbol.type === MsSymbolTypeEnum.ChronaxieIncreasingLine) {
                            removeMsSymbolContainer(msSymbolContainer,musicScore)
                            // 删除当前元素，需要将当前索引减1
                            m--
                            continue
                        }
                        if (msSymbol.type === MsSymbolTypeEnum.NoteNumber) {
                            // 断言为 NoteNumber, 深拷贝
                            const noteHead =msSymbolTemplate({type:MsSymbolTypeEnum.NoteHead}) as NoteHead
                            msSymbolPropertiesInherit(noteHead,msSymbol)

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

                            if(msSymbol.chronaxie === ChronaxieEnum.quarter) {
                                // 通过noteNumber后方ChronaxieIncreasingLine数量设置时值
                                let dlCount = 0
                                for(let dl = m+1; dl <  measure.msSymbolContainerArray.length; dl++) {
                                    const dlMsSymbol = measure.msSymbolContainerArray[dl]?.msSymbolArray[0]
                                    if(dlMsSymbol.type === MsSymbolTypeEnum.ChronaxieIncreasingLine) {
                                        dlCount++
                                    }else {
                                        break
                                    }
                                }
                                if(dlCount === 0) {
                                    noteHead.chronaxie = ChronaxieEnum.quarter
                                }else if(dlCount === 1) {
                                    noteHead.chronaxie = ChronaxieEnum.half
                                }else if(dlCount === 3) {
                                    noteHead.chronaxie = ChronaxieEnum.whole
                                }
                            }else { // 时值小于四分音符的情况直接赋值
                                noteHead.chronaxie = msSymbol.chronaxie
                            }
                            // 删除原符号
                            msSymbolContainer.msSymbolArray.splice(n,1);
                            // 添加新符号
                            addMsSymbol(noteHead,msSymbolContainer,musicScore,n)
                            // 添加变音符号
                            if (region.accidental) {
                                const newAccidental = msSymbolTemplate({
                                    type: MsSymbolTypeEnum.Accidental,
                                    accidental: region.accidental
                                });
                                addChildMsSymbol(newAccidental,noteHead,musicScore)
                            }
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
                        }
                    }
                }
            }
        }
    }
    musicScore.showMode = MusicScoreShowModeEnum.standardStaff
}