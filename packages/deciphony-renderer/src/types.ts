import {MsMode, OrderTypeEnum, ReserveMsSymbolType} from "../../deciphony-core/src/musicScoreEnum";
import {MsType, MusicScore} from "../../deciphony-core/src/types";
import {Ref} from "vue";

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