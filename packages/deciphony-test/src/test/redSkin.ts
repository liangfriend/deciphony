import {Skin} from "@/types/common";
import {SkinKeyEnum} from "@/enums/musicScoreEnum";

// 统一的五线谱高度
const STAFF_HEIGHT = 45;

// 五线谱小节线：五条横线，使用 0-1 归一化坐标便于缩放
// 五线从上到下：y=0, 0.25, 0.5, 0.75, 1
// 因为小节是变宽的，所以用 svg 包裹了一下，不同符号不需要
const measure = {
  content: `
    <svg
      v-if="isMeasureWithSkin"
      width="node.w"
      height="node.h"
      viewBox="0 0 100 45"
      preserveAspectRatio="none"
    >
      <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="red" stroke-width="1" />
      <line x1="0" y1="11.5" x2="100" y2="11.5" stroke="red" stroke-width="1" />
      <line x1="0" y1="22.5" x2="100" y2="22.5" stroke="red" stroke-width="1" />
      <line x1="0" y1="33.5" x2="100" y2="33.5" stroke="red" stroke-width="1" />
      <line x1="0" y1="44.5" x2="100" y2="44.5" stroke="red" stroke-width="1" />
    </svg>
`,
  w: 0, // 这个对于小节本身不起作用
  h: STAFF_HEIGHT,
  skinKey: SkinKeyEnum.Measure,
};

// 谱号
const treble = {
  content: `
    <svg width="node.w" height="node.h" viewBox="0 0 95 248" preserveAspectRatio="xMidYMid meet">
      <path
        d="M58.2521 128.588L52.5358 100.789C71.9986 84.2187 80.9814 66.5533 80.9814 47.2446C80.9814 32.3181 75.1289 16.5699 63.1519 0C49.6777 10.9553 41.9198 32.7289 41.9198 56.1458C41.9198 64.4992 43.0086 72.4417 44.7779 80.1104C14.9713 105.308 0 128.451 0 149.676C0 174.6 25.5874 195.278 53.2163 195.278C59.341 195.278 63.9685 194.319 68.1877 192.265L73.2235 216.641C76.0308 232.176 60.9865 244.44 46.4112 244.44C42.0559 244.44 37.8367 243.344 34.0258 241.427C44.0974 240.331 51.7192 234.169 51.7192 225.131C51.7192 217.051 45.1862 208.698 36.7479 208.698C27.2206 208.698 20.6877 216.093 20.6877 225.679C20.6877 239.099 31.5759 248 44.6418 248C62.1991 248 77.0344 236.497 77.0344 220.064C77.0344 216.504 71.5903 191.991 71.4542 191.17C85.4728 184.322 95 172.272 95 159.399C94.8431 138.883 77.0476 126.943 58.2521 128.588Z"
        fill="red"
      />
    </svg>
`,
  w: 18,
  h: STAFF_HEIGHT,
  skinKey: SkinKeyEnum.Treble,
};

const bass = {
  content: `
    <svg width="node.w" height="node.h" viewBox="0 0 110 108" preserveAspectRatio="xMidYMid meet">
      <path
        d="M102.654 23.3828C106.677 23.3828 109.838 20.5407 109.838 16.9234C109.838 13.3062 106.677 10.4641 102.654 10.4641C98.6315 10.4641 95.4707 13.3062 95.4707 16.9234C95.4707 20.5407 98.4878 23.3828 102.654 23.3828ZM102.654 42.7608C98.6315 42.7608 95.4707 45.6029 95.4707 49.2201C95.4707 52.8373 98.6315 55.6794 102.654 55.6794C106.677 55.6794 109.838 52.8373 109.838 49.2201C109.838 45.6029 106.677 42.7608 102.654 42.7608ZM40.2996 0C21.7656 0 4.9557 11.756 4.9557 27.1292C4.9557 37.2057 10.8854 44.9704 20.0415 45.732C40.8212 47.4606 46.2348 21.2964 24.0644 20.0239C18.1738 20.0239 13.5762 24.1579 14.0072 24.1579C13.2888 24.1579 13.0015 23.512 13.0015 22.0909C13.0015 12.9187 25.7885 4.13397 37.5698 4.13397C54.0924 4.13397 64.5806 16.5359 64.5806 33.0718C64.5806 53.6124 51.2189 76.4785 29.9551 93.6603C25.7782 97.0308 17.2127 101.693 8.71847 105.08C7.61003 105.522 7.94765 107.002 9.11336 106.747C39.4552 100.11 83.2583 69.2189 83.2583 38.3684C83.1147 21.0574 74.3505 0 40.2996 0Z"
        fill="red"
      />
    </svg>
`,
  w: 18,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.Bass,
};

