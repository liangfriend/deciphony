import SJWPDF from './components/SJWPDF.vue'

export default SJWPDF
export {default as Page} from './components/Page.vue'
export {default as Score} from './components/Score.vue'
export {default as AudioPlayer} from './components/AudioPlayer.vue'
export {default as EditFrame} from './components/EditFrame.vue'
export {addText, addImage, addAudio, removeElement} from './api/elements'
export type {AddTextOptions, AddImageOptions, AddAudioOptions} from './api/elements'
export {addScore, removeScore, getScoreAudios, collectScoreAudioSrcs} from './api/scores'
export type {AddScoreOptions, AddScoreHostOptions, ScoreAudioInput, ScoreAudioHostInput} from './api/scores'
export {addPage, insertPage, removePage, createEmptyPage, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT} from './api/pages'
export type {AddPageOptions} from './api/pages'
export {setBackground, clearBackground} from './api/background'
export type {SetBackgroundOptions} from './api/background'
export {createScorePlayback, ACCOMPANIMENT_TIME_PROP, VOCAL_TIME_PROP} from './play/scorePlayback'
export type {ScorePlayback, ScorePlayHost, ScorePlaybackOptions, PlaybackMode} from './play/scorePlayback'
export {createAssetStore, createAssetFilename, createAssetId} from './assets/assetStore'
export {readImageSize} from './assets/imageSize'
export {
  parseSjw,
  buildSjwBlob,
  downloadSjw,
  WORK_JSON,
} from './assets/sjwIO'
export {
  isRemoteSrc,
  basename,
  findAssetUsages,
  isAssetUsed,
  clearAssetUsages,
} from './assets/usage'
export {paintStrokes, paintStroke, paintStrokeSegment} from './draw/paintStrokes'
export {DrawToolEnum} from './enums/drawToolEnum'
export {
  DEFAULT_AUDIO_WIDTH,
  DEFAULT_AUDIO_HEIGHT,
  DEFAULT_TEXT_WIDTH,
  DEFAULT_TEXT_HEIGHT,
  DEFAULT_TEXT_FONT_SIZE,
  EDIT_FRAME_MIN_SIZE,
} from './constants/elementDefaults'
export type {
  SJW,
  SPage,
  SPageBackground,
  SElement,
  SElementBase,
  STextElement,
  SImageElement,
  SAudioElement,
  SScore,
  ScoreAudioRef,
  AssetMap,
  AssetRecord,
  AssetUsage,
  RemoveAssetOptions,
  SjwMode,
  DrawStroke,
  DrawBrushOptions,
} from './types/types'
export type {
  ElementContextMenuItem,
  ElementContextMenuPayload,
  ResolvedScoreAudio,
} from './types/contextMenu'
