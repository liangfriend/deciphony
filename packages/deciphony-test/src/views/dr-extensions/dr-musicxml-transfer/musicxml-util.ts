import {XMLParser} from 'fast-xml-parser'
import {MusicScore, MusicScoreTypeEnum} from 'deciphony-renderer'
import {createGrandStaff, createMeasure, createMusicScore, createSingleStaff} from '../dr-edit/score-builder'

/**
 * 使用fast-xml-parser解析musicxml文件成json数据
 */
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    trimValues: true,
    preserveOrder: true,
    ignoreDeclaration: true,
})

export async function getXmlJson(file: File) {
    if (!file) {
        return null
    }

    const text = await file.text()

    const trimmed = text.trimStart()

    if (!trimmed.startsWith('<')) {
        throw new Error('内容不是 XML 文本（应以 < 开头）。')
    }

    return xmlParser.parse(text)
}

function xmlDataFor(data: any[], cb: Function) {
    for (const index in data) {
        const item = data[index];
        for (const key of Object.keys(item)) {
            cb({key, index, item, length: data.length});
        }
    }
};

/**
 * musicXml转musicScore
 */
export function xmlToMusicScore(xmlData: any): MusicScore {
    const root = xmlData[0]['score-partwise'];

    /** 第零步：创建空 musicScore，并加入一个空复谱表（单谱表后续按 staff 数量再补） */
    const musicScore = createMusicScore({
        type: MusicScoreTypeEnum.StandardStaff,
        width: 800,
        height: 600,
    })
    musicScore.grandStaffs.push(createGrandStaff({withDefaultStaff: false}))
    /**
     * 第一步
     * 创建足够多的单谱表，以适应所有measure的staff值
     * 10个
     */
    for (let i = 0; i < 10; i++) {
        musicScore.grandStaffs[0].staves.push(createSingleStaff({withDefaultMeasure: false}))
    }

    /**
     * 第二步
     * 找到第一个part属性，遍历
     * 遇见sound更新musicScore.bpm
     * 遇见measure, 就给所有单谱表加一个空小节
     */
    const firstPart = root.find((item: any) => item.part)?.part
    if (firstPart) {
        for (const partItem of firstPart) {
            if (partItem.sound != null) {
                const tempo = partItem[':@']?.['@_tempo']
                if (tempo != null) musicScore.bpm = Number(tempo)
            }
            if (partItem.measure) {
                for (const singleStaff of musicScore.grandStaffs[0].staves) {
                    singleStaff.measures.push(createMeasure({}))
                }
            }
        }
    }

    /**
     * 第三步，
     * 遍历part
     * 检查measure的索引第一项和索引最后一项
     * 如果索引第一项是attributes, 保存divisions, 解析key为所有该索引小节前置调号，解析time为所有该索引小节前置拍号，解析clef为小节前置谱号，clef用number属性判断属于哪个单谱表的该索引小节
     * 如果索引最后一项是attributes, 保存divisions, 解析key为所有该索引小节后置调号，解析time为所有该索引小节后置拍号，解析clef为小节后置谱号，clef用number属性判断属于哪个单谱表的该索引小节
     * 加三个辅助函数，解析xml中谱号，调号，拍号
     */



    // xmlDataFor(root, (rootData) => {
    //     rootSwitch(rootData, musicScore);
    // });

    return musicScore
}

/**
 * musicScore转musicXml
 */
export function musicScoreToXml(musicScore: MusicScore): File {

}

function rootSwitch(rootData, musicScore: MusicScore) {
    const {key: rootItemKey, item: rootItem} = rootData;
    switch (rootItemKey) {
        case 'part': {
            const partItems = rootItem[rootItemKey]
            xmlDataFor(partItems, (partData) => {
                partSwitch(partData, musicScore);
            });
            break
        }
    }
}

function partSwitch(partData, musicScore: MusicScore) {
    const {key: partItemKey, item: partItem} = partData;

    switch (partItemKey) {
        case 'measure': {
            
            
            xmlDataFor(partItem[partItemKey], (measureData) => {
                measureSwitch(measureData);
            });

            break;
        }
        case 'sound': {
            
            musicScore.bpm = +partItem[partItemKey][0][':@']['@_tempo'];

            break;
        }
    }
}

