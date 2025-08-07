import {
    Measure,
    MsSymbol,
    MsSymbolContainer,
    MusicScore,
    NoteHead,
    SingleStaff,
    WidthConstant
} from "deciphony-core/types";
import {MsSymbolInformationMap,} from "deciphony-core/constant";

// 获取当前符号的宽度系数之和
export function getWidthConstantInMsSymbol(msSymbol: MsSymbol): WidthConstant {
    let widthConstant: WidthConstant = 0
    const information = MsSymbolInformationMap[msSymbol.type]
    if ('widthRatioConstant' in information) {
        widthConstant += information.widthRatioConstant
    }
    if (msSymbol.msSymbolArray) {
        for (let k = 0; k < msSymbol.msSymbolArray.length; k++) {
            const childMsSymbol = msSymbol.msSymbolArray[k]
            const childInformation = MsSymbolInformationMap[childMsSymbol.type]
            if ('widthRatioConstant' in childInformation) {
                widthConstant += childInformation.widthRatioConstant
            }
        }
    }
    return widthConstant
}

// 获取当前符号容器的宽度系数之和 取宽度系数最大的符号的宽度系数
export function getWidthConstantInMsSymbolContainer(msSymbolContainer: MsSymbolContainer): WidthConstant {
    let widthConstant: WidthConstant = 0

    if (msSymbolContainer.msSymbolArray) {
        for (let k = 0; k < msSymbolContainer.msSymbolArray.length; k++) {
            const curMsSymbol = msSymbolContainer.msSymbolArray[k]
            const curWidthConstant = getWidthConstantInMsSymbol(curMsSymbol)
            // 取最大值
            if (widthConstant < curWidthConstant) {
                widthConstant = curWidthConstant
            }
        }
    }
    return widthConstant
}

// 获取小节的宽度占比常数之和, 第二个参数判断是否只计算当前符号容器之前的
export function getWidthConstantInMeasure(measure: Measure, msSymbolContainer?: MsSymbolContainer | null): WidthConstant {

    let widthConstant: WidthConstant = 0
    for (let j = 0; j < measure.msSymbolContainerArray.length; j++) {
        const curMsSymbolContainer = measure.msSymbolContainerArray[j]
        if (msSymbolContainer && curMsSymbolContainer === msSymbolContainer) {
            return widthConstant
        }

        widthConstant += getWidthConstantInMsSymbolContainer(curMsSymbolContainer)
    }
    // 一个小节的宽度系数不可以为0，最少为1, 这里这样写有可能在以后导致问题，留心一下
    if (widthConstant === 0) {
        return 1
    }
    return widthConstant
}


// 获取单谱表的宽度占比常数之和, 第二个参数判断是否只计算当前符号之前的
export function getWidthConstantInSingleStaff(singleStaff: SingleStaff, msSymbolContainer?: MsSymbolContainer | null): WidthConstant {
    let preWidthConstant = 0
    for (let i = 0; i < singleStaff.measureArray.length; i++) {
        const measure = singleStaff.measureArray[i]
        preWidthConstant += getWidthConstantInMeasure(measure, msSymbolContainer)
    }
    return preWidthConstant
}
