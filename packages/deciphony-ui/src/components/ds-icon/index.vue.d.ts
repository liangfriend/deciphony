type __VLS_Props = {
    name: string;
    size?: number | string;
    color?: string;
};
declare function getSvgBlob(): Blob;
declare const _default: import("vue").DefineComponent<__VLS_Props, {
    getSvgBlob: typeof getSvgBlob;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {
    color: string;
    size: number | string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