function measureSwitch(measureData) {
    const {key: measureItemKey, item: measureItem} = measureData;
    switch (measureItemKey) {
        case ':@': {
            // 这里的操作在外部提前执行了
            break;
        }
        case 'attributes': {
            xmlDataFor(measureItem[measureItemKey], (attributesData) => {
                attributesSwitch(attributesData);
            });
            break;
        }
        case 'note': {
            // 需要先行通过staff判断音符所属小节，然后添加音符
            // let danPuBiaoIndex = 0;
            // let midi = 0;
            // let chronaxie = 0;
            // // const dot = 0;
            // for (const noteAttr of measureItem[measureItemKey]) {
            //   for (const key of Object.keys(noteAttr)) {
            //     if (key === 'staff') {
            //       danPuBiaoIndex = noteAttr[key][0]['#text'] != null ? noteAttr[key][0]['#text'] - 1 : 0;
            //     }
            //     if (key === 'pitch') {
            //       midi = pitchToMidi(noteAttr[key]);
            //     }
            //     if (key === 'type') {
            //       chronaxie = typeToChronaxie(noteAttr[key]);
            //     }
            //     if (key === 'dot') {
            //       // dot = noteAttr[key];
            //     }
            //   }
            // }
            // curDanPuBiao = curFuPuBiao?.danPuBiaoArray[danPuBiaoIndex];
            // curXiaoJie = curDanPuBiao.xiaoJieArray[curDanPuBiao.xiaoJieArray.length - 1];
            //
            // // 插入音符，要选中它的前一个音符
            // editorManager.currentEditor.currentSelected.currentSelectedObjectInfo = {
            //   target: curXiaoJie,
            //   parent: curDanPuBiao
            // };
            // // 添加音符
            // const yinfuindex = new MusicScoreIndex();
            // yinfuindex.fuPuBiaoIndex = curXiaoJie.index.fuPuBiaoIndex;
            // yinfuindex.danPuBiaoIndex = curXiaoJie.index.danPuBiaoIndex;
            // yinfuindex.xiaoJieIndex = curXiaoJie.index.xiaoJieIndex;
            // yinfuindex.shengBuIndex = 0;
            // yinfuindex.yinFuIndex = curXiaoJie.yinFuArray.length ? curXiaoJie.yinFuArray.length : 0;
            // // 根据当前单谱表的调号定位五线谱位置（同 midi 不同调号位置不同）
            // const diaoHao = getCurrentDiaoHao(danPuBiaoIndex);
            // const yinfuValue = musicScoreEditor.getYinFuValue(midi, diaoHao);
            // console.log(
            //   'chicken',
            //   yinfuindex.fuPuBiaoIndex,
            //   yinfuindex.danPuBiaoIndex,
            //   yinfuindex.xiaoJieIndex,
            //   yinfuindex.yinFuIndex,
            //   curDanPuBiao.xiaoJieArray.length,
            //   currentXiaoJieIndex
            // );
            // const str =
            //   yinfuindex.fuPuBiaoIndex +
            //   '-' +
            //   yinfuindex.danPuBiaoIndex +
            //   '-' +
            //   yinfuindex.xiaoJieIndex +
            //   '-' +
            //   yinfuindex.yinFuIndex;
            // if (['0-1-0-0', '0-0-0-0'].includes(str)) {
            // musicScoreEditor.insertYinFu({
            //   value: yinfuValue.value,
            //   yinChang: chronaxie,
            //   yinFuType: midi ? UIYinFuType.YinFu : UIYinFuType.XiuZhiFu,
            //   index: yinfuindex,
            //   midi
            // });
            // }

            // 添加附点
            // if (dot) {
            //
            //   const curYinFu = curXiaoJie.yinFuArray[curXiaoJie.yinFuArray.length - 1];
            //   editorManager.currentEditor.currentSelected.currentSelectedObjectInfo = {
            //     target: curYinFu.yinFuContents[0],
            //     parent: curYinFu
            //   };
            //   musicScoreEditor.updateHouFuDianCountForMusicScoreYinFu(curYinFu, dot);
            // }
            // xmlDataFor(measureItem[measureItemKey], (noteData) => {
            //   noteSwitch(noteData, musicScoreEditor);
            // });
            break;
        }
    }
}

function attributesSwitch(attributesData, musicScoreEditor) {
    const {key: attributesKey, item: attributesItem} = attributesData;
    switch (attributesKey) {
        case 'key': {
            // <key number="N">...<fifths>X</fifths></key>
            // number 指定该调号生效的单谱表（1-based），缺省视为对当前 part 内所有单谱表生效
            // const diaohao = keyToDiaoHao(attributesItem[attributesKey]);
            // const staffAttrRaw = attributesItem[':@']?.['@_number'];
            // if (staffAttrRaw != null) {
            //   const idx = Number(staffAttrRaw) - 1;
            //   if (idx >= 0) danPuBiaoDiaoHao[idx] = diaohao;
            // } else {
            //   // 应用到所有已知单谱表；staves 可能还未解析到，至少先写入 0 号
            //   const total = Math.max(staves, 1);
            //   for (let i = 0; i < total; i++) danPuBiaoDiaoHao[i] = diaohao;
            // }
            break;
        }
        case 'staves': {
            // staves = attributesItem[attributesKey][0]['#text'] || 1;
            //
            // // 因为创建复谱表时自带一个单谱表，所以插入单谱表从索引1开始
            // for (let i = 1; i < staves; i++) {
            //   const index = new MusicScoreIndex();
            //   index.fuPuBiaoIndex = 0;
            //   index.danPuBiaoIndex = i;
            //
            //   musicScoreEditor.insertDanPuBiao(index);
            // }
            // // 在 staves 之前出现的 key（未带 number）默认仅写入了 0 号，这里同步到剩余单谱表
            // if (danPuBiaoDiaoHao.length > 0 && danPuBiaoDiaoHao[0]) {
            //   for (let i = 1; i < staves; i++) {
            //     if (danPuBiaoDiaoHao[i] == null) danPuBiaoDiaoHao[i] = danPuBiaoDiaoHao[0];
            //   }
            // }
            break;
        }
        case 'clef': {
            break;
        }
    }
}

// function noteSwitch(noteData, musicScoreEditor) {
//   const { key: noteKey, item: noteItem } = noteData;
//
//   switch (noteKey) {
//     case 'pitch': {
//       break;
//     }
//     case 'duration': {
//       break;
//     }
//     case 'stem': {
//       break;
//     }
//     case 'staff': {
//       // 这个已经在measureSwitch里提前判断完了
//       break;
//     }
//     case 'voice': {
//       break;
//     }
//   }
// }
