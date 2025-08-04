import {MusicScore, TimeSignature} from "@/applications/ChuangKeApplication/components/musicScore/types";
import {
    AccidentalEnum, BarLineTypeEnum,
    ChronaxieEnum,
    ClefEnum,
    KeySignatureEnum,
    MsSymbolContainerTypeEnum,
    MsSymbolTypeEnum, MsTypeNameEnum, MusicScoreRegionEnum,

    MusicScoreShowModeEnum, SpanSymbolFollowingCategoryEnum, SpanSymbolTypeEnum
} from "@/applications/ChuangKeApplication/components/musicScore/musicScoreEnum.ts";

const data: MusicScore = {
    "showMode": 1,
    "map": [],
    "measureHeight": 50,
    "widthDynamicRatio": 0.4,
    "spanSymbolArray": [],
    "multipleStavesArray": [
        {
            "id": 1754137361040,
            "msTypeName": 1,
            "index": {
                "multipleStavesIndex": 0,
                "singleStaffIndex": -1,
                "measureIndex": -1,
                "msSymbolContainerIndex": -1,
                "msSymbolIndex": -1
            },
            "bindingStartId": [],
            "bindingEndId": [],
            "multipleStavesPaddingTop": 60,
            "multipleStavesPaddingBottom": 60,
            "multipleStavesMarginBottom": 60,
            "options": {
                "highlight": true,
                "highlightColor": "red",
                "color": "transparent"
            },
            "vueKey": 1754137361035,
            "singleStaffArray": [
                {
                    "id": 1754137361039,
                    "msTypeName": 2,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": -1,
                        "msSymbolContainerIndex": -1,
                        "msSymbolIndex": -1
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "singleStaffPaddingTop": 30,
                    "singleStaffPaddingBottom": 30,
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "transparent"
                    },
                    "vueKey": 1754137361035,
                    "singleStaffMarginBottom": 30,
                    "measureArray": [
                        {
                            "id": 1754137793182,
                            "msTypeName": 3,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": -1,
                                "msSymbolIndex": -1
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "black"
                            },
                            "vueKey": 1754137793179,
                            "msSymbolContainerArray": [
                                {
                                    "id": 1754137793182,
                                    "msSymbolArray": [
                                        {
                                            "id": 1754137793180,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 0,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [],
                                            "vueKey": 1754137793179,
                                            "type": "barLine",
                                            "barLineType": 1
                                        }
                                    ],
                                    "type": 2,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 0,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "black"
                                    },
                                    "vueKey": 1754137793180,
                                    "msTypeName": 5
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}

export default data;