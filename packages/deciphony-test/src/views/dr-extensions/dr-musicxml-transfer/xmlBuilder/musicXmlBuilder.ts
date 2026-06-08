import {
  attr,
  createXmlDocument,
  elem,
  serializeXml,
  text,
  type XmlElement
} from './core'
import {
  accidentalToXml,
  chronaxieToDuration,
  chronaxieToXmlType,
  clefToXmlSignLine,
  keySignatureToFifths,
  timeSignatureToBeats
} from './musicXmlEncode'
import type { MusicXmlBuilderOptions, MusicXmlMeasureAttributes, MusicXmlNoteInput } from './types'

const DEFAULT_DIVISIONS = 16

/**
 * MusicXML score-partwise 文档构建器。
 * 供 dr-musicxml-transfer 的 musicScoreToXml 逐步接入。
 */
export class MusicXmlBuilder {
  private readonly root: XmlElement
  private readonly partEl: XmlElement
  private currentMeasure: XmlElement | null = null
  private divisions: number

  constructor(options: MusicXmlBuilderOptions = {}) {
    this.divisions = options.divisions ?? DEFAULT_DIVISIONS

    this.root = createXmlDocument('score-partwise')
    attr(this.root, 'version', '4.0')

    if (options.title) {
      const work = elem(this.root, 'work')
      text(work, 'work-title', options.title)
    }

    if (options.composer) {
      const identification = elem(this.root, 'identification')
      const creator = elem(identification, 'creator')
      creator.text(options.composer)
      attr(creator, 'type', 'composer')
    }

    const partList = elem(this.root, 'part-list')
    const scorePart = elem(partList, 'score-part')
    attr(scorePart, 'id', options.partId ?? 'P1')
    text(scorePart, 'part-name', options.partName ?? 'Music')

    this.partEl = elem(this.root, 'part')
    attr(this.partEl, 'id', options.partId ?? 'P1')

    if (options.bpm != null) {
      const sound = elem(this.partEl, 'sound')
      attr(sound, 'tempo', options.bpm)
    }
  }

  getDivisions(): number {
    return this.divisions
  }

  setDivisions(value: number) {
    this.divisions = value
  }

  /** 开始一个小节 */
  beginMeasure(number: number, attrs?: { newSystem?: boolean }) {
    this.currentMeasure = elem(this.partEl, 'measure')
    attr(this.currentMeasure, 'number', number)
    if (attrs?.newSystem) {
      attr(this.currentMeasure, 'new-system', 'yes')
    }
    return this.currentMeasure
  }

  /** 写入小节 attributes（谱号 / 调号 / 拍号 / divisions） */
  writeAttributes(input: MusicXmlMeasureAttributes) {
    const measure = this.requireMeasure()
    const attributes = elem(measure, 'attributes')

    if (input.divisions != null) {
      this.divisions = input.divisions
      text(attributes, 'divisions', input.divisions)
    }

    if (input.key != null) {
      const key = elem(attributes, 'key')
      text(key, 'fifths', keySignatureToFifths(input.key))
    }

    if (input.time != null) {
      const { beats, beatType } = timeSignatureToBeats(input.time)
      const time = elem(attributes, 'time')
      text(time, 'beats', beats)
      text(time, 'beat-type', beatType)
    }

    if (input.staves != null) {
      text(attributes, 'staves', input.staves)
    }

    for (const item of input.clefs ?? []) {
      const { sign, line } = clefToXmlSignLine(item.clef)
      const clef = elem(attributes, 'clef')
      attr(clef, 'number', item.staff)
      text(clef, 'sign', sign)
      text(clef, 'line', line)
    }

    return attributes
  }

  /** 写入音符或休止符 */
  writeNote(input: MusicXmlNoteInput) {
    const measure = this.requireMeasure()
    const note = elem(measure, 'note')

    if (input.chord) {
      elem(note, 'chord')
    }

    if (input.rest) {
      elem(note, 'rest')
    } else if (input.pitch) {
      const pitch = elem(note, 'pitch')
      text(pitch, 'step', input.pitch.step)
      if (input.pitch.alter != null && input.pitch.alter !== 0) {
        text(pitch, 'alter', input.pitch.alter)
      }
      text(pitch, 'octave', input.pitch.octave)
    }

    const duration = input.duration ?? chronaxieToDuration(input.chronaxie, this.divisions)
    text(note, 'duration', duration)
    text(note, 'type', chronaxieToXmlType(input.chronaxie))

    if (input.dots) {
      for (let i = 0; i < input.dots; i++) {
        elem(note, 'dot')
      }
    }

    if (input.accidental) {
      const accidental = accidentalToXml(input.accidental)
      if (accidental) text(note, 'accidental', accidental)
    }

    if (input.stem) {
      text(note, 'stem', input.stem)
    }

    if (input.staff != null) {
      text(note, 'staff', input.staff)
    }

    if (input.voice != null) {
      text(note, 'voice', input.voice)
    }

    if (input.beam) {
      const beam = elem(note, 'beam')
      attr(beam, 'number', 1)
      beam.text('begin')
    }

    return note
  }

  /** 声部切换前写入 backup */
  writeBackup(duration: number) {
    const measure = this.requireMeasure()
    const backup = elem(measure, 'backup')
    text(backup, 'duration', duration)
    return backup
  }

  toXml(pretty = true): string {
    return serializeXml(this.root, pretty)
  }

  toFile(fileName = 'score.musicxml'): File {
    return new File([this.toXml()], fileName, {
      type: 'application/vnd.recordare.musicxml+xml'
    })
  }

  private requireMeasure(): XmlElement {
    if (!this.currentMeasure) {
      throw new Error('MusicXmlBuilder: 请先调用 beginMeasure()')
    }
    return this.currentMeasure
  }
}

export function createMusicXmlBuilder(options?: MusicXmlBuilderOptions): MusicXmlBuilder {
  return new MusicXmlBuilder(options)
}

/** 生成最小可解析的 score-partwise 骨架（便于联调导入/导出） */
export function createEmptyMusicXmlDocument(options?: MusicXmlBuilderOptions): string {
  const builder = createMusicXmlBuilder(options)
  builder.beginMeasure(1)
  builder.writeAttributes({ divisions: builder.getDivisions(), staves: 1 })
  builder.writeNote({
    rest: true,
    chronaxie: 256,
    duration: chronaxieToDuration(256, builder.getDivisions()),
    voice: 1,
    staff: 1
  })
  return builder.toXml()
}