const trebleBig = {...treble, w: 22, skinKey: SkinKeyEnum.Treble_big};
const bassBig = {...bass, w: 22, skinKey: SkinKeyEnum.Bass_big};

// 变音记号
const sharp = {
  content: `
    <svg width="node.w" height="node.h" viewBox="37 13 14 31" preserveAspectRatio="xMidYMid meet">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="red" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="red" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="red" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="red" />
    </svg>
`,
  w: 10,
  h: STAFF_HEIGHT * 0.9,

  skinKey: SkinKeyEnum.Sharp,
};

const flat = {
  content: `
    <svg width="node.w" height="node.h" viewBox="38 20 11.5 31" preserveAspectRatio="xMidYMid meet">
      <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="red"
        fill="transparent"
        stroke-width="1.52124"
      />
    </svg>
`,
  w: 9,
  h: STAFF_HEIGHT * 0.9,

  skinKey: SkinKeyEnum.Flat,
};

const doubleSharp = {
  content: `<svg width="node.w" height="node.h" viewBox="0 0 20 20"><text x="2" y="16" font-size="16">𝄪</text></svg>`,
  w: 10,
  h: STAFF_HEIGHT * 0.9,

  skinKey: SkinKeyEnum.Double_sharp,
};

const doubleFlat = {
  content: `<svg width="node.w" height="node.h" viewBox="0 0 20 20"><text x="2" y="16" font-size="16">𝄫</text></svg>`,
  w: 10,
  h: STAFF_HEIGHT * 0.9,

  skinKey: SkinKeyEnum.Double_flat,
};

const natural = {
  content: `<svg width="node.w" height="node.h" viewBox="0 0 20 20"><text x="3" y="16" font-size="16">♮</text></svg>`,
  w: 8,
  h: STAFF_HEIGHT * 0.9,

  skinKey: SkinKeyEnum.Natural,
};

// 小节线
const singleBarline = {
  content: `
      <line x1="0" y1="0" x2="1" y2="45" stroke="red" stroke-width="1" />
`,
  w: 1,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.Single_barline,
};

const doubleBarline = {
  content: `
      <line x1="4" y1="0" x2="4" y2="45" stroke="red" stroke-width="1" />
      <line x1="7" y1="0" x2="7" y2="45" stroke="red" stroke-width="1" />
`,
  w: 6,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.Double_barline,
};

const startRepeatBarline = {
  content: `
      <line x1="6" y1="0" x2="6" y2="45" stroke="red" stroke-width="1" />
      <line x1="10" y1="0" x2="10" y2="45" stroke="red" stroke-width="2" />
      <circle cx="14" cy="15" r="1.5" fill="red" />
      <circle cx="14" cy="30" r="1.5" fill="red" />
`,
  w: 10,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.StartRepeat_barline,
};

const endRepeatBarline = {
  content: `
      <line x1="8" y1="0" x2="8" y2="45" stroke="red" stroke-width="2" />
      <line x1="12" y1="0" x2="12" y2="45" stroke="red" stroke-width="1" />
      <circle cx="4" cy="15" r="1.5" fill="red" />
      <circle cx="4" cy="30" r="1.5" fill="red" />
`,
  w: 10,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.EndRepeat_barline,
};

const finalBarline = {
  content: `
      <line x1="4" y1="0" x2="4" y2="45" stroke="red" stroke-width="1" />
      <line x1="8" y1="0" x2="8" y2="45" stroke="red" stroke-width="3" />
`,
  w: 8,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.Final_barline,
};

