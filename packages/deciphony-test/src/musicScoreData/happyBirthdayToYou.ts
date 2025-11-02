import {MusicScore, TimeSignature} from "@/applications/ChuangKeApplication/components/musicScore/types";
import {
    AccidentalEnum, BarLineTypeEnum,
    ChronaxieEnum,
    ClefEnum,
    KeySignatureEnum,
    MsSymbolContainerTypeEnum,
    MsSymbolTypeEnum, StaffRegion,

    MusicScoreShowModeEnum, SpanSymbolFollowingCategoryEnum, SpanSymbolTypeEnum
} from "@/applications/ChuangKeApplication/components/musicScore/musicScoreEnum.ts";

const data: MusicScore = {
    "title": "空曲谱",
    "multipleStavesArray": [
        {
            "id": 1754923860817.6409,
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
                "highlight": false,
                "highlightColor": "red",
                "color": "transparent"
            },
            "vueKey": 1371622100878.4321,
            "singleStaffArray": [
                {
                    "id": 428748222042.6017,
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
                    "vueKey": 297353269467.9126,
                    "singleStaffMarginBottom": 30,
                    "measureArray": [
                        {
                            "id": 99011718029.67607,
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
                                "highlight": true,
                                "highlightColor": "red",
                                "color": "black"
                            },
                            "vueKey": 771450524939.1492,
                            "msSymbolContainerArray": [
                                {
                                    "id": 1113694404157.2085,
                                    "msSymbolArray": [
                                        {
                                            "id": 1234153615706.9077,
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
                                            "vueKey": 372722215915.6898,
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
                                        "color": "transparent"
                                    },
                                    "vueKey": 1080490940872.5968,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 1224320367521.279,
                                    "msSymbolArray": [
                                        {
                                            "id": 830094500074.2643,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 1,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 307444660479.81573,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 1,
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
                                                    "vueKey": 618752188855.3876,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 1526621513391.7751,
                                            "beamId": 2,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "lower",
                                                "type": "line",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 1,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1629092670473.3176,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 456182458514.8327,
                                    "msSymbolArray": [
                                        {
                                            "id": 394577465430.6624,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 2,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 1571672633776.8738,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 2,
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
                                                    "vueKey": 349062432631.6606,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 237110693730.39667,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "lower",
                                                "type": "line",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 2,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 50620766620.62446,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 990796819002.8275,
                                    "msSymbolArray": [
                                        {
                                            "id": 104983367686.58646,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 3,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 848531958776.7518,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 3,
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
                                                    "vueKey": 686775712601.2333,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 342782954303.69366,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "lower",
                                                "type": "space",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 3,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1728202092934.9888,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 648840965855.3826,
                                    "msSymbolArray": [
                                        {
                                            "id": 563989113615.5653,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 4,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 1181307329229.0784,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 4,
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
                                                    "vueKey": 1589538826889.395,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 429616680441.6299,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "lower",
                                                "type": "line",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 4,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1104374056139.2493,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 1260325296167.6785,
                                    "msSymbolArray": [
                                        {
                                            "id": 440841132927.37897,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 5,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 1369948628035.2014,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 5,
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
                                                    "vueKey": 362572755233.1634,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 452727568539.009,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "main",
                                                "type": "space",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 5,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1003189864190.6251,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 1629877089788.8298,
                                    "msSymbolArray": [
                                        {
                                            "id": 1602693695926.3684,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 6,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 1033904043486.6746,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 6,
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
                                                    "vueKey": 598873271565.8286,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 862137864695.4152,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "main",
                                                "type": "line",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 6,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1391502013959.3262,
                                    "msTypeName": 5
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    "measureHeight": 60,
    "showMode": 1,
    "spanSymbolArray": [],
    "widthDynamicRatio": 0.6,
    "map": {
        "1754923860817.6409": {
            "id": 1754923860817.6409,
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
                "highlight": false,
                "highlightColor": "red",
                "color": "transparent"
            },
            "vueKey": 1371622100878.4321,
            "singleStaffArray": [
                {
                    "id": 428748222042.6017,
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
                    "vueKey": 297353269467.9126,
                    "singleStaffMarginBottom": 30,
                    "measureArray": [
                        {
                            "id": 99011718029.67607,
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
                                "highlight": true,
                                "highlightColor": "red",
                                "color": "black"
                            },
                            "vueKey": 771450524939.1492,
                            "msSymbolContainerArray": [
                                {
                                    "id": 1113694404157.2085,
                                    "msSymbolArray": [
                                        {
                                            "id": 1234153615706.9077,
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
                                            "vueKey": 372722215915.6898,
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
                                        "color": "transparent"
                                    },
                                    "vueKey": 1080490940872.5968,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 1224320367521.279,
                                    "msSymbolArray": [
                                        {
                                            "id": 830094500074.2643,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 1,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 307444660479.81573,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 1,
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
                                                    "vueKey": 618752188855.3876,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 1526621513391.7751,
                                            "beamId": 2,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "lower",
                                                "type": "line",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 1,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1629092670473.3176,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 456182458514.8327,
                                    "msSymbolArray": [
                                        {
                                            "id": 394577465430.6624,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 2,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 1571672633776.8738,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 2,
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
                                                    "vueKey": 349062432631.6606,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 237110693730.39667,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "lower",
                                                "type": "line",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 2,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 50620766620.62446,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 990796819002.8275,
                                    "msSymbolArray": [
                                        {
                                            "id": 104983367686.58646,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 3,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 848531958776.7518,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 3,
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
                                                    "vueKey": 686775712601.2333,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 342782954303.69366,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "lower",
                                                "type": "space",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 3,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1728202092934.9888,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 648840965855.3826,
                                    "msSymbolArray": [
                                        {
                                            "id": 563989113615.5653,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 4,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 1181307329229.0784,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 4,
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
                                                    "vueKey": 1589538826889.395,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 429616680441.6299,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "lower",
                                                "type": "line",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 4,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1104374056139.2493,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 1260325296167.6785,
                                    "msSymbolArray": [
                                        {
                                            "id": 440841132927.37897,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 5,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 1369948628035.2014,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 5,
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
                                                    "vueKey": 362572755233.1634,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 452727568539.009,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "main",
                                                "type": "space",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 5,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1003189864190.6251,
                                    "msTypeName": 5
                                },
                                {
                                    "id": 1629877089788.8298,
                                    "msSymbolArray": [
                                        {
                                            "id": 1602693695926.3684,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 6,
                                                "msSymbolIndex": 0
                                            },
                                            "options": {
                                                "highlight": false,
                                                "highlightColor": "red",
                                                "color": "black"
                                            },
                                            "bindingStartId": [],
                                            "bindingEndId": [],
                                            "msSymbolArray": [
                                                {
                                                    "id": 1033904043486.6746,
                                                    "msTypeName": 6,
                                                    "index": {
                                                        "multipleStavesIndex": 0,
                                                        "singleStaffIndex": 0,
                                                        "measureIndex": 0,
                                                        "msSymbolContainerIndex": 6,
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
                                                    "vueKey": 598873271565.8286,
                                                    "direction": "up",
                                                    "type": "noteStem"
                                                }
                                            ],
                                            "vueKey": 862137864695.4152,
                                            "beamId": -1,
                                            "type": "noteHead",
                                            "region": {
                                                "region": "main",
                                                "type": "line",
                                                "index": 1
                                            },
                                            "chronaxie": 4
                                        }
                                    ],
                                    "type": 3,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 6,
                                        "msSymbolIndex": -1
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "transparent"
                                    },
                                    "vueKey": 1391502013959.3262,
                                    "msTypeName": 5
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "428748222042.6017": {
            "id": 428748222042.6017,
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
            "vueKey": 297353269467.9126,
            "singleStaffMarginBottom": 30,
            "measureArray": [
                {
                    "id": 99011718029.67607,
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
                        "highlight": true,
                        "highlightColor": "red",
                        "color": "black"
                    },
                    "vueKey": 771450524939.1492,
                    "msSymbolContainerArray": [
                        {
                            "id": 1113694404157.2085,
                            "msSymbolArray": [
                                {
                                    "id": 1234153615706.9077,
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
                                    "vueKey": 372722215915.6898,
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
                                "color": "transparent"
                            },
                            "vueKey": 1080490940872.5968,
                            "msTypeName": 5
                        },
                        {
                            "id": 1224320367521.279,
                            "msSymbolArray": [
                                {
                                    "id": 830094500074.2643,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 1,
                                        "msSymbolIndex": 0
                                    },
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "black"
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "msSymbolArray": [
                                        {
                                            "id": 307444660479.81573,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 1,
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
                                            "vueKey": 618752188855.3876,
                                            "direction": "up",
                                            "type": "noteStem"
                                        }
                                    ],
                                    "vueKey": 1526621513391.7751,
                                    "beamId": 2,
                                    "type": "noteHead",
                                    "region": {
                                        "region": "lower",
                                        "type": "line",
                                        "index": 1
                                    },
                                    "chronaxie": 4
                                }
                            ],
                            "type": 3,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 1,
                                "msSymbolIndex": -1
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "transparent"
                            },
                            "vueKey": 1629092670473.3176,
                            "msTypeName": 5
                        },
                        {
                            "id": 456182458514.8327,
                            "msSymbolArray": [
                                {
                                    "id": 394577465430.6624,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 2,
                                        "msSymbolIndex": 0
                                    },
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "black"
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "msSymbolArray": [
                                        {
                                            "id": 1571672633776.8738,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 2,
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
                                            "vueKey": 349062432631.6606,
                                            "direction": "up",
                                            "type": "noteStem"
                                        }
                                    ],
                                    "vueKey": 237110693730.39667,
                                    "beamId": -1,
                                    "type": "noteHead",
                                    "region": {
                                        "region": "lower",
                                        "type": "line",
                                        "index": 1
                                    },
                                    "chronaxie": 4
                                }
                            ],
                            "type": 3,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 2,
                                "msSymbolIndex": -1
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "transparent"
                            },
                            "vueKey": 50620766620.62446,
                            "msTypeName": 5
                        },
                        {
                            "id": 990796819002.8275,
                            "msSymbolArray": [
                                {
                                    "id": 104983367686.58646,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 3,
                                        "msSymbolIndex": 0
                                    },
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "black"
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "msSymbolArray": [
                                        {
                                            "id": 848531958776.7518,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 3,
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
                                            "vueKey": 686775712601.2333,
                                            "direction": "up",
                                            "type": "noteStem"
                                        }
                                    ],
                                    "vueKey": 342782954303.69366,
                                    "beamId": -1,
                                    "type": "noteHead",
                                    "region": {
                                        "region": "lower",
                                        "type": "space",
                                        "index": 1
                                    },
                                    "chronaxie": 4
                                }
                            ],
                            "type": 3,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 3,
                                "msSymbolIndex": -1
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "transparent"
                            },
                            "vueKey": 1728202092934.9888,
                            "msTypeName": 5
                        },
                        {
                            "id": 648840965855.3826,
                            "msSymbolArray": [
                                {
                                    "id": 563989113615.5653,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 4,
                                        "msSymbolIndex": 0
                                    },
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "black"
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "msSymbolArray": [
                                        {
                                            "id": 1181307329229.0784,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 4,
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
                                            "vueKey": 1589538826889.395,
                                            "direction": "up",
                                            "type": "noteStem"
                                        }
                                    ],
                                    "vueKey": 429616680441.6299,
                                    "beamId": -1,
                                    "type": "noteHead",
                                    "region": {
                                        "region": "lower",
                                        "type": "line",
                                        "index": 1
                                    },
                                    "chronaxie": 4
                                }
                            ],
                            "type": 3,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 4,
                                "msSymbolIndex": -1
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "transparent"
                            },
                            "vueKey": 1104374056139.2493,
                            "msTypeName": 5
                        },
                        {
                            "id": 1260325296167.6785,
                            "msSymbolArray": [
                                {
                                    "id": 440841132927.37897,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 5,
                                        "msSymbolIndex": 0
                                    },
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "black"
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "msSymbolArray": [
                                        {
                                            "id": 1369948628035.2014,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 5,
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
                                            "vueKey": 362572755233.1634,
                                            "direction": "up",
                                            "type": "noteStem"
                                        }
                                    ],
                                    "vueKey": 452727568539.009,
                                    "beamId": -1,
                                    "type": "noteHead",
                                    "region": {
                                        "region": "main",
                                        "type": "space",
                                        "index": 1
                                    },
                                    "chronaxie": 4
                                }
                            ],
                            "type": 3,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 5,
                                "msSymbolIndex": -1
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "transparent"
                            },
                            "vueKey": 1003189864190.6251,
                            "msTypeName": 5
                        },
                        {
                            "id": 1629877089788.8298,
                            "msSymbolArray": [
                                {
                                    "id": 1602693695926.3684,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 6,
                                        "msSymbolIndex": 0
                                    },
                                    "options": {
                                        "highlight": false,
                                        "highlightColor": "red",
                                        "color": "black"
                                    },
                                    "bindingStartId": [],
                                    "bindingEndId": [],
                                    "msSymbolArray": [
                                        {
                                            "id": 1033904043486.6746,
                                            "msTypeName": 6,
                                            "index": {
                                                "multipleStavesIndex": 0,
                                                "singleStaffIndex": 0,
                                                "measureIndex": 0,
                                                "msSymbolContainerIndex": 6,
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
                                            "vueKey": 598873271565.8286,
                                            "direction": "up",
                                            "type": "noteStem"
                                        }
                                    ],
                                    "vueKey": 862137864695.4152,
                                    "beamId": -1,
                                    "type": "noteHead",
                                    "region": {
                                        "region": "main",
                                        "type": "line",
                                        "index": 1
                                    },
                                    "chronaxie": 4
                                }
                            ],
                            "type": 3,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 6,
                                "msSymbolIndex": -1
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "transparent"
                            },
                            "vueKey": 1391502013959.3262,
                            "msTypeName": 5
                        }
                    ]
                }
            ]
        },
        "99011718029.67607": {
            "id": 99011718029.67607,
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
                "highlight": true,
                "highlightColor": "red",
                "color": "black"
            },
            "vueKey": 771450524939.1492,
            "msSymbolContainerArray": [
                {
                    "id": 1113694404157.2085,
                    "msSymbolArray": [
                        {
                            "id": 1234153615706.9077,
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
                            "vueKey": 372722215915.6898,
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
                        "color": "transparent"
                    },
                    "vueKey": 1080490940872.5968,
                    "msTypeName": 5
                },
                {
                    "id": 1224320367521.279,
                    "msSymbolArray": [
                        {
                            "id": 830094500074.2643,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 1,
                                "msSymbolIndex": 0
                            },
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "black"
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "msSymbolArray": [
                                {
                                    "id": 307444660479.81573,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 1,
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
                                    "vueKey": 618752188855.3876,
                                    "direction": "up",
                                    "type": "noteStem"
                                }
                            ],
                            "vueKey": 1526621513391.7751,
                            "beamId": 2,
                            "type": "noteHead",
                            "region": {
                                "region": "lower",
                                "type": "line",
                                "index": 1
                            },
                            "chronaxie": 4
                        }
                    ],
                    "type": 3,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 1,
                        "msSymbolIndex": -1
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "transparent"
                    },
                    "vueKey": 1629092670473.3176,
                    "msTypeName": 5
                },
                {
                    "id": 456182458514.8327,
                    "msSymbolArray": [
                        {
                            "id": 394577465430.6624,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 2,
                                "msSymbolIndex": 0
                            },
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "black"
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "msSymbolArray": [
                                {
                                    "id": 1571672633776.8738,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 2,
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
                                    "vueKey": 349062432631.6606,
                                    "direction": "up",
                                    "type": "noteStem"
                                }
                            ],
                            "vueKey": 237110693730.39667,
                            "beamId": -1,
                            "type": "noteHead",
                            "region": {
                                "region": "lower",
                                "type": "line",
                                "index": 1
                            },
                            "chronaxie": 4
                        }
                    ],
                    "type": 3,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 2,
                        "msSymbolIndex": -1
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "transparent"
                    },
                    "vueKey": 50620766620.62446,
                    "msTypeName": 5
                },
                {
                    "id": 990796819002.8275,
                    "msSymbolArray": [
                        {
                            "id": 104983367686.58646,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 3,
                                "msSymbolIndex": 0
                            },
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "black"
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "msSymbolArray": [
                                {
                                    "id": 848531958776.7518,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 3,
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
                                    "vueKey": 686775712601.2333,
                                    "direction": "up",
                                    "type": "noteStem"
                                }
                            ],
                            "vueKey": 342782954303.69366,
                            "beamId": -1,
                            "type": "noteHead",
                            "region": {
                                "region": "lower",
                                "type": "space",
                                "index": 1
                            },
                            "chronaxie": 4
                        }
                    ],
                    "type": 3,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 3,
                        "msSymbolIndex": -1
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "transparent"
                    },
                    "vueKey": 1728202092934.9888,
                    "msTypeName": 5
                },
                {
                    "id": 648840965855.3826,
                    "msSymbolArray": [
                        {
                            "id": 563989113615.5653,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 4,
                                "msSymbolIndex": 0
                            },
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "black"
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "msSymbolArray": [
                                {
                                    "id": 1181307329229.0784,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 4,
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
                                    "vueKey": 1589538826889.395,
                                    "direction": "up",
                                    "type": "noteStem"
                                }
                            ],
                            "vueKey": 429616680441.6299,
                            "beamId": -1,
                            "type": "noteHead",
                            "region": {
                                "region": "lower",
                                "type": "line",
                                "index": 1
                            },
                            "chronaxie": 4
                        }
                    ],
                    "type": 3,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 4,
                        "msSymbolIndex": -1
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "transparent"
                    },
                    "vueKey": 1104374056139.2493,
                    "msTypeName": 5
                },
                {
                    "id": 1260325296167.6785,
                    "msSymbolArray": [
                        {
                            "id": 440841132927.37897,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 5,
                                "msSymbolIndex": 0
                            },
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "black"
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "msSymbolArray": [
                                {
                                    "id": 1369948628035.2014,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 5,
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
                                    "vueKey": 362572755233.1634,
                                    "direction": "up",
                                    "type": "noteStem"
                                }
                            ],
                            "vueKey": 452727568539.009,
                            "beamId": -1,
                            "type": "noteHead",
                            "region": {
                                "region": "main",
                                "type": "space",
                                "index": 1
                            },
                            "chronaxie": 4
                        }
                    ],
                    "type": 3,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 5,
                        "msSymbolIndex": -1
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "transparent"
                    },
                    "vueKey": 1003189864190.6251,
                    "msTypeName": 5
                },
                {
                    "id": 1629877089788.8298,
                    "msSymbolArray": [
                        {
                            "id": 1602693695926.3684,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 6,
                                "msSymbolIndex": 0
                            },
                            "options": {
                                "highlight": false,
                                "highlightColor": "red",
                                "color": "black"
                            },
                            "bindingStartId": [],
                            "bindingEndId": [],
                            "msSymbolArray": [
                                {
                                    "id": 1033904043486.6746,
                                    "msTypeName": 6,
                                    "index": {
                                        "multipleStavesIndex": 0,
                                        "singleStaffIndex": 0,
                                        "measureIndex": 0,
                                        "msSymbolContainerIndex": 6,
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
                                    "vueKey": 598873271565.8286,
                                    "direction": "up",
                                    "type": "noteStem"
                                }
                            ],
                            "vueKey": 862137864695.4152,
                            "beamId": -1,
                            "type": "noteHead",
                            "region": {
                                "region": "main",
                                "type": "line",
                                "index": 1
                            },
                            "chronaxie": 4
                        }
                    ],
                    "type": 3,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 6,
                        "msSymbolIndex": -1
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "transparent"
                    },
                    "vueKey": 1391502013959.3262,
                    "msTypeName": 5
                }
            ]
        },
        "1113694404157.2085": {
            "id": 1113694404157.2085,
            "msSymbolArray": [
                {
                    "id": 1234153615706.9077,
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
                    "vueKey": 372722215915.6898,
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
                "color": "transparent"
            },
            "vueKey": 1080490940872.5968,
            "msTypeName": 5
        },
        "1234153615706.9077": {
            "id": 1234153615706.9077,
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
            "vueKey": 372722215915.6898,
            "type": "barLine",
            "barLineType": 1
        },
        "1224320367521.279": {
            "id": 1224320367521.279,
            "msSymbolArray": [
                {
                    "id": 830094500074.2643,
                    "msTypeName": 6,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 1,
                        "msSymbolIndex": 0
                    },
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "black"
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "msSymbolArray": [
                        {
                            "id": 307444660479.81573,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 1,
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
                            "vueKey": 618752188855.3876,
                            "direction": "up",
                            "type": "noteStem"
                        }
                    ],
                    "vueKey": 1526621513391.7751,
                    "beamId": 2,
                    "type": "noteHead",
                    "region": {
                        "region": "lower",
                        "type": "line",
                        "index": 1
                    },
                    "chronaxie": 4
                }
            ],
            "type": 3,
            "index": {
                "multipleStavesIndex": 0,
                "singleStaffIndex": 0,
                "measureIndex": 0,
                "msSymbolContainerIndex": 1,
                "msSymbolIndex": -1
            },
            "bindingStartId": [],
            "bindingEndId": [],
            "options": {
                "highlight": false,
                "highlightColor": "red",
                "color": "transparent"
            },
            "vueKey": 1629092670473.3176,
            "msTypeName": 5
        },
        "830094500074.2643": {
            "id": 830094500074.2643,
            "msTypeName": 6,
            "index": {
                "multipleStavesIndex": 0,
                "singleStaffIndex": 0,
                "measureIndex": 0,
                "msSymbolContainerIndex": 1,
                "msSymbolIndex": 0
            },
            "options": {
                "highlight": false,
                "highlightColor": "red",
                "color": "black"
            },
            "bindingStartId": [],
            "bindingEndId": [],
            "msSymbolArray": [
                {
                    "id": 307444660479.81573,
                    "msTypeName": 6,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 1,
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
                    "vueKey": 618752188855.3876,
                    "direction": "up",
                    "type": "noteStem"
                }
            ],
            "vueKey": 1526621513391.7751,
            "beamId": 2,
            "type": "noteHead",
            "region": {
                "region": "lower",
                "type": "line",
                "index": 1
            },
            "chronaxie": 4
        },
        "456182458514.8327": {
            "id": 456182458514.8327,
            "msSymbolArray": [
                {
                    "id": 394577465430.6624,
                    "msTypeName": 6,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 2,
                        "msSymbolIndex": 0
                    },
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "black"
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "msSymbolArray": [
                        {
                            "id": 1571672633776.8738,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 2,
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
                            "vueKey": 349062432631.6606,
                            "direction": "up",
                            "type": "noteStem"
                        }
                    ],
                    "vueKey": 237110693730.39667,
                    "beamId": -1,
                    "type": "noteHead",
                    "region": {
                        "region": "lower",
                        "type": "line",
                        "index": 1
                    },
                    "chronaxie": 4
                }
            ],
            "type": 3,
            "index": {
                "multipleStavesIndex": 0,
                "singleStaffIndex": 0,
                "measureIndex": 0,
                "msSymbolContainerIndex": 2,
                "msSymbolIndex": -1
            },
            "bindingStartId": [],
            "bindingEndId": [],
            "options": {
                "highlight": false,
                "highlightColor": "red",
                "color": "transparent"
            },
            "vueKey": 50620766620.62446,
            "msTypeName": 5
        },
        "990796819002.8275": {
            "id": 990796819002.8275,
            "msSymbolArray": [
                {
                    "id": 104983367686.58646,
                    "msTypeName": 6,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 3,
                        "msSymbolIndex": 0
                    },
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "black"
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "msSymbolArray": [
                        {
                            "id": 848531958776.7518,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 3,
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
                            "vueKey": 686775712601.2333,
                            "direction": "up",
                            "type": "noteStem"
                        }
                    ],
                    "vueKey": 342782954303.69366,
                    "beamId": -1,
                    "type": "noteHead",
                    "region": {
                        "region": "lower",
                        "type": "space",
                        "index": 1
                    },
                    "chronaxie": 4
                }
            ],
            "type": 3,
            "index": {
                "multipleStavesIndex": 0,
                "singleStaffIndex": 0,
                "measureIndex": 0,
                "msSymbolContainerIndex": 3,
                "msSymbolIndex": -1
            },
            "bindingStartId": [],
            "bindingEndId": [],
            "options": {
                "highlight": false,
                "highlightColor": "red",
                "color": "transparent"
            },
            "vueKey": 1728202092934.9888,
            "msTypeName": 5
        },
        "648840965855.3826": {
            "id": 648840965855.3826,
            "msSymbolArray": [
                {
                    "id": 563989113615.5653,
                    "msTypeName": 6,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 4,
                        "msSymbolIndex": 0
                    },
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "black"
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "msSymbolArray": [
                        {
                            "id": 1181307329229.0784,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 4,
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
                            "vueKey": 1589538826889.395,
                            "direction": "up",
                            "type": "noteStem"
                        }
                    ],
                    "vueKey": 429616680441.6299,
                    "beamId": -1,
                    "type": "noteHead",
                    "region": {
                        "region": "lower",
                        "type": "line",
                        "index": 1
                    },
                    "chronaxie": 4
                }
            ],
            "type": 3,
            "index": {
                "multipleStavesIndex": 0,
                "singleStaffIndex": 0,
                "measureIndex": 0,
                "msSymbolContainerIndex": 4,
                "msSymbolIndex": -1
            },
            "bindingStartId": [],
            "bindingEndId": [],
            "options": {
                "highlight": false,
                "highlightColor": "red",
                "color": "transparent"
            },
            "vueKey": 1104374056139.2493,
            "msTypeName": 5
        },
        "1260325296167.6785": {
            "id": 1260325296167.6785,
            "msSymbolArray": [
                {
                    "id": 440841132927.37897,
                    "msTypeName": 6,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 5,
                        "msSymbolIndex": 0
                    },
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "black"
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "msSymbolArray": [
                        {
                            "id": 1369948628035.2014,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 5,
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
                            "vueKey": 362572755233.1634,
                            "direction": "up",
                            "type": "noteStem"
                        }
                    ],
                    "vueKey": 452727568539.009,
                    "beamId": -1,
                    "type": "noteHead",
                    "region": {
                        "region": "main",
                        "type": "space",
                        "index": 1
                    },
                    "chronaxie": 4
                }
            ],
            "type": 3,
            "index": {
                "multipleStavesIndex": 0,
                "singleStaffIndex": 0,
                "measureIndex": 0,
                "msSymbolContainerIndex": 5,
                "msSymbolIndex": -1
            },
            "bindingStartId": [],
            "bindingEndId": [],
            "options": {
                "highlight": false,
                "highlightColor": "red",
                "color": "transparent"
            },
            "vueKey": 1003189864190.6251,
            "msTypeName": 5
        },
        "1629877089788.8298": {
            "id": 1629877089788.8298,
            "msSymbolArray": [
                {
                    "id": 1602693695926.3684,
                    "msTypeName": 6,
                    "index": {
                        "multipleStavesIndex": 0,
                        "singleStaffIndex": 0,
                        "measureIndex": 0,
                        "msSymbolContainerIndex": 6,
                        "msSymbolIndex": 0
                    },
                    "options": {
                        "highlight": false,
                        "highlightColor": "red",
                        "color": "black"
                    },
                    "bindingStartId": [],
                    "bindingEndId": [],
                    "msSymbolArray": [
                        {
                            "id": 1033904043486.6746,
                            "msTypeName": 6,
                            "index": {
                                "multipleStavesIndex": 0,
                                "singleStaffIndex": 0,
                                "measureIndex": 0,
                                "msSymbolContainerIndex": 6,
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
                            "vueKey": 598873271565.8286,
                            "direction": "up",
                            "type": "noteStem"
                        }
                    ],
                    "vueKey": 862137864695.4152,
                    "beamId": -1,
                    "type": "noteHead",
                    "region": {
                        "region": "main",
                        "type": "line",
                        "index": 1
                    },
                    "chronaxie": 4
                }
            ],
            "type": 3,
            "index": {
                "multipleStavesIndex": 0,
                "singleStaffIndex": 0,
                "measureIndex": 0,
                "msSymbolContainerIndex": 6,
                "msSymbolIndex": -1
            },
            "bindingStartId": [],
            "bindingEndId": [],
            "options": {
                "highlight": false,
                "highlightColor": "red",
                "color": "transparent"
            },
            "vueKey": 1391502013959.3262,
            "msTypeName": 5
        }
    },
    "vueKey": 894911242522.5442,
    "style": null
}

export default data;