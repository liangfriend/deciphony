// ========== 频率转音名 ==========
export function frequencyToNoteString(frequency: number): string {
    if (frequency < 20 || frequency > 5000) return ''

    const A4 = 440
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69
    const noteIndex = noteNumber % 12
    const octave = Math.floor(noteNumber / 12) - 1
    return `${noteNames[noteIndex]}${octave}`
}