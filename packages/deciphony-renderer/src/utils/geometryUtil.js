// 复合性aspectRatiao获取
import { MsSymbolTypeEnum } from "../../../deciphony-core/src/musicScoreEnum";
import { MsSymbolInformationMap } from "@/constant";
function getMultipleAspectRatio(msSymbol) {
    const information = MsSymbolInformationMap[msSymbol.type];
    if ('aspectRatio' in information && typeof information.aspectRatio === 'object') {
        if (msSymbol.type === MsSymbolTypeEnum.KeySignature) {
            return information.aspectRatio[msSymbol.keySignature];
        }
        else if (msSymbol.type === MsSymbolTypeEnum.BarLine || msSymbol.type === MsSymbolTypeEnum.BarLine_f) {
            return information.aspectRatio[msSymbol.barLineType];
        }
        else if (msSymbol.type === MsSymbolTypeEnum.NoteTail) {
            return information.aspectRatio[msSymbol.chronaxie];
        }
        else if (msSymbol.type === MsSymbolTypeEnum.NoteDot) {
            return information.aspectRatio[msSymbol.octave];
        }
        else if (msSymbol.type === MsSymbolTypeEnum.ChronaxieReducingLine) {
            return information.aspectRatio[msSymbol.chronaxie];
        }
    }
    console.error('符号有误或符号不是复合aspectRatio类型');
    return 0;
}
// 获取符号宽高比
export function getMsSymbolAspectRatio(msSymbol) {
    if (!msSymbol?.type) {
        console.error("缺少符号传参，宽高比获取失败");
        return 1;
    }
    // 单小节符号，赋值
    const information = MsSymbolInformationMap[msSymbol.type];
    if ('aspectRatio' in information && (typeof information.aspectRatio === 'number')) {
        return information.aspectRatio;
    }
    else if ('aspectRatio' in information && (typeof information.aspectRatio === 'object')) {
        return getMultipleAspectRatio(msSymbol);
    }
    console.error("未找到符号对应宽高比");
    return 1;
}
function getMultipleHeightMultiplier(msSymbol) {
    const information = MsSymbolInformationMap[msSymbol.type];
    if ('heightMultiplier' in information && typeof information.heightMultiplier === 'object') {
        if (msSymbol.type === MsSymbolTypeEnum.ChronaxieReducingLine) {
            return information.heightMultiplier[msSymbol.chronaxie];
        }
        else if (msSymbol.type === MsSymbolTypeEnum.NoteDot) {
            return information.heightMultiplier[msSymbol.octave];
        }
    }
    console.error('符号有误或符号不是复合heightMultiplier类型');
    return 0;
}
// 获取高度乘数
export function getHeightMultiplier(msSymbol) {
    if (!msSymbol?.type) {
        console.error("缺少符号传参，高度乘数获取失败");
        return 1;
    }
    // 单小节符号，赋值
    const information = MsSymbolInformationMap[msSymbol.type];
    if ('heightMultiplier' in information && (typeof information.heightMultiplier === 'number')) {
        return information.heightMultiplier;
    }
    else if ('heightMultiplier' in information && (typeof information.heightMultiplier === 'object')) {
        return getMultipleHeightMultiplier(msSymbol);
    }
    return 1;
}
// 获取space
export function getSpace(msSymbol, musicScore) {
    const information = MsSymbolInformationMap[msSymbol.type];
    const measureHeight = musicScore.measureHeight;
    const space = {
        top: information.space.top * measureHeight,
        bottom: information.space.bottom * measureHeight,
        left: information.space.left * measureHeight,
        right: information.space.right * measureHeight,
    };
    return space;
}
