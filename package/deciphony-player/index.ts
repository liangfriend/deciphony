/*
* musicScore的播放功能实现
* 基于 tone.js
* TODO 二期把音频播放改成webAudio实现，或者放弃url这一类型，音频播放使用整体audioUtils
* */
import * as Tone from "tone";
import {MusicScore} from "deciphony-core/types";
import {
    ChronaxieEnum, MsSymbolTypeEnum,
    MusicalAlphabetEnum
} from "deciphony-core/musicScoreEnum";
import {
    getMsSymbolClef,
    getNoteMusicalAlphabet
} from "deciphony-core/utils/musicScoreDataUtil";


type ToneSequence = {
    note: string,
    duration: string,
    time: string | number // Tone中的相对时间单位,节拍数。 1 = 4n 这个不会改变，永远是1 = 4n
}
type MusicDataType = string | ToneSequence[] | MusicScore
type CacheDataType = {
    data: Exclude<MusicDataType, string>,
    synth: Tone.Synth,
    part: Tone.Part
}

// 支持一种类型缓存，tone生成的播放序列。
const cacheMap = new Map<string, CacheDataType>();

// 播放
async function play(key: string) {
    const data = cacheMap.get(key);
    if (!data) {
        console.warn(`找不到缓存的播放序列，key: ${key}`);
        return;
    }

    await Tone.start();

    Tone.getTransport().stop();
    Tone.getTransport().cancel(); //重置所有调度， 否则会越播越响，不知道为什么
    data.part.stop();
    data.part.start(0);
    Tone.getTransport().start();

}

// 暂停
function pause(key: string) {
    const data = cacheMap.get(key);
    if (!data) return;

    Tone.getTransport().pause();

}

// 恢复播放
function resume(key: string) {
    const data = cacheMap.get(key);
    if (!data) return;

    Tone.getTransport().start();

}

// 停止
function stop(key: string) {
    const data = cacheMap.get(key);
    if (!data) return;

    data.part.stop();
    Tone.getTransport().stop();

}

// 添加音乐数据到缓存
// TODO synth 二期做音色可能要改成Tone.Sampler
async function addMusicToMap(key: string, data: MusicDataType, callback?: () => void) {

    let cacheData: CacheDataType = null!
    if (Array.isArray(data)) { // 如果是ToneSequence序列，
        const synth = new Tone.Synth().toDestination();
        const tonePart = new Tone.Part((time, note: ToneSequence) => {
            synth.triggerAttackRelease(note.note, note.duration, time);
        }, data)
        cacheData = {
            data: data,
            part: tonePart,
            synth: synth
        }
    } else {

        if (typeof data === 'object') { // 如果是musicScoreData, 转换出ToneSequence序列
            const synth = new Tone.Synth().toDestination();
            const toneSequence: ToneSequence[] = musicScoreToToneSequence(data)
            const tonePart: Tone.Part = new Tone.Part((time, note: ToneSequence) => {
                synth.triggerAttackRelease(note.note, note.duration, time);
            }, toneSequence)
            tonePart.loop = false; // ✅ 确保它会只执行一次而不是静默
            cacheData = {
                data: data,
                part: tonePart,
                synth: synth
            }
        }
    }

    cacheMap.set(key, cacheData);
    callback?.()
}

// 删除音乐数据
function removeMusicFromMap(key: string) {
    const data = cacheMap.get(key);
    if (!data) return;
    data.part.dispose();
    data.synth.dispose();
    cacheMap.delete(key);
}

const chronaxieToBeatsMap = {
    [ChronaxieEnum.whole]: 4,
    [ChronaxieEnum.half]: 2,
    [ChronaxieEnum.quarter]: 1,
    [ChronaxieEnum.eighth]: 0.5,
    [ChronaxieEnum.sixteenth]: 0.25,
};
// Tone 识别的时值字符串
const chronaxieToDurationMap: Record<ChronaxieEnum, string> = {
    [ChronaxieEnum.whole]: '1n',
    [ChronaxieEnum.half]: '2n',
    [ChronaxieEnum.quarter]: '4n',
    [ChronaxieEnum.eighth]: '8n',
    [ChronaxieEnum.sixteenth]: '16n',
    [ChronaxieEnum.thirtySecond]: '32n',
    [ChronaxieEnum.sixtyFourth]: '64n',
};


function durationToBeats(duration: string): number {
    // 拍子表，对应每种基础音符的拍数（以4n为1拍）
    const baseMap: Record<string, number> = {
        '1n': 4,
        '2n': 2,
        '4n': 1,
        '8n': 0.5,
        '16n': 0.25,
        '32n': 0.125,
        '64n': 0.0625,
    };

    // 提取基础时值和附点
    const match = duration.match(/^(\d+n)(\.*)$/);
    if (!match) {
        throw new Error(`Unsupported duration format: ${duration}`);
    }

    const [, base, dots] = match;
    let beats = baseMap[base];
    if (beats === undefined) {
        throw new Error(`Unknown base duration: ${base}`);
    }

    // TODO 附点处理：1个附点 = 1.5倍，2个 = 1.75倍，3个 = 1.875倍...  二期
    let dotBonus = 0;
    for (let i = 0; i < dots.length; i++) {
        dotBonus += beats / Math.pow(2, i + 1);
    }

    return beats + dotBonus;
}

function musicScoreToToneSequence(musicScore: MusicScore): ToneSequence[] {
    const sequence: ToneSequence[] = [];
    let accumulatorTime = 0
    for (const multiStaff of musicScore.multipleStavesArray) {
        for (const singleStaff of multiStaff.singleStaffArray) {
            for (const measure of singleStaff.measureArray) {
                for (const msSymbolContainer of measure.msSymbolContainerArray) {
                    for (const msSymbol of msSymbolContainer.msSymbolArray) {

                        if (msSymbol.type === MsSymbolTypeEnum.noteHead) {
                            // 构造音名（暂不考虑变音符）
                            let noteName: string = getNoteMusicalAlphabet(msSymbol, musicScore)

                            // 时值转换
                            let duration = chronaxieToDurationMap[msSymbol.chronaxie as ChronaxieEnum] || '4n';


                            sequence.push({
                                note: noteName,
                                duration,
                                time: accumulatorTime,
                            });
                            accumulatorTime += durationToBeats(duration)

                        }
                    }

                }
            }
        }
    }

    return sequence;
}

export const index = {
    play,
    pause,
    stop,
    resume,
    addMusicToMap,
    removeMusicFromMap,
};
