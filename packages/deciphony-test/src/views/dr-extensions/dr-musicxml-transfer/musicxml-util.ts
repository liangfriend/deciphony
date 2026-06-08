import {XMLParser} from 'fast-xml-parser'
import {MusicScore} from "deciphony-renderer";

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
function xmlDataFor(data:any[], cb:Function) => {
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
  xmlDataFor(root, (rootData) => {
    rootSwitch(rootData);
  });
}

/**
 * musicScore转musicXml
 */
export function musicScoreToXml(musicScore: MusicScore): File {

}
function rootSwitch(rootData) {
  const { key: rootItemKey, item: rootItem } = rootData;
  switch (rootItemKey) {
    case 'part': {
      // 初始添加复谱表
      // const index = new MusicScoreIndex();
      // index.fuPuBiaoIndex = currentFuPuBiaoIndex;
      // musicScoreEditor.insertFuPuBiao(0);
      // curFuPuBiao = musicScoreData.fuPuBiaoArray[0];
      // curDanPuBiao = curFuPuBiao.danPuBiaoArray[0];

      xmlDataFor(rootItem[rootItemKey], (partData) => {
        partSwitch(partData);
      });
    }
  }
}
function partSwitch(partData) {
  const { key: partItemKey, item: partItem } = partData;

  switch (partItemKey) {
    case 'measure': {
      // 因为要先检测new-system换复谱表索引
      xmlDataFor(partItem[partItemKey], (measureData) => {
        const { key: measureItemKey, item: measureItem } = measureData;
      //   if (measureItem[measureItemKey]?.['@_new-system'] === 'yes') {
      //     // 新增复谱表
      //     const index = new MusicScoreIndex();
      //     index.fuPuBiaoIndex = curFuPuBiao.index.fuPuBiaoIndex + 1;
      //     currentXiaoJieIndex = 0;
      //     musicScoreEditor.insertFuPuBiao(index);
      //     curFuPuBiao = musicScoreData.fuPuBiaoArray[musicScoreData.fuPuBiaoArray.length - 1];
      //   }
      // });
      //
      // // 创建复谱表自带一个小节，所以第一小节不用新增。因为insertXiaoJie是给复谱表上所有单谱表增加小节，所以不用考虑staves数量
      // if (currentXiaoJieIndex !== 0) {
      //   const index = new MusicScoreIndex();
      //   index.fuPuBiaoIndex = curFuPuBiao.index.fuPuBiaoIndex;
      //   index.danPuBiaoIndex = 0;
      //   index.xiaoJieIndex = currentXiaoJieIndex;
      //   // 插入小节，要选中它的前一个小节
      //   editorManager.currentEditor.currentSelected.currentSelectedObjectInfo = {
      //     target: curDanPuBiao,
      //     parent: curFuPuBiao
      //   };
      //   // console.log('chicken', curFuPuBiao.index.fuPuBiaoIndex, currentXiaoJieIndex);
      //   musicScoreEditor.insertXiaoJie(index);
      // }
      // currentXiaoJieIndex++;
      xmlDataFor(partItem[partItemKey], (measureData) => {
        measureSwitch(measureData);
      });

      break;
    }
  }
}
function measureSwitch(measureData) {
  const { key: measureItemKey, item: measureItem } = measureData;
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
  const { key: attributesKey, item: attributesItem } = attributesData;
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