const dashedBarline = {
  content: `
      <line x1="5" y1="0" x2="5" y2="45" stroke="red" stroke-width="1" stroke-dasharray="3 3" />
`,
  w: 4,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.Dashed_barline,
};

const dottedBarline = {
  content: `
      <line x1="5" y1="0" x2="5" y2="45" stroke="red" stroke-width="1" stroke-dasharray="1 3" />
`,
  w: 4,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.Dotted_barline,
};

const reverseBarline = {
  content: `
      <line x1="8" y1="0" x2="8" y2="45" stroke="red" stroke-width="1" />
      <line x1="4" y1="0" x2="4" y2="45" stroke="red" stroke-width="3" />
`,
  w: 8,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.Reverse_barline,
};

const heavyBarline = {
  content: `
      <line x1="5" y1="0" x2="5" y2="45" stroke="red" stroke-width="3" />
`,
  w: 6,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.Heavy_barline,
};

const heavyDoubleBarline = {
  content: `
      <line x1="5" y1="0" x2="5" y2="45" stroke="red" stroke-width="3" />
      <line x1="10" y1="0" x2="10" y2="45" stroke="red" stroke-width="3" />
`,
  w: 10,
  h: STAFF_HEIGHT,

  skinKey: SkinKeyEnum.Heavy_double_barline,
};

// 拍号
function makeTimeSignature(content: string, key: SkinKeyEnum) {
  const [top, bottom] = content.split("/");
  return {
    content: `<svg width="node.w" height="node.h" viewBox="0 0 20 45">
  <text x="10" y="18" text-anchor="middle" fill="red" font-size="14">${top}</text>
  <text x="10" y="36" text-anchor="middle" fill="red" font-size="14">${bottom}</text>
</svg>`,
    w: 14,
    h: STAFF_HEIGHT,
    widthRatio: 0,
    widthRatioForMeasure: 0,
    skinKey: key,
  };
}

// 音符头
function makeNoteHead(key: SkinKeyEnum) {
  return {
    content: `<svg width="node.w" height="node.h" viewBox="0 0 20 12">
  <ellipse cx="10" cy="6" rx="8" ry="5" fill="red" />
</svg>`,
    w: 10,
    h: 10,
    widthRatio: 0,
    widthRatioForMeasure: 0,
    skinKey: key,
  };
}

// 符干（高度由 transfer 动态传入 node.h，需拉伸填满故用 preserveAspectRatio="none"）
const noteStem = {
  content: `<svg width="node.w" height="node.h" viewBox="0 0 4 40" preserveAspectRatio="none">
  <line x1="2" y1="0" x2="2" y2="40" stroke="red" stroke-width="1.2" />
</svg>`,
  w: 3,
  h: 0, // 符干的高度是动态的，最小为3/4的小节高。这里h没有意义

  skinKey: SkinKeyEnum.NoteStem,
};

// 符尾
function makeNoteTail(multiplier: number, key: SkinKeyEnum) {
  return {
    content: `<svg width="node.w" height="node.h" viewBox="0 0 10 20">
  <path d="M2 0 C8 4, 8 10, 2 14" stroke="red" stroke-width="1.2" fill="none" />
</svg>`,
    w: 6,
    h: STAFF_HEIGHT * 0.6 * multiplier,
    widthRatio: 0,
    widthRatioForMeasure: 0,
    skinKey: key,
  };
}

// 休止符
function makeRest(key: SkinKeyEnum) {
  return {
    content: `<svg width="node.w" height="node.h" viewBox="0 0 20 20">
  <rect x="5" y="8" width="10" height="4" fill="red" />
</svg>`,
    w: 10,
    h: STAFF_HEIGHT * 0.6,
    widthRatio: 0,
    widthRatioForMeasure: 0,
    skinKey: key,
  };
}

