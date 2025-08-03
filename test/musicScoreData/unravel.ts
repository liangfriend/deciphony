import type {MusicScore} from "@/applications/ChuangKeApplication/components/musicScore/types";
import {
    AccidentalEnum,
    ChronaxieEnum,
    ClefEnum, KeySignatureEnum,
    MsSymbolContainerTypeEnum, MsSymbolTypeEnum, MusicalAlphabetEnum,
    MusicScoreShowModeEnum
} from "@/applications/ChuangKeApplication/components/musicScore/musicScoreEnum.ts";

const data: MusicScore = {
    showMode: MusicScoreShowModeEnum.standardStaff,
    multipleStavesArray: [{
        singleStaffArray: [{
            measureArray: [{
                msSymbolContainerArray: [{
                    type: MsSymbolContainerTypeEnum.frontFixed,
                    msSymbolArray: [{
                        clef: ClefEnum.treble,
                        type: MsSymbolTypeEnum.clef_f,
                        options: {},
                        computed: {},
                    }]
                }],
            }]
        }]
    }]
}

export default data;