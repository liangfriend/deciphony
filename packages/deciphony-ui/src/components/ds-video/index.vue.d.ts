import { PropType } from 'vue';
type srcListItem = {
    url: string;
    title: string;
};
declare const _default: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
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
        type: PropType<Array<srcListItem>>;
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
        type: PropType<Array<srcListItem>>;
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
    srcList: srcListItem[];
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default _default;