export const redSkin: Skin = {
  [SkinKeyEnum.Measure]: measure,

  // 谱号
  [SkinKeyEnum.Treble]: treble,
  [SkinKeyEnum.Bass]: bass,
  [SkinKeyEnum.Treble_big]: trebleBig,
  [SkinKeyEnum.Bass_big]: bassBig,

  // 变音符
  [SkinKeyEnum.Sharp]: sharp,
  [SkinKeyEnum.Flat]: flat,
  [SkinKeyEnum.Double_sharp]: doubleSharp,
  [SkinKeyEnum.Double_flat]: doubleFlat,
  [SkinKeyEnum.Natural]: natural,

  // 小节线
  [SkinKeyEnum.Single_barline]: singleBarline,
  [SkinKeyEnum.Double_barline]: doubleBarline,
  [SkinKeyEnum.StartRepeat_barline]: startRepeatBarline,
  [SkinKeyEnum.EndRepeat_barline]: endRepeatBarline,
  [SkinKeyEnum.Dashed_barline]: dashedBarline,
  [SkinKeyEnum.Final_barline]: finalBarline,
  [SkinKeyEnum.Start_end_repeat_barline]: startRepeatBarline,
  [SkinKeyEnum.Dotted_barline]: dottedBarline,
  [SkinKeyEnum.Reverse_barline]: reverseBarline,
  [SkinKeyEnum.Heavy_barline]: heavyBarline,
  [SkinKeyEnum.Heavy_double_barline]: heavyDoubleBarline,

  // 拍号
  [SkinKeyEnum["1_1"]]: makeTimeSignature("1/1", SkinKeyEnum["1_1"]),
  [SkinKeyEnum["1_4"]]: makeTimeSignature("1/4", SkinKeyEnum["1_4"]),
  [SkinKeyEnum["2_4"]]: makeTimeSignature("2/4", SkinKeyEnum["2_4"]),
  [SkinKeyEnum["3_4"]]: makeTimeSignature("3/4", SkinKeyEnum["3_4"]),
  [SkinKeyEnum["4_4"]]: makeTimeSignature("4/4", SkinKeyEnum["4_4"]),
  [SkinKeyEnum["6_8"]]: makeTimeSignature("6/8", SkinKeyEnum["6_8"]),

  // 音符头
  [SkinKeyEnum.NoteHead_1]: makeNoteHead(SkinKeyEnum.NoteHead_1),
  [SkinKeyEnum.NoteHead_2]: makeNoteHead(SkinKeyEnum.NoteHead_2),
  [SkinKeyEnum.NoteHead_3]: makeNoteHead(SkinKeyEnum.NoteHead_3),

  // 符干
  [SkinKeyEnum.NoteStem]: noteStem,

  // 符尾
  [SkinKeyEnum.NoteTail_1]: makeNoteTail(1, SkinKeyEnum.NoteTail_1),
  [SkinKeyEnum.NoteTail_2]: makeNoteTail(1.1, SkinKeyEnum.NoteTail_2),
  [SkinKeyEnum.NoteTail_3]: makeNoteTail(1.2, SkinKeyEnum.NoteTail_3),
  [SkinKeyEnum.NoteTail_4]: makeNoteTail(1.3, SkinKeyEnum.NoteTail_4),
  [SkinKeyEnum.NoteTail_5]: makeNoteTail(1.4, SkinKeyEnum.NoteTail_5),
  [SkinKeyEnum.NoteTail_6]: makeNoteTail(1.5, SkinKeyEnum.NoteTail_6),

  // 休止符
  [SkinKeyEnum.rest_1]: makeRest(SkinKeyEnum.rest_1),
  [SkinKeyEnum.rest_2]: makeRest(SkinKeyEnum.rest_2),
  [SkinKeyEnum.rest_3]: makeRest(SkinKeyEnum.rest_3),
  [SkinKeyEnum.rest_4]: makeRest(SkinKeyEnum.rest_4),
  [SkinKeyEnum.rest_5]: makeRest(SkinKeyEnum.rest_5),
  [SkinKeyEnum.rest_6]: makeRest(SkinKeyEnum.rest_6),
  [SkinKeyEnum.rest_7]: makeRest(SkinKeyEnum.rest_7),
  [SkinKeyEnum.rest_8]: makeRest(SkinKeyEnum.rest_8),
  [SkinKeyEnum.rest_9]: makeRest(SkinKeyEnum.rest_9),
};