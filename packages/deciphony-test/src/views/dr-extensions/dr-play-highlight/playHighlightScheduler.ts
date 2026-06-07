import type {PlayHighlightTarget} from './playHighlight'

export type PlayHighlightProgressData = {
    note_id: string
    /** 高亮时值（曲谱原始 duration，非 NPlayer 发声 duration） */
    duration: number
    playTime: number
    /** 是否为该 playTime 下第一个触发的音符 */
    start?: boolean
}

type HighlightNote = {
    noteId: string
    playTime: number
    duration: number
}

/** 同一 playTime 触发的一批音符，各音符 duration 独立 */
type HighlightBatch = {
    notes: HighlightNote[]
}

function toSeconds(dur: number, bpm: number, beatUnit: number): number {
    return (dur * beatUnit * 60) / (256 * bpm)
}

export type PlayHighlightSchedulerDeps = {
    addNoteHighlight: (target: PlayHighlightTarget) => void
    removeNoteHighlight: (target: PlayHighlightTarget) => void
    clearHighlight: () => void
    getBpm: () => number
    getBeatUnit?: () => number
    getRate?: () => number
}

/**
 * 按 playTime 批次管理高亮：新批次第一个音符（start=true）时，
 * 对上一批各音符分别延时取消，延时 = 该音符 duration - (当前 playTime - 该音符 playTime)。
 */
export function createPlayHighlightScheduler(deps: PlayHighlightSchedulerDeps) {
    let currentBatch: HighlightBatch | null = null
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>()

    function unit256ToMs(dur: number): number {
        const bpm = Math.max(1, deps.getBpm())
        const beatUnit = deps.getBeatUnit?.() ?? 4
        const rate = Math.max(0.001, deps.getRate?.() ?? 1)
        return (toSeconds(dur, bpm, beatUnit) * 1000) / rate
    }

    function scheduleNoteClear(note: HighlightNote, nextPlayTime: number) {
        const delay256 = note.duration - (nextPlayTime - note.playTime)
        if (delay256 <= 0) {
            deps.removeNoteHighlight(note.noteId)
            return
        }
        const timer = setTimeout(() => {
            pendingTimers.delete(timer)
            deps.removeNoteHighlight(note.noteId)
        }, unit256ToMs(delay256))
        pendingTimers.add(timer)
    }

    function scheduleBatchClear(batch: HighlightBatch, nextPlayTime: number) {
        for (const note of batch.notes) {
            scheduleNoteClear(note, nextPlayTime)
        }
    }

    function cancelPendingClears() {
        for (const timer of pendingTimers) clearTimeout(timer)
        pendingTimers.clear()
    }

    function toHighlightNote(data: PlayHighlightProgressData, noteId: string): HighlightNote {
        return {
            noteId,
            playTime: data.playTime,
            duration: data.duration,
        }
    }

    function handleProgressStart(data: PlayHighlightProgressData) {
        const noteId = data.note_id?.trim()
        if (!noteId) return

        deps.addNoteHighlight(noteId)

        const note = toHighlightNote(data, noteId)

        if (data.start) {
            if (currentBatch) {
                scheduleBatchClear(currentBatch, data.playTime)
            }
            currentBatch = {notes: [note]}
            return
        }

        if (!currentBatch) {
            currentBatch = {notes: [note]}
            return
        }

        currentBatch.notes.push(note)
    }

    /** 自然播完：各音符按自身结束时刻清除（剩余延时为 0） */
    function handlePlaybackEnd() {
        if (!currentBatch) return
        for (const note of currentBatch.notes) {
            scheduleNoteClear(note, note.playTime + note.duration)
        }
        currentBatch = null
    }

    function handlePlaybackStop() {
        cancelPendingClears()
        deps.clearHighlight()
        currentBatch = null
    }

    /** 暂停时取消待执行的清除 timer，避免暂停期间高亮被误清 */
    function handlePlaybackPause() {
        cancelPendingClears()
    }

    return {
        handleProgressStart,
        handlePlaybackEnd,
        handlePlaybackStop,
        handlePlaybackPause,
        cancelPendingClears,
    }
}
