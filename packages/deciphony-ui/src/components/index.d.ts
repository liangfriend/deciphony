import DsVideo from './ds-video';
import DsIcon from './ds-icon';
import DsProgressBar from './ds-progress-bar';
import DsModelBox from './ds-model-box';
import DsFloatingWindow from './ds-floating-window';
import DsBgAudioPlayer from './ds-bg-audio-player';
import DsWhiteboard from './ds-whiteboard';
import DsKeyboard from './ds-keyboard';
import DsPiano from './ds-piano';
import DsPerformEvaluation from "./ds-perform-evaluation/index.vue";
import DsPianoWaterfall from "./ds-piano-waterfall/index";
declare const components: {
    DsVideo: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        playButtonImg: {
            type: StringConstructor;
            default: string;
        };
        pauseButtonImg: {
            type: StringConstructor;
            default: string;
        };
        nextButtonImg: {
            type: StringConstructor;
            default: string;
        };
        progressBgImg: {
            type: StringConstructor;
            default: string;
        };
        startPlay: {
            type: BooleanConstructor;
            default: boolean;
        };
        title: {
            type: StringConstructor;
            default: string;
        };
        progressPlayedImg: {
            type: StringConstructor;
            default: string;
        };
        progressThumbImg: {
            type: StringConstructor;
            default: string;
        };
        placeholderImg: {
            type: StringConstructor;
            default: string;
        };
        controlsHeight: {
            type: StringConstructor;
            default: string;
        };
        hidden: {
            type: ArrayConstructor;
            default: () => never[];
        };
        srcList: {
            type: import("vue").PropType<Array<{
                url: string;
                title: string;
            }>>;
            default: () => never[];
        };
    }>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
        back: (...args: any[]) => void;
    }, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        playButtonImg: {
            type: StringConstructor;
            default: string;
        };
        pauseButtonImg: {
            type: StringConstructor;
            default: string;
        };
        nextButtonImg: {
            type: StringConstructor;
            default: string;
        };
        progressBgImg: {
            type: StringConstructor;
            default: string;
        };
        startPlay: {
            type: BooleanConstructor;
            default: boolean;
        };
        title: {
            type: StringConstructor;
            default: string;
        };
        progressPlayedImg: {
            type: StringConstructor;
            default: string;
        };
        progressThumbImg: {
            type: StringConstructor;
            default: string;
        };
        placeholderImg: {
            type: StringConstructor;
            default: string;
        };
        controlsHeight: {
            type: StringConstructor;
            default: string;
        };
        hidden: {
            type: ArrayConstructor;
            default: () => never[];
        };
        srcList: {
            type: import("vue").PropType<Array<{
                url: string;
                title: string;
            }>>;
            default: () => never[];
        };
    }>> & Readonly<{
        onBack?: (...args: any[]) => any;
    }>, {
        hidden: unknown[];
        title: string;
        playButtonImg: string;
        pauseButtonImg: string;
        nextButtonImg: string;
        progressBgImg: string;
        startPlay: boolean;
        progressPlayedImg: string;
        progressThumbImg: string;
        placeholderImg: string;
        controlsHeight: string;
        srcList: {
            url: string;
            title: string;
        }[];
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    DsIcon: import("vue").DefineComponent<{
        name: string;
        size?: number | string;
        color?: string;
    }, {
        getSvgBlob: () => Blob;
    }, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{
        name: string;
        size?: number | string;
        color?: string;
    }> & Readonly<{}>, {
        color: string;
        size: number | string;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
    DsProgressBar: any;
    DsModelBox: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        type: {
            default: DsProgressBar;
            type: import("vue").PropType<DsProgressBar>;
        };
        model: {
            default: DsProgressBar;
            type: import("vue").PropType<DsProgressBar>;
        };
    }>, {
        modelRef: import("vue").Ref<null, null>;
    }, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        type: {
            default: DsProgressBar;
            type: import("vue").PropType<DsProgressBar>;
        };
        model: {
            default: DsProgressBar;
            type: import("vue").PropType<DsProgressBar>;
        };
    }>> & Readonly<{}>, {
        type: BoxType;
        model: ModelEnum;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    DsFloatingWindow: {
        new (...args: any[]): import("vue").CreateComponentPublicInstanceWithMixins<Readonly<import("vue").ExtractPropTypes<{
            modelValue: {
                type: BooleanConstructor;
                default: boolean;
            };
            initialX: {
                type: NumberConstructor;
                default: number;
            };
            initialY: {
                type: NumberConstructor;
                default: number;
            };
            center: {
                type: BooleanConstructor;
                default: boolean;
            };
            dragHandleHeight: {
                type: NumberConstructor;
                default: number;
            };
            onlyLeftHandleWidth: {
                type: NumberConstructor;
                default: null;
            };
            restrictToViewport: {
                type: BooleanConstructor;
                default: boolean;
            };
            title: {
                type: StringConstructor;
                default: string;
            };
            zIndex: {
                type: NumberConstructor;
                default: number;
            };
            height: {
                type: StringConstructor;
                default: string;
            };
            width: {
                type: StringConstructor;
                default: string;
            };
            ballImage: {
                type: StringConstructor;
                default: string;
            };
            ballSize: {
                type: NumberConstructor;
                default: number;
            };
        }>> & Readonly<{
            onClose?: (...args: any[]) => any;
            onMove?: (...args: any[]) => any;
            "onUpdate:modelValue"?: (...args: any[]) => any;
        }>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
            close: (...args: any[]) => void;
            move: (...args: any[]) => void;
            "update:modelValue": (...args: any[]) => void;
        }, import("vue").PublicProps, {
            width: string;
            height: string;
            center: boolean;
            title: string;
            zIndex: number;
            modelValue: boolean;
            initialX: number;
            initialY: number;
            dragHandleHeight: number;
            onlyLeftHandleWidth: number;
            restrictToViewport: boolean;
            ballImage: string;
            ballSize: number;
        }, true, {}, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, {}, any, import("vue").ComponentProvideOptions, {
            P: {};
            B: {};
            D: {};
            C: {};
            M: {};
            Defaults: {};
        }, Readonly<import("vue").ExtractPropTypes<{
            modelValue: {
                type: BooleanConstructor;
                default: boolean;
            };
            initialX: {
                type: NumberConstructor;
                default: number;
            };
            initialY: {
                type: NumberConstructor;
                default: number;
            };
            center: {
                type: BooleanConstructor;
                default: boolean;
            };
            dragHandleHeight: {
                type: NumberConstructor;
                default: number;
            };
            onlyLeftHandleWidth: {
                type: NumberConstructor;
                default: null;
            };
            restrictToViewport: {
                type: BooleanConstructor;
                default: boolean;
            };
            title: {
                type: StringConstructor;
                default: string;
            };
            zIndex: {
                type: NumberConstructor;
                default: number;
            };
            height: {
                type: StringConstructor;
                default: string;
            };
            width: {
                type: StringConstructor;
                default: string;
            };
            ballImage: {
                type: StringConstructor;
                default: string;
            };
            ballSize: {
                type: NumberConstructor;
                default: number;
            };
        }>> & Readonly<{
            onClose?: (...args: any[]) => any;
            onMove?: (...args: any[]) => any;
            "onUpdate:modelValue"?: (...args: any[]) => any;
        }>, {}, {}, {}, {}, {
            width: string;
            height: string;
            center: boolean;
            title: string;
            zIndex: number;
            modelValue: boolean;
            initialX: number;
            initialY: number;
            dragHandleHeight: number;
            onlyLeftHandleWidth: number;
            restrictToViewport: boolean;
            ballImage: string;
            ballSize: number;
        }>;
        __isFragment?: never;
        __isTeleport?: never;
        __isSuspense?: never;
    } & import("vue").ComponentOptionsBase<Readonly<import("vue").ExtractPropTypes<{
        modelValue: {
            type: BooleanConstructor;
            default: boolean;
        };
        initialX: {
            type: NumberConstructor;
            default: number;
        };
        initialY: {
            type: NumberConstructor;
            default: number;
        };
        center: {
            type: BooleanConstructor;
            default: boolean;
        };
        dragHandleHeight: {
            type: NumberConstructor;
            default: number;
        };
        onlyLeftHandleWidth: {
            type: NumberConstructor;
            default: null;
        };
        restrictToViewport: {
            type: BooleanConstructor;
            default: boolean;
        };
        title: {
            type: StringConstructor;
            default: string;
        };
        zIndex: {
            type: NumberConstructor;
            default: number;
        };
        height: {
            type: StringConstructor;
            default: string;
        };
        width: {
            type: StringConstructor;
            default: string;
        };
        ballImage: {
            type: StringConstructor;
            default: string;
        };
        ballSize: {
            type: NumberConstructor;
            default: number;
        };
    }>> & Readonly<{
        onClose?: (...args: any[]) => any;
        onMove?: (...args: any[]) => any;
        "onUpdate:modelValue"?: (...args: any[]) => any;
    }>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
        close: (...args: any[]) => void;
        move: (...args: any[]) => void;
        "update:modelValue": (...args: any[]) => void;
    }, string, {
        width: string;
        height: string;
        center: boolean;
        title: string;
        zIndex: number;
        modelValue: boolean;
        initialX: number;
        initialY: number;
        dragHandleHeight: number;
        onlyLeftHandleWidth: number;
        restrictToViewport: boolean;
        ballImage: string;
        ballSize: number;
    }, {}, string, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, import("vue").ComponentProvideOptions> & import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps & (new () => {
        $slots: {
            title?: (props: {}) => any;
        } & {
            default?: (props: {}) => any;
        };
    });
    DsBgAudioPlayer: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        songs: {
            type: import("vue").PropType<{
                src: string;
                title: string;
                image: string;
            }[]>;
            required: true;
        };
    }>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        songs: {
            type: import("vue").PropType<{
                src: string;
                title: string;
                image: string;
            }[]>;
            required: true;
        };
    }>> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    DsWhiteboard: {
        new (...args: any[]): import("vue").CreateComponentPublicInstanceWithMixins<Readonly<import("vue").ExtractPropTypes<{
            width: {
                type: NumberConstructor;
                default: string;
            };
            height: {
                type: NumberConstructor;
                default: string;
            };
            floatBoardWidth: {
                type: NumberConstructor;
                default: string;
            };
            floatBoardHeight: {
                type: NumberConstructor;
                default: string;
            };
            floatBoardPosition: {
                type: StringConstructor;
                default: string;
            };
            drag: {
                type: BooleanConstructor;
                default: boolean;
            };
        }>> & Readonly<{}>, {
            addElement: (options: import("./ds-whiteboard/types").AddElementOptions, key?: string) => void;
            cacheElement: (element: Element, key?: string) => void;
            delCacheElement: (key?: string) => void;
            switchState: (param: import("./ds-whiteboard/enum").whiteBoardState) => void;
            state: import("vue").Ref<import("./ds-whiteboard/enum").whiteBoardState, import("./ds-whiteboard/enum").whiteBoardState>;
            exportJson: () => string;
            importJson: (jsonData: string | DsProgressBar, elementFactory: (data: DsProgressBar) => Element) => void;
        }, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, import("vue").PublicProps, {
            width: number;
            height: number;
            drag: boolean;
            floatBoardWidth: number;
            floatBoardHeight: number;
            floatBoardPosition: string;
        }, true, {}, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, {}, any, import("vue").ComponentProvideOptions, {
            P: {};
            B: {};
            D: {};
            C: {};
            M: {};
            Defaults: {};
        }, Readonly<import("vue").ExtractPropTypes<{
            width: {
                type: NumberConstructor;
                default: string;
            };
            height: {
                type: NumberConstructor;
                default: string;
            };
            floatBoardWidth: {
                type: NumberConstructor;
                default: string;
            };
            floatBoardHeight: {
                type: NumberConstructor;
                default: string;
            };
            floatBoardPosition: {
                type: StringConstructor;
                default: string;
            };
            drag: {
                type: BooleanConstructor;
                default: boolean;
            };
        }>> & Readonly<{}>, {
            addElement: (options: import("./ds-whiteboard/types").AddElementOptions, key?: string) => void;
            cacheElement: (element: Element, key?: string) => void;
            delCacheElement: (key?: string) => void;
            switchState: (param: import("./ds-whiteboard/enum").whiteBoardState) => void;
            state: import("vue").Ref<import("./ds-whiteboard/enum").whiteBoardState, import("./ds-whiteboard/enum").whiteBoardState>;
            exportJson: () => string;
            importJson: (jsonData: string | DsProgressBar, elementFactory: (data: DsProgressBar) => Element) => void;
        }, {}, {}, {}, {
            width: number;
            height: number;
            drag: boolean;
            floatBoardWidth: number;
            floatBoardHeight: number;
            floatBoardPosition: string;
        }>;
        __isFragment?: never;
        __isTeleport?: never;
        __isSuspense?: never;
    } & import("vue").ComponentOptionsBase<Readonly<import("vue").ExtractPropTypes<{
        width: {
            type: NumberConstructor;
            default: string;
        };
        height: {
            type: NumberConstructor;
            default: string;
        };
        floatBoardWidth: {
            type: NumberConstructor;
            default: string;
        };
        floatBoardHeight: {
            type: NumberConstructor;
            default: string;
        };
        floatBoardPosition: {
            type: StringConstructor;
            default: string;
        };
        drag: {
            type: BooleanConstructor;
            default: boolean;
        };
    }>> & Readonly<{}>, {
        addElement: (options: import("./ds-whiteboard/types").AddElementOptions, key?: string) => void;
        cacheElement: (element: Element, key?: string) => void;
        delCacheElement: (key?: string) => void;
        switchState: (param: import("./ds-whiteboard/enum").whiteBoardState) => void;
        state: import("vue").Ref<import("./ds-whiteboard/enum").whiteBoardState, import("./ds-whiteboard/enum").whiteBoardState>;
        exportJson: () => string;
        importJson: (jsonData: string | DsProgressBar, elementFactory: (data: DsProgressBar) => Element) => void;
    }, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, {
        width: number;
        height: number;
        drag: boolean;
        floatBoardWidth: number;
        floatBoardHeight: number;
        floatBoardPosition: string;
    }, {}, string, {}, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, import("vue").ComponentProvideOptions> & import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps & (new () => {
        $slots: {
            menu?: (props: {}) => any;
        };
    });
    DsKeyboard: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        width: {
            type: StringConstructor;
            default: string;
        };
        height: {
            type: StringConstructor;
            default: string;
        };
        highlightStyle: {
            type: () => import("vue").CSSProperties;
            default: () => {
                backgroundColor: string;
                color: string;
            };
        };
        config: {
            type: import("vue").PropType<{
                code: import("..").KeyCodeEnum;
                showText?: string;
                fontSize?: string;
            }[]>;
            default: () => never[];
        };
    }>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
        keyDown: (...args: any[]) => void;
        keyUp: (...args: any[]) => void;
    }, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        width: {
            type: StringConstructor;
            default: string;
        };
        height: {
            type: StringConstructor;
            default: string;
        };
        highlightStyle: {
            type: () => import("vue").CSSProperties;
            default: () => {
                backgroundColor: string;
                color: string;
            };
        };
        config: {
            type: import("vue").PropType<{
                code: import("..").KeyCodeEnum;
                showText?: string;
                fontSize?: string;
            }[]>;
            default: () => never[];
        };
    }>> & Readonly<{
        onKeyDown?: (...args: any[]) => any;
        onKeyUp?: (...args: any[]) => any;
    }>, {
        width: string;
        height: string;
        config: {
            code: import("..").KeyCodeEnum;
            showText?: string;
            fontSize?: string;
        }[];
        highlightStyle: import("vue").CSSProperties;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    DsPiano: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        height: {
            type: StringConstructor;
            default: string;
        };
        whiteKeyWidth: {
            type: StringConstructor;
            default: string;
        };
        blackKeyWidthRatio: {
            type: NumberConstructor;
            default: number;
        };
        blackKeyHeightRatio: {
            type: NumberConstructor;
            default: number;
        };
        config: {
            type: import("vue").PropType<{
                keyboard: {
                    code: import("..").KeyCodeEnum;
                    midi: number;
                }[];
            }>;
            default: () => {
                keyboard: {
                    code: string;
                    midi: number;
                }[];
            };
        };
        midi: {
            type: import("vue").PropType<{
                min: number;
                max: number;
            }>;
            default: () => {
                min: number;
                max: number;
            };
        };
        pitchNotation: {
            type: StringConstructor;
            default: string;
        };
        intervalRuler: {
            type: BooleanConstructor;
            default: boolean;
        };
        chordBox: {
            type: BooleanConstructor;
            default: boolean;
        };
        group: {
            type: BooleanConstructor;
            default: boolean;
        };
    }>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {} & {
        keyDown: (key: {
            midi: number;
            black: boolean;
            scientificNoteName: string[];
            helmholtzNoteName: string[];
        }) => any;
        keyUp: (key: {
            midi: number;
            black: boolean;
            scientificNoteName: string[];
            helmholtzNoteName: string[];
        }) => any;
    }, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        height: {
            type: StringConstructor;
            default: string;
        };
        whiteKeyWidth: {
            type: StringConstructor;
            default: string;
        };
        blackKeyWidthRatio: {
            type: NumberConstructor;
            default: number;
        };
        blackKeyHeightRatio: {
            type: NumberConstructor;
            default: number;
        };
        config: {
            type: import("vue").PropType<{
                keyboard: {
                    code: import("..").KeyCodeEnum;
                    midi: number;
                }[];
            }>;
            default: () => {
                keyboard: {
                    code: string;
                    midi: number;
                }[];
            };
        };
        midi: {
            type: import("vue").PropType<{
                min: number;
                max: number;
            }>;
            default: () => {
                min: number;
                max: number;
            };
        };
        pitchNotation: {
            type: StringConstructor;
            default: string;
        };
        intervalRuler: {
            type: BooleanConstructor;
            default: boolean;
        };
        chordBox: {
            type: BooleanConstructor;
            default: boolean;
        };
        group: {
            type: BooleanConstructor;
            default: boolean;
        };
    }>> & Readonly<{
        onKeyDown?: (key: {
            midi: number;
            black: boolean;
            scientificNoteName: string[];
            helmholtzNoteName: string[];
        }) => any;
        onKeyUp?: (key: {
            midi: number;
            black: boolean;
            scientificNoteName: string[];
            helmholtzNoteName: string[];
        }) => any;
    }>, {
        height: string;
        config: {
            keyboard: {
                code: import("..").KeyCodeEnum;
                midi: number;
            }[];
        };
        midi: {
            min: number;
            max: number;
        };
        group: boolean;
        whiteKeyWidth: string;
        blackKeyWidthRatio: number;
        blackKeyHeightRatio: number;
        pitchNotation: string;
        intervalRuler: boolean;
        chordBox: boolean;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    DsPianoWaterfall: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        height: {
            type: StringConstructor;
            default: string;
        };
        whiteKeyWidth: {
            type: StringConstructor;
            default: string;
        };
        blackKeyWidthRatio: {
            type: NumberConstructor;
            default: number;
        };
        config: {
            type: import("vue").PropType<{
                keyboard: {
                    code: import("..").KeyCodeEnum;
                    midi: number;
                }[];
            }>;
            default: () => {
                keyboard: {
                    code: string;
                    midi: number;
                }[];
            };
        };
        bpm: {
            type: NumberConstructor;
            default: number;
        };
        columnHeightConstant: {
            type: NumberConstructor;
            default: number;
        };
        prepareTime: {
            type: NumberConstructor;
            default: number;
        };
        performSequence: {
            default: () => {
                '60': number[][];
                '61': number[][];
                '62': number[][];
            };
        };
        midi: {
            type: import("vue").PropType<{
                min: number;
                max: number;
            }>;
            default: () => {
                min: number;
                max: number;
            };
        };
        baseLineBottom: {
            type: NumberConstructor;
            default: number;
        };
        highlightPolicy: {
            type: import("vue").PropType<Partial<DsProgressBar>>;
            default: () => {};
        };
    }>, {
        play: () => void;
        pause: () => void;
        stop: () => void;
        clearActiveParts: () => void;
    }, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        height: {
            type: StringConstructor;
            default: string;
        };
        whiteKeyWidth: {
            type: StringConstructor;
            default: string;
        };
        blackKeyWidthRatio: {
            type: NumberConstructor;
            default: number;
        };
        config: {
            type: import("vue").PropType<{
                keyboard: {
                    code: import("..").KeyCodeEnum;
                    midi: number;
                }[];
            }>;
            default: () => {
                keyboard: {
                    code: string;
                    midi: number;
                }[];
            };
        };
        bpm: {
            type: NumberConstructor;
            default: number;
        };
        columnHeightConstant: {
            type: NumberConstructor;
            default: number;
        };
        prepareTime: {
            type: NumberConstructor;
            default: number;
        };
        performSequence: {
            default: () => {
                '60': number[][];
                '61': number[][];
                '62': number[][];
            };
        };
        midi: {
            type: import("vue").PropType<{
                min: number;
                max: number;
            }>;
            default: () => {
                min: number;
                max: number;
            };
        };
        baseLineBottom: {
            type: NumberConstructor;
            default: number;
        };
        highlightPolicy: {
            type: import("vue").PropType<Partial<DsProgressBar>>;
            default: () => {};
        };
    }>> & Readonly<{}>, {
        height: string;
        config: {
            keyboard: {
                code: import("..").KeyCodeEnum;
                midi: number;
            }[];
        };
        bpm: number;
        midi: {
            min: number;
            max: number;
        };
        whiteKeyWidth: string;
        blackKeyWidthRatio: number;
        prepareTime: number;
        performSequence: {
            '60': number[][];
            '61': number[][];
            '62': number[][];
        };
        highlightPolicy: HighlightPolicy;
        columnHeightConstant: number;
        baseLineBottom: number;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    DsPerformEvaluation: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        height: {
            type: StringConstructor;
            default: string;
        };
        config: {
            type: import("vue").PropType<{
                keyboard: {
                    code: import("..").KeyCodeEnum;
                    midi: number;
                }[];
            }>;
            default: () => {
                keyboard: {
                    code: string;
                    midi: number;
                }[];
            };
        };
        bpm: {
            type: NumberConstructor;
            default: number;
        };
        columnWidthConstant: {
            type: NumberConstructor;
            default: number;
        };
        prepareTime: {
            type: NumberConstructor;
            default: number;
        };
        performSequence: {
            default: () => {
                '60': number[][];
                '61': number[][];
                '62': number[][];
            };
        };
        baseLineLeft: {
            type: NumberConstructor;
            default: number;
        };
        highlightPolicy: {
            type: import("vue").PropType<Partial<DsProgressBar>>;
            default: () => {};
        };
    }>, {
        play: () => void;
        pause: () => void;
        stop: () => void;
    }, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        height: {
            type: StringConstructor;
            default: string;
        };
        config: {
            type: import("vue").PropType<{
                keyboard: {
                    code: import("..").KeyCodeEnum;
                    midi: number;
                }[];
            }>;
            default: () => {
                keyboard: {
                    code: string;
                    midi: number;
                }[];
            };
        };
        bpm: {
            type: NumberConstructor;
            default: number;
        };
        columnWidthConstant: {
            type: NumberConstructor;
            default: number;
        };
        prepareTime: {
            type: NumberConstructor;
            default: number;
        };
        performSequence: {
            default: () => {
                '60': number[][];
                '61': number[][];
                '62': number[][];
            };
        };
        baseLineLeft: {
            type: NumberConstructor;
            default: number;
        };
        highlightPolicy: {
            type: import("vue").PropType<Partial<DsProgressBar>>;
            default: () => {};
        };
    }>> & Readonly<{}>, {
        height: string;
        config: {
            keyboard: {
                code: import("..").KeyCodeEnum;
                midi: number;
            }[];
        };
        bpm: number;
        columnWidthConstant: number;
        prepareTime: number;
        performSequence: {
            '60': number[][];
            '61': number[][];
            '62': number[][];
        };
        baseLineLeft: number;
        highlightPolicy: HighlightPolicy;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
};
export { DsVideo, DsIcon, DsProgressBar, DsModelBox, DsFloatingWindow, DsBgAudioPlayer, DsWhiteboard, DsKeyboard, DsPiano, DsPianoWaterfall, DsPerformEvaluation };
export default components;
