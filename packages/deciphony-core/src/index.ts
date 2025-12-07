export * from "./musicScoreEnum"
export * from "./types"
export * from './utils/changeStructureUtil'
export * from './utils/commonUtil'
export * from './utils/musicScoreDataUtil'
export * from './utils/objectTemplateUtil'
export * from './utils/showModeUtil'
export * from './utils/melodyGenerateUtil'
// 核心算法

import getAccidentalForStaffPosition from './utils/core/getAccidentalForStaffPosition'
import midiToNoteName from './utils/core/midiToNoteName'
import midiToRegion from './utils/core/midiToRegion'
import midiToSolmization from './utils/core/midiToSolmization'
import noteNameToMidi from './utils/core/noteNameToMidi'
import regionToMidi from './utils/core/regionToMidi'
import solmizationToMidi from './utils/core/solmizationToMidi'

export {
    getAccidentalForStaffPosition,
    midiToNoteName,
    midiToRegion,
    midiToSolmization,
    noteNameToMidi,
    regionToMidi,
    solmizationToMidi
}
