import {MsMode, OrderTypeEnum, ReserveMsSymbolType} from "../deciphony-core/src/musicScoreEnum";
import {MsType} from "@deciphony/deciphony-core/types";
import {Ref} from "vue";





declare interface MouseDownData {
    msData: MsType,
    orderType: OrderTypeEnum
}

declare type ReserveMsSymbolMapType = Map<ReserveMsSymbolType, MsType>

declare interface MusicScoreRef {
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
}

// 点击事件处理
declare interface MouseDownInject {
    msSymbolMouseDown: (e: MouseEvent, data: MouseDownData) => void
    measureMouseDown: (e: MouseEvent, data: MouseDownData) => void
    singleStaffMouseDown: (e: MouseEvent, data: MouseDownData) => void
    multipleStavesMouseDown: (e: MouseEvent, data: MouseDownData) => void

}

// 五线谱状态
declare interface MsState {
    mode: Ref<MsMode>,
    currentSelected: Ref<MsType | null>,
    reserveMsSymbolMap: Ref<ReserveMsSymbolMapType>,
    currentResevedType: Ref<ReserveMsSymbolType>,
}