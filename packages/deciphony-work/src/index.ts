import SJWPDF from './components/SJWPDF.vue'

export default SJWPDF
export {default as Page} from './components/Page.vue'
export {default as Score} from './components/Score.vue'
export {default as AudioPlayer} from './components/AudioPlayer.vue'
export {default as VideoPlayer} from './components/VideoPlayer.vue'
export {default as EditFrame} from './components/EditFrame.vue'
export {addText, addImage, addAudio, addVideo, removeElement} from './api/elements'
export type {AddTextOptions, AddImageOptions, AddAudioOptions, AddVideoOptions} from './api/elements'
export {addScore, removeScore, getScoreAudios, collectScoreAudioSrcs, collectScoreAssetSrcs} from './api/scores'
export type {
  AddScoreOptions,
  AddScoreHostOptions,
  ScoreAudioInput,
  ScoreAudioHostInput,
  ScoreSkinInput,
  ScoreSkinHostInput,
} from './api/scores'
export {addPage, insertPage, removePage, createEmptyPage, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT} from './api/pages'
export type {AddPageOptions} from './api/pages'
export {setBackground, clearBackground} from './api/background'
export type {SetBackgroundOptions} from './api/background'
export {
  cropImage,
  cropScore,
  clearCrop,
  normalizeCropArea,
  setCropRect,
  ensureImageNaturalSize,
  fitScoreFrameToSource,
} from './api/crop'
export {
  cropScoreByGrandStaff,
  getScoreVerticalBands,
  scoreVerticalBands,
  grandStaffRangeToCropArea,
} from './api/scoreGrandStaffCrop'
export type {ScoreVerticalBand, CropScoreByGrandStaffOptions} from './api/scoreGrandStaffCrop'
export {renderPageToCanvas} from './export/renderPage'
export type {ExportAssetContext, RenderPageOptions} from './export/renderPage'
export {exportPageImage, exportPagesAsImages, exportPagesAsPdf, downloadBlob} from './export/exportWork'
export type {ExportImageType, ExportPagesOptions, ExportImagesOptions, ExportPdfOptions} from './export/exportWork'
export {buildPdf} from './export/pdfWriter'
export type {PdfPageImage, PdfInfo} from './export/pdfWriter'
export {
  createScorePlayback,
  ACCOMPANIMENT_TIME_PROP,
  VOCAL_TIME_PROP,
  PLAY_SMOOTH_ENVELOPE,
} from './play/scorePlayback'
export type {
  ScorePlayback,
  ScorePlayHost,
  ScorePlaybackOptions,
  ScorePlayOptions,
  PlaybackMode,
} from './play/scorePlayback'
export {createAssetStore, createAssetFilename, createAssetId} from './assets/assetStore'
export {readImageSize} from './assets/imageSize'
export {readVideoSize} from './assets/videoSize'
export {
  parseSkinFile,
  resolveSkinPack,
  skinPackToFile,
  isSkinPack,
} from './assets/skinAsset'
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
  DEFAULT_VIDEO_WIDTH,
  DEFAULT_VIDEO_HEIGHT,
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
  SCropRect,
  CropArea,
  CropOptions,
  SAudioElement,
  SVideoElement,
  SScore,
  ScoreAudioRef,
  ScoreRangeSelect,
  ScoreRangeChangePayload,
  AssetMap,
  AssetRecord,
  AssetUsage,
  RemoveAssetOptions,
  SjwMode,
  SjwSelection,
  DrawStroke,
  DrawBrushOptions,
} from './types/types'
export type {
  ElementContextMenuItem,
  ElementContextMenuPayload,
  ResolvedScoreAudio,
} from './types/contextMenu'
