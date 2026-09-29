import type {MidiFileData, MidiNoteEvent, MidiTrack} from './types'

class ByteReader {
  pos = 0

  constructor(private readonly bytes: Uint8Array) {}

  get length(): number {
    return this.bytes.length
  }

  u8(): number {
    if (this.pos >= this.bytes.length) throw new Error('MIDI 数据意外结束')
    return this.bytes[this.pos++]!
  }

  u16(): number {
    return (this.u8() << 8) | this.u8()
  }

  u32(): number {
    return ((this.u8() << 24) >>> 0) + (this.u8() << 16) + (this.u8() << 8) + this.u8()
  }

  ascii(length: number): string {
    let s = ''
    for (let i = 0; i < length; i++) s += String.fromCharCode(this.u8())
    return s
  }

  bytesOf(length: number): Uint8Array {
    if (this.pos + length > this.bytes.length) throw new Error('MIDI 数据意外结束')
    const out = this.bytes.subarray(this.pos, this.pos + length)
    this.pos += length
    return out
  }

  varLen(): number {
    let value = 0
    for (let i = 0; i < 4; i++) {
      const b = this.u8()
      value = (value << 7) | (b & 0x7f)
      if (!(b & 0x80)) return value
    }
    throw new Error('MIDI 变长数值超过 4 字节')
  }
}

function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', {fatal: true}).decode(bytes)
  } catch {
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return s
  }
}

type PendingNote = {tick: number; velocity: number}

/**
 * 解析 Standard MIDI File（format 0/1/2，仅 PPQ 时基）。
 * - 支持 running status；note on 力度 0 视为 note off
 * - 同通道同音高重叠 note on 按先进先出配对
 * - tempo / 拍号 / 调号汇总为全局事件
 */
export function parseMidi(input: ArrayBuffer | Uint8Array): MidiFileData {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  const r = new ByteReader(bytes)

  if (r.ascii(4) !== 'MThd') throw new Error('不是有效的 MIDI 文件（缺少 MThd）')
  const headerLength = r.u32()
  const format = r.u16()
  const trackCount = r.u16()
  const division = r.u16()
  r.pos += headerLength - 6
  if (division & 0x8000) throw new Error('暂不支持 SMPTE 时基的 MIDI 文件')
  const ppq = division

  const data: MidiFileData = {
    format,
    ppq,
    tracks: [],
    tempos: [],
    timeSignatures: [],
    keySignatures: [],
  }

  for (let t = 0; t < trackCount && r.pos < r.length; t++) {
    const chunkType = r.ascii(4)
    const chunkLength = r.u32()
    const chunkEnd = r.pos + chunkLength
    if (chunkType !== 'MTrk') {
      r.pos = chunkEnd
      t--
      continue
    }

    const track: MidiTrack = {notes: [], programs: []}
    const pending = new Map<number, PendingNote[]>()
    let tick = 0
    let status = 0

    const noteOff = (channel: number, midi: number) => {
      const queue = pending.get(channel * 128 + midi)
      const started = queue?.shift()
      if (!started) return
      const note: MidiNoteEvent = {
        tick: started.tick,
        durationTicks: tick - started.tick,
        midi,
        velocity: started.velocity,
        channel,
      }
      track.notes.push(note)
    }

    while (r.pos < chunkEnd) {
      tick += r.varLen()
      let first = r.u8()
      if (first & 0x80) {
        if (first < 0xf0) status = first
      } else {
        if (!status) throw new Error('MIDI running status 缺少前置状态字节')
        r.pos--
        first = status
      }

      if (first === 0xff) {
        const type = r.u8()
        const length = r.varLen()
        const payload = r.bytesOf(length)
        if (type === 0x03 && track.name == null) track.name = decodeText(payload)
        else if (type === 0x51 && length >= 3) {
          data.tempos.push({
            tick,
            microsecondsPerQuarter: (payload[0]! << 16) | (payload[1]! << 8) | payload[2]!,
          })
        } else if (type === 0x58 && length >= 2) {
          data.timeSignatures.push({tick, numerator: payload[0]!, denominator: 2 ** payload[1]!})
        } else if (type === 0x59 && length >= 2) {
          const sf = payload[0]! > 127 ? payload[0]! - 256 : payload[0]!
          data.keySignatures.push({tick, sf, mi: payload[1] ? 1 : 0})
        } else if (type === 0x2f) {
          break
        }
        continue
      }
      if (first === 0xf0 || first === 0xf7) {
        r.pos += r.varLen()
        continue
      }

      const kind = first & 0xf0
      const channel = first & 0x0f
      if (kind === 0xc0 || kind === 0xd0) {
        const value = r.u8()
        if (kind === 0xc0) track.programs.push({tick, channel, program: value})
        continue
      }
      const d1 = r.u8()
      const d2 = r.u8()
      if (kind === 0x90 && d2 > 0) {
        const key = channel * 128 + d1
        const queue = pending.get(key) ?? []
        queue.push({tick, velocity: d2})
        pending.set(key, queue)
      } else if (kind === 0x80 || kind === 0x90) {
        noteOff(channel, d1)
      }
    }

    for (const [key, queue] of pending) {
      for (const started of queue) {
        track.notes.push({
          tick: started.tick,
          durationTicks: Math.max(0, tick - started.tick),
          midi: key % 128,
          velocity: started.velocity,
          channel: Math.floor(key / 128),
        })
      }
    }
    track.notes.sort((a, b) => a.tick - b.tick || a.midi - b.midi)
    data.tracks.push(track)
    r.pos = chunkEnd
  }

  const byTick = (a: {tick: number}, b: {tick: number}) => a.tick - b.tick
  data.tempos.sort(byTick)
  data.timeSignatures.sort(byTick)
  data.keySignatures.sort(byTick)
  return data
}
