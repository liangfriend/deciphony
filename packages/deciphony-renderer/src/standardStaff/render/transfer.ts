/*
 * 将 musicScore 转换为平铺的 vDom 列表
 * 计算并输出：复谱表、单谱表、13 个曲谱层面插槽
 * 小节及更细部分由调用方处理（m 插槽处预留空间）
 */

import {VDom, SlotName, SlotConfig, Frame} from "@/types/common";
import {MusicScore, SingleStaff} from "@/types/MusicScoreType";
import {MEASURE_HEIGHT} from "@/standardStaff/constant";

function getSlotH(config: SlotConfig | undefined, name: SlotName): number {
    return config?.[name]?.h ?? 0;
}

function getSlotW(config: SlotConfig | undefined, name: SlotName): number {
    return config?.[name]?.w ?? 0;
}

/**
 * 将 musicScore 转换为平铺的 vDom 列表
 * @param musicScore 曲谱数据（纯展示数据，不含插槽配置）
 * @param slotConfig 插槽配置，由扩展插件组合提供（如歌词、符号注释等），可随意开关
 */
export function musicScoreToVDom(musicScore: MusicScore, slotConfig?: SlotConfig): VDom[] {
    const {width, grandStaffs} = musicScore;
    const config = slotConfig ?? {};
    const vDoms: VDom[] = [];

    const gLW = getSlotW(config, 'g-l');
    const gRW = getSlotW(config, 'g-r');
    const sLW = getSlotW(config, 's-l');
    const sRW = getSlotW(config, 's-r');
    const grandStaffX = gLW + sLW;
    const grandStaffW = width - gLW - gRW - sLW - sRW;

    const gUH = getSlotH(config, 'g-u');
    const gDH = getSlotH(config, 'g-d');
    const sUH = getSlotH(config, 's-u');
    const sDH = getSlotH(config, 's-d');
    const mUH = getSlotH(config, 'm-u');
    const mDH = getSlotH(config, 'm-d');
    // 当前累加的y值总值
    let scoreCurrentY = 0;
    // 遍历复谱表
    for (const grandStaff of grandStaffs) {
        //复谱表内y值开始值
        const grandStaffStartY = scoreCurrentY;

        // g-l 插槽（先占位，高度稍后补全）
        let glSlot: VDom = {} as VDom
        if (gLW > 0) {
            glSlot = {
                x: 0,
                y: grandStaffStartY,
                w: gLW,
                h: 0, // 高度下方补全
                zIndex: 1000,
                tag: 'slot',
                slotName: 'g-l',
                dataComment: 'g-l插槽',
            }
            vDoms.push(glSlot);
        }
        let grSlot: VDom = {} as VDom
        // g-r 插槽
        if (gRW > 0) {
            grSlot = {
                x: width - gRW,
                y: grandStaffStartY,
                w: gRW,
                h: 0, // 高度下方补全
                zIndex: 1000,
                tag: 'slot',
                slotName: 'g-r',
                dataComment: 'g-r插槽',
            }
            vDoms.push(grSlot);
        }
        // 复谱表y值当前累加到的值
        let grandStaffCurrentY = grandStaffStartY;
        // 复谱表上边距
        vDoms.push({
            x: grandStaffX,
            y: grandStaffCurrentY,
            w: grandStaffW,
            h: grandStaff.uSpace,
            zIndex: 1000,
            tag: 'space',
            dataComment: '复谱表上边距',
        });
        grandStaffCurrentY += grandStaff.uSpace
        // g-u 插槽
        vDoms.push({
            x: grandStaffX,
            y: grandStaffCurrentY,
            w: grandStaffW,
            h: gUH,
            zIndex: 1000,
            tag: 'slot',
            slotName: 'g-u',
            dataComment: 'g-u插槽',
        });
        grandStaffCurrentY += gUH;
        // 遍历单谱表
        for (let i = 0; i < grandStaff.staves.length; i++) {
            //单谱表内y值开始值
            const singleStaffStartY = grandStaffStartY + grandStaffCurrentY;
            const staff = grandStaff.staves[i];
            // 单谱表上下内边距高度
            const staffUSpaceI = staff.uSpaceI
            const staffDSpaceI = staff.dSpaceI
            // 单谱表上下外边距高度
            const staffUSpaceO = staff.uSpaceO
            const staffDSpaceO = staff.dSpaceO
            const slSlot: VDom = {
                x: gLW,
                y: singleStaffStartY,
                w: sLW,
                h: 0, // 高度稍后补全
                zIndex: 1000,
                tag: 'space',
                dataComment: 's-l插槽'
            }
            // s-l插槽
            vDoms.push(slSlot);
            const srSlot: VDom = {
                x: width - gLW - gRW,
                y: singleStaffStartY,
                w: sLW,
                h: 0, // 高度稍后补全
                zIndex: 1000,
                tag: 'space',
                dataComment: 's-r插槽'
            }
            // s-r插槽
            vDoms.push(srSlot);
            // 单谱表上外边距
            vDoms.push({
                x: grandStaffX,
                y: grandStaffCurrentY,
                w: grandStaffW,
                h: staffUSpaceO,
                zIndex: 1000,
                tag: 'space',
                dataComment: '单谱表上外边距'
            });
            grandStaffCurrentY += staffUSpaceO;

            // s-u插槽
            vDoms.push({
                x: grandStaffX,
                y: grandStaffCurrentY,
                w: grandStaffW,
                h: sUH,
                zIndex: 1000,
                tag: 'slot',
                slotName: 's-u',
                dataComment: 's-u插槽',
            });
            grandStaffCurrentY += sUH;


            // 当前积累的横向宽度
            let measureCurrentX = grandStaffX
            for (let i = 0; i < staff.measures.length; i++) {
                const measure = staff.measures[i];
                // 获取小节宽度
                const measureWdith = getMeasureWidth({staff, grandStaffWidth: grandStaffW})
                // m-u小节上插槽
                vDoms.push({
                    x: measureCurrentX,
                    y: grandStaffCurrentY,
                    w: measureWdith,
                    h: mUH,
                    zIndex: 1000,
                    tag: 'slot',
                    slotName: 'm-u',
                    dataComment: 'm-u插槽',
                });
                measureCurrentX += measureWdith
            }
            grandStaffCurrentY += mUH

            // 下面小节要复用，所以重置为grandStaffX
            measureCurrentX = grandStaffX

            // 单谱表上内边距
            vDoms.push({
                x: grandStaffX,
                y: grandStaffCurrentY,
                w: grandStaffW,
                h: staffUSpaceI,
                zIndex: 1000,
                tag: 'space',
                dataComment: '单谱表上内边距'
            });
            grandStaffCurrentY += staffUSpaceI;

            // 小节
            for (let i = 0; i < staff.measures.length; i++) {
                const measure = staff.measures[i];
                // 获取小节宽度
                const measureWdith = getMeasureWidth({staff, grandStaffWidth: grandStaffW})
                // m-u小节上插槽
                vDoms.push({
                    x: measureCurrentX,
                    y: grandStaffCurrentY,
                    w: measureWdith,
                    h: MEASURE_HEIGHT,
                    zIndex: 1000,
                    tag: 'measure',
                    dataComment: '小节',
                });
                measureCurrentX += measureWdith
            }
            // 小节插槽是覆盖上去的，所以不会增加grandStaffCurrentY


            // 下面小节要复用，所以重置为grandStaffX
            measureCurrentX = grandStaffX

            // 小节插槽
            for (let i = 0; i < staff.measures.length; i++) {
                const measure = staff.measures[i];
                // 获取小节宽度
                const measureWdith = getMeasureWidth({staff, grandStaffWidth: grandStaffW})
                // m小节插槽
                vDoms.push({
                    x: measureCurrentX,
                    y: grandStaffCurrentY,
                    w: measureWdith,
                    h: MEASURE_HEIGHT,
                    zIndex: 1000,
                    tag: 'slot',
                    slotName: 'm',
                    dataComment: '小节插槽',
                });
                measureCurrentX += measureWdith
            }
            grandStaffCurrentY += MEASURE_HEIGHT;

            // 下面小节要复用，所以重置为grandStaffX
            measureCurrentX = grandStaffX

            // 单谱表下内边距
            vDoms.push({
                x: grandStaffX,
                y: grandStaffCurrentY,
                w: grandStaffW,
                h: staffDSpaceI,
                zIndex: 1000,
                tag: 'space',
                dataComment: '单谱表下内边距'
            });
            grandStaffCurrentY += staffDSpaceI;

            // 小节下插槽
            for (let i = 0; i < staff.measures.length; i++) {
                const measure = staff.measures[i];
                // 获取小节宽度
                const measureWdith = getMeasureWidth({staff, grandStaffWidth: grandStaffW})
                // m-d小节下插槽
                vDoms.push({
                    x: measureCurrentX,
                    y: grandStaffCurrentY,
                    w: measureWdith,
                    h: mDH,
                    zIndex: 1000,
                    tag: 'slot',
                    slotName: 'm-d',
                    dataComment: 'm-d插槽',
                });
                measureCurrentX += measureWdith
            }
            grandStaffCurrentY += mDH

            // 没有用到的地方了，但还是重置一下，保持规范
            measureCurrentX = grandStaffX

            // s-d插槽
            vDoms.push({
                x: grandStaffX,
                y: grandStaffCurrentY,
                w: grandStaffW,
                h: sDH,
                zIndex: 1000,
                tag: 'slot',
                slotName: 's-d',
                dataComment: 's-d插槽',
            });
            grandStaffCurrentY += sDH;

            // 单谱表下外边距
            vDoms.push({
                x: grandStaffX,
                y: grandStaffCurrentY,
                w: grandStaffW,
                h: staffDSpaceO,
                zIndex: 1000,
                tag: 'space',
                dataComment: '单谱表下外边距'
            });
            grandStaffCurrentY += staffDSpaceO;
            slSlot.h = grandStaffCurrentY - singleStaffStartY
            srSlot.h = grandStaffCurrentY - singleStaffStartY
        }

        // g-d 插槽
        vDoms.push({
            x: grandStaffX,
            y: grandStaffCurrentY,
            w: grandStaffW,
            h: gDH,
            zIndex: 1000,
            tag: 'slot',
            slotName: 'g-d',
            dataComment: 'g-d插槽',
        });
        grandStaffCurrentY += gDH;

        // 复谱表下边距
        vDoms.push({
            x: grandStaffX,
            y: grandStaffCurrentY,
            w: grandStaffW,
            h: grandStaff.dSpace,
            zIndex: 1000,
            tag: 'space',
            dataComment: '复谱表下边距',
        });
        grandStaffCurrentY += grandStaff.dSpace

        const grandStaffH = grandStaffCurrentY - grandStaffStartY;
        // 将当前复谱表y值更新到当前总值
        // 这个总值目前还没有用到
        scoreCurrentY = grandStaffCurrentY;


        // 补全 g-l、g-r 的高度
        if (gLW > 0) {
            glSlot.h = grandStaffH
        }
        if (gRW > 0) {
            grSlot.h = grandStaffH
        }
    }
    return vDoms;
}

function getMeasureWidth({staff, grandStaffWidth}: { staff: SingleStaff, grandStaffWidth: number }) {
    // 暂时做成均分
    return grandStaffWidth / staff.measures.length
}