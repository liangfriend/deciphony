import {
    MsMode, MsSymbolCategoryEnum,
    MsSymbolContainerTypeEnum,
    OrderTypeEnum,
    ReserveMsSymbolType
} from "deciphony-core";
import {MsType, MusicScore} from "deciphony-core";
import {Ref} from "vue";
import {MsTypeNameEnum} from "deciphony-core";
import {DragType} from "@/enum";

export declare interface MouseDownData {
    msData: MsType,
    orderType: OrderTypeEnum
}

export declare type ReserveMsSymbolMapType = Map<ReserveMsSymbolType, MsType>

export declare interface MusicScoreRef {
    changeMode: (mode: MsMode) => void,
    root: Ref<HTMLElement>,
    mode: Ref<MsMode>,
    currentSelected: Ref<MsType | null>,
    currentResevedType: Ref<ReserveMsSymbolType>,
    setCurrentResevedType: (value: ReserveMsSymbolType) => void,
    setReserveMsSymbol: (key: ReserveMsSymbolType, msData: MsType) => void,
    getReserveMsSymbol: (key: ReserveMsSymbolType) => MsType | null,
    cancelSelect: () => void,
    reserveMsSymbolMap: Ref<ReserveMsSymbolMapType>,
    switchShowMode: (musicScore: MusicScore) => void,
    setSkin: (key: Record<string, { url: string; }>) => void,
    resetSkin: () => void,
    tag: Ref<string>
}

// 点击事件处理
export declare interface MouseDownInject {
    msSymbolMouseDown: (e: MouseEvent, data: MouseDownData) => void
    measureMouseDown: (e: MouseEvent, data: MouseDownData) => void
    singleStaffMouseDown: (e: MouseEvent, data: MouseDownData) => void
    multipleStavesMouseDown: (e: MouseEvent, data: MouseDownData) => void

}

// 五线谱状态
export declare interface MsState {
    mode: Ref<MsMode>,
    currentSelected: Ref<MsType | null>,
    reserveMsSymbolMap: Ref<ReserveMsSymbolMapType>,
    currentResevedType: Ref<ReserveMsSymbolType>,
}

// constant
export type FixedWidthSymbolInfo = { // 定宽符号没有宽度占比系数
    containerType: MsSymbolContainerTypeEnum.rearFixed | MsSymbolContainerTypeEnum.frontFixed
    aspectRatio: number | Record<string, number>// 特殊的定宽容器，宽高比有多个，取决于具体情况 宽/高
    category: MsSymbolCategoryEnum.singleMeasure
    heightMultiplier: number | Record<string, number>    // 相对小节的高度倍数，用于计算高度
    space: {
        top: number,
        bottom: number,
        left: number,
        right: number,
    }
}


export type VariableWidthSymbolInfo = {
    containerType: MsSymbolContainerTypeEnum.variable
    aspectRatio: number | Record<string, number>// 宽/高
    widthRatioConstant: number // 可为任意正数
    category: MsSymbolCategoryEnum.singleMeasure
    heightMultiplier: number | Record<string, number>
    space: {
        top: number,
        bottom: number,
        left: number,
        right: number,
    }
}
export type pureFollowSymbolInfo = { // 纯粹的符号跟随类型  没有容器类型属性
    aspectRatio: number | Record<string, number> // 宽/高
    category: MsSymbolCategoryEnum
    widthRatioConstant: number
    heightMultiplier: number | Record<string, number> // 相对小节的高度倍数，用于计算高度
    space: {
        top: number,
        bottom: number,
        left: number,
        right: number,
    }
}

export type MultipleMeasureSymbolInfo = { // 跨小节类型符号
    category: MsSymbolCategoryEnum.multipleMeasure,
    space: {
        top: number,
        bottom: number,
        left: number,
        right: number,
    }
}
/*
* heightMultiplier会决定高度占比，
* aspectRatio会根据高度决定宽度
* space在大部分符号上是无效的
* */
export type MsSymbolInformation =
    | FixedWidthSymbolInfo
    | VariableWidthSymbolInfo
    | MultipleMeasureSymbolInfo
    | pureFollowSymbolInfo


/*
* 样式表
* */

export type StyleMapItem = {
    type: MsTypeNameEnum.SpanSymbol,
    dragType: DragType.CubicBezier,
    startPoint: {
        offsetX: number,
        offsetY: number,
    },
    endPoint: {
        offsetX: number,
        offsetY: number,
    },
    leftSlope: {
        offsetX: number,
        offsetY: number,
    },
    rightSlope: {
        offsetX: number,
        offsetY: number,
    },
}