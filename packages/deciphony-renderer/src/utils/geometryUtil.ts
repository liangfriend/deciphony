// 复合性aspectRatiao获取


import {MsSymbol} from "../../../deciphony-core/src/types";
import {MsSymbolTypeEnum, MusicScoreShowModeEnum} from "../../../deciphony-core/src/musicScoreEnum";
import {MsSymbolInformationMap} from "../constant";

export function getMultipleAspectRatio(msSymbol: MsSymbol, showMode: MusicScoreShowModeEnum): number {
    const information = MsSymbolInformationMap[msSymbol.type]
    if ('aspectRatio' in information && typeof information.aspectRatio === 'object') {
        if (msSymbol.type === MsSymbolTypeEnum.KeySignature) {
            return information.aspectRatio[msSymbol.keySignature]
        } else if (msSymbol.type === MsSymbolTypeEnum.BarLine || msSymbol.type === MsSymbolTypeEnum.BarLine_f) {
            return information.aspectRatio[msSymbol.barLineType]
        } else if (msSymbol.type === MsSymbolTypeEnum.NoteTail) {
            return information.aspectRatio[msSymbol.chronaxie]
        }else if (msSymbol.type === MsSymbolTypeEnum.NoteDot) {
            return information.aspectRatio[msSymbol.octave]
        }
    }
    console.error('符号有误或符号不是复合aspectRatio类型')
    return 0

}

// 获取音符aspectRatio
export function getMsSymbolAspectRatio(msSymbol: MsSymbol, showMode: MusicScoreShowModeEnum) {
    if (!msSymbol?.type) {
        console.error("缺少符号传参，宽高比获取失败")
        return 1
    }
    // 单小节符号，赋值
    const information = MsSymbolInformationMap[msSymbol.type]
    if ('aspectRatio' in information && (typeof information.aspectRatio === 'number')) {
        return information.aspectRatio
    } else if ('aspectRatio' in information && (typeof information.aspectRatio === 'object')) {
        return getMultipleAspectRatio(msSymbol, showMode)
    }
    console.error("未找到符号对应宽高比")
    return 1
}

// 获取高度乘数
export function getHeightMultiplier(msSymbol: MsSymbol, showMode: MusicScoreShowModeEnum) {
    if (!msSymbol?.type) {
        console.error("缺少符号传参，高度乘数获取失败")
        return 1
    }
    // 单小节符号，赋值
    const information = MsSymbolInformationMap[msSymbol.type]
    if ('heightMultiplier' in information && (typeof information.aspectRatio === 'number')) {
        return information.heightMultiplier
    }

    return 1
}