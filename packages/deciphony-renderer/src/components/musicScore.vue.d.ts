import type { MusicScore } from '@/types/MusicScoreType';
import type { Skin, SlotConfig, VDom } from '@/types/common';
type __VLS_Props = {
    data: MusicScore;
    /** 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关 */
    slotConfig?: SlotConfig;
    /** 多套皮肤包：{ default: SkinPack, active?: SkinPack }；default 覆盖内置；用于符号级 skinName 切换 */
    skin?: Skin;
    skinName?: string;
};
/**
 * 更新 VDom：传入 updater 对深拷贝后的 vDom 做修改（如替换某符号 skinName），仅替换有变化的节点，实现部分重渲染
 * @param updater (vDom: VDom[]) => VDom[] 用户修改后 return
 */
declare function updateVDomHandler(updater: (vDom: VDom[]) => VDom[]): void;
declare var __VLS_14: import("@/types/common").SlotName | undefined, __VLS_15: {
    node: {
        x: number;
        y: number;
        w: number;
        h: number;
        startPoint: {
            x: number;
            y: number;
        };
        endPoint: {
            x: number;
            y: number;
        };
        targetId: string;
        zIndex: number;
        tag: import("@/types/common").VDomTagType;
        skinKey?: import("@/types/common").SkinKey;
        skinName: string;
        slotName?: import("@/types/common").SlotName;
        slotData?: {
            id: string;
            staves: {
                id: string;
                measures: {
                    id: string;
                    notes: ({
                        id: string;
                        type: import("@/enums/musicScoreEnum").NoteSymbolTypeEnum.Note;
                        direction: "up" | "down";
                        voicePart: {
                            chronaxie: import("@/types/common").Chronaxie;
                            notesInfo: {
                                id: string;
                                region: number;
                                accidental?: {
                                    id: string;
                                    type: import("@/enums/musicScoreEnum").AccidentalTypeEnum;
                                    widthRatio?: number;
                                    widthRatioForMeasure?: number;
                                    relativeX: number;
                                    relativeY: number;
                                    relativeW: number;
                                    relativeH: number;
                                };
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            }[];
                            augmentationDot?: {
                                id: string;
                                count: 1 | 2 | 3;
                                widthRatio?: number;
                                widthRatioForMeasure?: number;
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            };
                            affiliatedSymbols: {
                                id: string;
                                name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                                data: {};
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            }[];
                            beamType: import("@/enums/musicScoreEnum").BeamTypeEnum;
                        };
                        voicePart2?: {
                            chronaxie: import("@/types/common").Chronaxie;
                            notesInfo: {
                                id: string;
                                region: number;
                                accidental?: {
                                    id: string;
                                    type: import("@/enums/musicScoreEnum").AccidentalTypeEnum;
                                    widthRatio?: number;
                                    widthRatioForMeasure?: number;
                                    relativeX: number;
                                    relativeY: number;
                                    relativeW: number;
                                    relativeH: number;
                                };
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            }[];
                            augmentationDot?: {
                                id: string;
                                count: 1 | 2 | 3;
                                widthRatio?: number;
                                widthRatioForMeasure?: number;
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            };
                            affiliatedSymbols: {
                                id: string;
                                name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                                data: {};
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            }[];
                            beamType: import("@/enums/musicScoreEnum").BeamTypeEnum;
                        };
                        clef?: {
                            id: string;
                            clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                            widthRatio?: number;
                            widthRatioForMeasure?: number;
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        };
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    } | {
                        id: string;
                        type: import("@/enums/musicScoreEnum").NoteSymbolTypeEnum.Rest;
                        chronaxie: import("@/types/common").Chronaxie;
                        augmentationDot?: {
                            id: string;
                            count: 1 | 2 | 3;
                            widthRatio?: number;
                            widthRatioForMeasure?: number;
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        };
                        affiliatedSymbols: {
                            id: string;
                            name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                            data: {};
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        }[];
                        clef?: {
                            id: string;
                            clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                            widthRatio?: number;
                            widthRatioForMeasure?: number;
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        };
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    })[] | {
                        id: string;
                        voicePart: {
                            chronaxie: import("@/types/common").Chronaxie;
                            notesInfo: {
                                id: string;
                                syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | "X";
                                accidental?: {
                                    id: string;
                                    type: import("@/enums/musicScoreEnum").AccidentalTypeEnum;
                                    widthRatio?: number;
                                    widthRatioForMeasure?: number;
                                    relativeX: number;
                                    relativeY: number;
                                    relativeW: number;
                                    relativeH: number;
                                };
                                octaveDot: -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;
                            }[];
                            augmentationDot?: {
                                id: string;
                                count: 1 | 2 | 3;
                                widthRatio?: number;
                                widthRatioForMeasure?: number;
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            };
                            affiliatedSymbols: {
                                id: string;
                                name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                                data: {};
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            }[];
                            beamType: import("@/enums/musicScoreEnum").BeamTypeEnum;
                        };
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    }[];
                    barline_f?: {
                        id: string;
                        barlineType: import("@/enums/musicScoreEnum").BarlineTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    barline_b?: {
                        id: string;
                        barlineType: import("@/enums/musicScoreEnum").BarlineTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    clef_f?: {
                        id: string;
                        clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    clef_b?: {
                        id: string;
                        clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    keySignature_f?: {
                        id: string;
                        type: import("@/enums/musicScoreEnum").KeySignatureTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    keySignature_b?: {
                        id: string;
                        type: import("@/enums/musicScoreEnum").KeySignatureTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    timeSignature_f?: {
                        id: string;
                        type: import("@/enums/musicScoreEnum").TimeSignatureTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    timeSignature_b?: {
                        id: string;
                        type: import("@/enums/musicScoreEnum").TimeSignatureTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    widthRatioForMeasure?: number;
                    affiliatedSymbols: {
                        id: string;
                        name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                        data: {};
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    }[];
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                }[];
                uSpaceO: number;
                uSpaceI: number;
                dSpaceI: number;
                dSpaceO: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            }[];
            uSpace: number;
            dSpace: number;
            linkedStaff?: boolean;
            relativeX: number;
            relativeY: number;
            relativeW: number;
            relativeH: number;
        } | {
            id: string;
            measures: {
                id: string;
                notes: ({
                    id: string;
                    type: import("@/enums/musicScoreEnum").NoteSymbolTypeEnum.Note;
                    direction: "up" | "down";
                    voicePart: {
                        chronaxie: import("@/types/common").Chronaxie;
                        notesInfo: {
                            id: string;
                            region: number;
                            accidental?: {
                                id: string;
                                type: import("@/enums/musicScoreEnum").AccidentalTypeEnum;
                                widthRatio?: number;
                                widthRatioForMeasure?: number;
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            };
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        }[];
                        augmentationDot?: {
                            id: string;
                            count: 1 | 2 | 3;
                            widthRatio?: number;
                            widthRatioForMeasure?: number;
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        };
                        affiliatedSymbols: {
                            id: string;
                            name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                            data: {};
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        }[];
                        beamType: import("@/enums/musicScoreEnum").BeamTypeEnum;
                    };
                    voicePart2?: {
                        chronaxie: import("@/types/common").Chronaxie;
                        notesInfo: {
                            id: string;
                            region: number;
                            accidental?: {
                                id: string;
                                type: import("@/enums/musicScoreEnum").AccidentalTypeEnum;
                                widthRatio?: number;
                                widthRatioForMeasure?: number;
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            };
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        }[];
                        augmentationDot?: {
                            id: string;
                            count: 1 | 2 | 3;
                            widthRatio?: number;
                            widthRatioForMeasure?: number;
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        };
                        affiliatedSymbols: {
                            id: string;
                            name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                            data: {};
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        }[];
                        beamType: import("@/enums/musicScoreEnum").BeamTypeEnum;
                    };
                    clef?: {
                        id: string;
                        clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                } | {
                    id: string;
                    type: import("@/enums/musicScoreEnum").NoteSymbolTypeEnum.Rest;
                    chronaxie: import("@/types/common").Chronaxie;
                    augmentationDot?: {
                        id: string;
                        count: 1 | 2 | 3;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    affiliatedSymbols: {
                        id: string;
                        name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                        data: {};
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    }[];
                    clef?: {
                        id: string;
                        clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                })[] | {
                    id: string;
                    voicePart: {
                        chronaxie: import("@/types/common").Chronaxie;
                        notesInfo: {
                            id: string;
                            syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | "X";
                            accidental?: {
                                id: string;
                                type: import("@/enums/musicScoreEnum").AccidentalTypeEnum;
                                widthRatio?: number;
                                widthRatioForMeasure?: number;
                                relativeX: number;
                                relativeY: number;
                                relativeW: number;
                                relativeH: number;
                            };
                            octaveDot: -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;
                        }[];
                        augmentationDot?: {
                            id: string;
                            count: 1 | 2 | 3;
                            widthRatio?: number;
                            widthRatioForMeasure?: number;
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        };
                        affiliatedSymbols: {
                            id: string;
                            name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                            data: {};
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        }[];
                        beamType: import("@/enums/musicScoreEnum").BeamTypeEnum;
                    };
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                }[];
                barline_f?: {
                    id: string;
                    barlineType: import("@/enums/musicScoreEnum").BarlineTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                barline_b?: {
                    id: string;
                    barlineType: import("@/enums/musicScoreEnum").BarlineTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                clef_f?: {
                    id: string;
                    clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                clef_b?: {
                    id: string;
                    clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                keySignature_f?: {
                    id: string;
                    type: import("@/enums/musicScoreEnum").KeySignatureTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                keySignature_b?: {
                    id: string;
                    type: import("@/enums/musicScoreEnum").KeySignatureTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                timeSignature_f?: {
                    id: string;
                    type: import("@/enums/musicScoreEnum").TimeSignatureTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                timeSignature_b?: {
                    id: string;
                    type: import("@/enums/musicScoreEnum").TimeSignatureTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                widthRatioForMeasure?: number;
                affiliatedSymbols: {
                    id: string;
                    name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                    data: {};
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                }[];
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            }[];
            uSpaceO: number;
            uSpaceI: number;
            dSpaceI: number;
            dSpaceO: number;
            relativeX: number;
            relativeY: number;
            relativeW: number;
            relativeH: number;
        } | {
            id: string;
            notes: ({
                id: string;
                type: import("@/enums/musicScoreEnum").NoteSymbolTypeEnum.Note;
                direction: "up" | "down";
                voicePart: {
                    chronaxie: import("@/types/common").Chronaxie;
                    notesInfo: {
                        id: string;
                        region: number;
                        accidental?: {
                            id: string;
                            type: import("@/enums/musicScoreEnum").AccidentalTypeEnum;
                            widthRatio?: number;
                            widthRatioForMeasure?: number;
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        };
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    }[];
                    augmentationDot?: {
                        id: string;
                        count: 1 | 2 | 3;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    affiliatedSymbols: {
                        id: string;
                        name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                        data: {};
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    }[];
                    beamType: import("@/enums/musicScoreEnum").BeamTypeEnum;
                };
                voicePart2?: {
                    chronaxie: import("@/types/common").Chronaxie;
                    notesInfo: {
                        id: string;
                        region: number;
                        accidental?: {
                            id: string;
                            type: import("@/enums/musicScoreEnum").AccidentalTypeEnum;
                            widthRatio?: number;
                            widthRatioForMeasure?: number;
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        };
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    }[];
                    augmentationDot?: {
                        id: string;
                        count: 1 | 2 | 3;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    affiliatedSymbols: {
                        id: string;
                        name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                        data: {};
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    }[];
                    beamType: import("@/enums/musicScoreEnum").BeamTypeEnum;
                };
                clef?: {
                    id: string;
                    clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            } | {
                id: string;
                type: import("@/enums/musicScoreEnum").NoteSymbolTypeEnum.Rest;
                chronaxie: import("@/types/common").Chronaxie;
                augmentationDot?: {
                    id: string;
                    count: 1 | 2 | 3;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                affiliatedSymbols: {
                    id: string;
                    name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                    data: {};
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                }[];
                clef?: {
                    id: string;
                    clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                    widthRatio?: number;
                    widthRatioForMeasure?: number;
                    relativeX: number;
                    relativeY: number;
                    relativeW: number;
                    relativeH: number;
                };
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            })[] | {
                id: string;
                voicePart: {
                    chronaxie: import("@/types/common").Chronaxie;
                    notesInfo: {
                        id: string;
                        syllable: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | "X";
                        accidental?: {
                            id: string;
                            type: import("@/enums/musicScoreEnum").AccidentalTypeEnum;
                            widthRatio?: number;
                            widthRatioForMeasure?: number;
                            relativeX: number;
                            relativeY: number;
                            relativeW: number;
                            relativeH: number;
                        };
                        octaveDot: -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;
                    }[];
                    augmentationDot?: {
                        id: string;
                        count: 1 | 2 | 3;
                        widthRatio?: number;
                        widthRatioForMeasure?: number;
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    };
                    affiliatedSymbols: {
                        id: string;
                        name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                        data: {};
                        relativeX: number;
                        relativeY: number;
                        relativeW: number;
                        relativeH: number;
                    }[];
                    beamType: import("@/enums/musicScoreEnum").BeamTypeEnum;
                };
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            }[];
            barline_f?: {
                id: string;
                barlineType: import("@/enums/musicScoreEnum").BarlineTypeEnum;
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            };
            barline_b?: {
                id: string;
                barlineType: import("@/enums/musicScoreEnum").BarlineTypeEnum;
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            };
            clef_f?: {
                id: string;
                clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            };
            clef_b?: {
                id: string;
                clefType: import("@/enums/musicScoreEnum").ClefTypeEnum;
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            };
            keySignature_f?: {
                id: string;
                type: import("@/enums/musicScoreEnum").KeySignatureTypeEnum;
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            };
            keySignature_b?: {
                id: string;
                type: import("@/enums/musicScoreEnum").KeySignatureTypeEnum;
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            };
            timeSignature_f?: {
                id: string;
                type: import("@/enums/musicScoreEnum").TimeSignatureTypeEnum;
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            };
            timeSignature_b?: {
                id: string;
                type: import("@/enums/musicScoreEnum").TimeSignatureTypeEnum;
                widthRatio?: number;
                widthRatioForMeasure?: number;
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            };
            widthRatioForMeasure?: number;
            affiliatedSymbols: {
                id: string;
                name: import("@/enums/musicScoreEnum").SingleAffiliatedSymbolNameEnum;
                data: {};
                relativeX: number;
                relativeY: number;
                relativeW: number;
                relativeH: number;
            }[];
            relativeX: number;
            relativeY: number;
            relativeW: number;
            relativeH: number;
        };
        dataComment?: string;
        special: {
            slur?: {
                relativeStartPoint: {
                    x: number;
                    y: number;
                };
                relativeEndPoint: {
                    x: number;
                    y: number;
                };
                relativeControlPoint: {
                    x: number;
                    y: number;
                };
                thickness: number;
            };
            volta?: Record<string, unknown>;
            beam?: {
                lines: {
                    type: "left" | "right" | "both" | "none";
                    scaleX?: number;
                }[];
                centerX: number;
                spacing: number;
                thickness: number;
                direction: "up" | "down";
            };
        };
    };
};
type __VLS_Slots = {} & {
    [K in NonNullable<typeof __VLS_14>]?: (props: typeof __VLS_15) => any;
};
declare const __VLS_component: import("vue").DefineComponent<__VLS_Props, {
    updateVDom: typeof updateVDomHandler;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    renderMusicScore: (vDom: VDom[]) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{
    onRenderMusicScore?: (vDom: VDom[]) => any;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: __VLS_WithSlots<typeof __VLS_component, __VLS_Slots>;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
