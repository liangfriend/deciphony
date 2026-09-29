import type {MidiFileData} from './types'

class ByteWriter {
  private readonly chunks: number[] = []

  get length(): number {
    return this.chunks.length
  }

  u8(...values: number[]): void {
    for (const v of values) this.chunks.push(v & 0xff)
  }

  u16(v: number): void {
    this.u8(v >> 8, v)
  }

  u32(v: number): void {
    this.u8(v >>> 24, v >>> 16, v >>> 8, v)
  }

  ascii(s: string): void {
    for (let i = 0; i < s.length; i++) this.u8(s.charCodeAt(i))
  }

  bytes(b: Uint8Array | number[]): void {
    for (const v of b) this.u8(v)
  }

  varLen(value: number): void {
    let v = Math.max(0, Math.round(value))
    const stack = [v & 0x7f]
    v >>= 7
    while (v > 0) {
      stack.push((v & 0x7f) | 0x80)
      v >>= 7
    }
    for (let i = stack.length - 1; i >= 0; i--) this.u8(stack[i]!)
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.chunks)
  }
}

type RawEvent = {
  tick: number
  /** 同 tick 排序：meta < program < note off < note on */
  order: number
  data: number[]
}

function metaEvent(type: number, payload: number[]): number[] {
  const len = new ByteWriter()
  len.varLen(payload.length)
  return [0xff, type, ...len.toUint8Array(), ...payload]
}

function textPayload(text: string): number[] {
  return Array.from(new TextEncoder().encode(text))
}

function encodeTrack(events: RawEvent[]): Uint8Array {
  events.sort((a, b) => a.tick - b.tick || a.order - b.order)
  const w = new ByteWriter()
  let last = 0
  for (const e of events) {
    const tick = Math.max(last, Math.round(e.tick))
    w.varLen(tick - last)
    w.bytes(e.data)
    last = tick
  }
  w.varLen(0)
  w.u8(0xff, 0x2f, 0x00)
  return w.toUint8Array()
}

/**
 * 写出 Standard MIDI File（format 0 仅在只有一条音轨时使用，否则 format 1）。
 * 全局 tempo / 拍号 / 调号写入第一条音轨（format 1 下即指挥轨）。
 */
export function writeMidi(data: MidiFileData): Uint8Array {
  const tracks = data.tracks.map((track, index) => {
    const events: RawEvent[] = []
    if (track.name) events.push({tick: 0, order: 0, data: metaEvent(0x03, textPayload(track.name))})
    if (index === 0) {
      for (const t of data.tempos) {
        const us = Math.max(1, Math.min(0xffffff, Math.round(t.microsecondsPerQuarter)))
        events.push({tick: t.tick, order: 1, data: metaEvent(0x51, [us >> 16, us >> 8, us])})
      }
      for (const ts of data.timeSignatures) {
        const dd = Math.max(0, Math.round(Math.log2(ts.denominator)))
        events.push({tick: ts.tick, order: 1, data: metaEvent(0x58, [ts.numerator, dd, 24, 8])})
      }
      for (const ks of data.keySignatures) {
        events.push({tick: ks.tick, order: 1, data: metaEvent(0x59, [ks.sf & 0xff, ks.mi])})
      }
    }
    for (const p of track.programs) {
      events.push({tick: p.tick, order: 2, data: [0xc0 | (p.channel & 0x0f), p.program & 0x7f]})
    }
    for (const n of track.notes) {
      const ch = n.channel & 0x0f
      const midi = Math.max(0, Math.min(127, Math.round(n.midi)))
      const velocity = Math.max(1, Math.min(127, Math.round(n.velocity)))
      events.push({tick: n.tick, order: 4, data: [0x90 | ch, midi, velocity]})
      events.push({tick: n.tick + n.durationTicks, order: 3, data: [0x80 | ch, midi, 0]})
    }
    return encodeTrack(events)
  })

  const w = new ByteWriter()
  w.ascii('MThd')
  w.u32(6)
  w.u16(tracks.length <= 1 ? 0 : 1)
  w.u16(tracks.length)
  w.u16(data.ppq)
  for (const t of tracks) {
    w.ascii('MTrk')
    w.u32(t.length)
    w.bytes(t)
  }
  return w.toUint8Array()
}
