import {NumberNotationSkinPack, SkinPack, StandardStaffSkinPack} from "@/types/common";
import {StandardStaffSkinKeyEnum} from "@/standardStaff/enums/standardStaffSkinKeyEnum";
import {NumberNotationSkinKeyEnum} from "@/numberNotation/enums/numberNotationSkinKeyEnum";
/*
* w和h不会影响图形的宽高，图形的宽高是图形本身决定的，w和h是皮肤开发者要计算出图形的宽高显示写到属性中，让坐标系统识别
* 因为svg嵌套的行为我没有掌握，所以舍弃了svg嵌套这一做法
* TODO 后续也许可以升级成自动识别w和h,无需皮肤开发者去写
* */
// 统一的五线谱高度
const STAFF_HEIGHT = 45;

const measure = {
  content: `
      <line x1="0" y1="0.5" x2="node.w" y2="0.5" stroke="black" stroke-width="1" />
      <line x1="0" y1="11.5" x2="node.w" y2="11.5" stroke="black" stroke-width="1" />
      <line x1="0" y1="22.5" x2="node.w" y2="22.5" stroke="black" stroke-width="1" />
      <line x1="0" y1="33.5" x2="node.w" y2="33.5" stroke="black" stroke-width="1" />
      <line x1="0" y1="44.5" x2="node.w" y2="44.5" stroke="black" stroke-width="1" />
`,
  w: 1, // 这个写成线宽
  h: STAFF_HEIGHT,
  skinKey: StandardStaffSkinKeyEnum.Measure,
};

// 谱号
const treble = {
  content: `
       <g transform="
               scale(0.18)">
        <path id="Vector"
              d="M58.2521 128.588L52.5358 100.789C71.9986 84.2187 80.9814 66.5533 80.9814 47.2446C80.9814 32.3181 75.1289 16.5699 63.1519 0C49.6777 10.9553 41.9198 32.7289 41.9198 56.1458C41.9198 64.4992 43.0086 72.4417 44.7779 80.1104C14.9713 105.308 0 128.451 0 149.676C0 174.6 25.5874 195.278 53.2163 195.278C59.341 195.278 63.9685 194.319 68.1877 192.265L73.2235 216.641C76.0308 232.176 60.9865 244.44 46.4112 244.44C42.0559 244.44 37.8367 243.344 34.0258 241.427C44.0974 240.331 51.7192 234.169 51.7192 225.131C51.7192 217.051 45.1862 208.698 36.7479 208.698C27.2206 208.698 20.6877 216.093 20.6877 225.679C20.6877 239.099 31.5759 248 44.6418 248C62.1991 248 77.0344 236.497 77.0344 220.064C77.0344 216.504 71.5903 191.991 71.4542 191.17C85.4728 184.322 95 172.272 95 159.399C94.8431 138.883 77.0476 126.943 58.2521 128.588ZM65.4656 18.7609C71.9195 18.7609 74.3123 29.9375 74.3123 34.9199C74.3123 47.6554 65.3295 62.0342 47.6361 77.7824C44.0453 63.3306 46.2924 18.7609 65.4656 18.7609ZM12.1132 156.66C12.1132 139.132 25.043 121.056 49.5415 102.706L54.9857 128.998C41.3754 131.874 29.8066 143.514 29.8066 156.523C29.8066 167.616 37.7006 175.284 49.4054 177.202C42.192 172.683 38.6533 167.068 38.6533 160.358C38.6533 151.32 47.0917 144.61 57.8438 143.103L67.235 188.431C45.0494 200.606 12.1132 182.493 12.1132 156.66ZM70.5014 186.65L61.2464 142.692C73.7567 141.724 83.5673 151.091 83.5673 164.055C83.5673 172.683 79.0759 180.214 70.5014 186.65Z"
              fill="black"/>
    </g>
`,
  w: 95 * 0.18 + 5, // 宽高一定要等于图形的宽高，否则会导致布局错误
  h: 248 * 0.18,
  skinKey: StandardStaffSkinKeyEnum.Treble,
};

const alto = {
  content: `
       <g transform="translate(0.0000, -1.2500)">
        <g transform=" scale(1,1.8) scale(0.09259259) scale(0.6,0.6)">
                <rect id="XMLID_517_" y="7.5" width="60" height="270"></rect>
                <rect id="XMLID_518_" x="90" y="7.5" width="30" height="270"></rect>
                <path id="XMLID_519_" d="M225,157.428v-29.855c33.084,0,60-26.916,60-60c0-33.084-26.916-60-60-60   c-31.424,0-57.18,23.901-59.779,54.892c-0.02,0.158-0.173,1.825-0.173,2.515c0,0.031,0.005,0.06,0.005,0.091   c-0.001,0.024-0.004,0.047-0.005,0.071l0.009,0.001c0.088,10.97,9,19.837,19.991,19.837c11.046,0,20-8.954,20-20   c0-5.252-2.041-10.017-5.353-13.586c5.326-8.344,14.666-13.821,25.305-13.821c16.542,0,30,13.458,30,30c0,16.542-13.458,30-30,30   V82.5l-75,60l75,60v-15.072c16.542,0,30,13.458,30,29.999c0,16.542-13.458,30.001-30,30.001c-10.639,0-19.979-5.477-25.305-13.821   c3.312-3.569,5.353-8.333,5.353-13.586c0-11.046-8.954-20-20-20c-10.991,0-19.903,8.868-19.991,19.837l-0.009,0.001   c0.001,0.024,0.004,0.047,0.005,0.071c0,0.031-0.005,0.06-0.005,0.091c0,0.69,0.153,2.357,0.173,2.515   c2.6,30.991,28.355,54.892,59.779,54.892c33.084,0,60-26.916,60-60.001C285,184.343,258.084,157.428,225,157.428z"></path>
            </g>
</g>
`,
  w: 15.83 + 5,
  h: 45 * 0.6,

  skinKey: StandardStaffSkinKeyEnum.Bass,
};
const tenor = {
  content: `
       <g transform="translate(0.0000, -1.2500) translate(0.0000, -11)">
        <g transform=" scale(1,1.8) scale(0.09259259) scale(0.6,0.6)">
                <rect id="XMLID_517_" y="7.5" width="60" height="270"></rect>
                <rect id="XMLID_518_" x="90" y="7.5" width="30" height="270"></rect>
                <path id="XMLID_519_" d="M225,157.428v-29.855c33.084,0,60-26.916,60-60c0-33.084-26.916-60-60-60   c-31.424,0-57.18,23.901-59.779,54.892c-0.02,0.158-0.173,1.825-0.173,2.515c0,0.031,0.005,0.06,0.005,0.091   c-0.001,0.024-0.004,0.047-0.005,0.071l0.009,0.001c0.088,10.97,9,19.837,19.991,19.837c11.046,0,20-8.954,20-20   c0-5.252-2.041-10.017-5.353-13.586c5.326-8.344,14.666-13.821,25.305-13.821c16.542,0,30,13.458,30,30c0,16.542-13.458,30-30,30   V82.5l-75,60l75,60v-15.072c16.542,0,30,13.458,30,29.999c0,16.542-13.458,30.001-30,30.001c-10.639,0-19.979-5.477-25.305-13.821   c3.312-3.569,5.353-8.333,5.353-13.586c0-11.046-8.954-20-20-20c-10.991,0-19.903,8.868-19.991,19.837l-0.009,0.001   c0.001,0.024,0.004,0.047,0.005,0.071c0,0.031-0.005,0.06-0.005,0.091c0,0.69,0.153,2.357,0.173,2.515   c2.6,30.991,28.355,54.892,59.779,54.892c33.084,0,60-26.916,60-60.001C285,184.343,258.084,157.428,225,157.428z"></path>
            </g>
</g>
`,
  w: 15.83 + 5,
  h: 45 * 0.6,

  skinKey: StandardStaffSkinKeyEnum.Bass,
};
const bass = {
  content: `
    <g transform="
               scale(0.3)">
      <path
        d="M102.654 23.3828C106.677 23.3828 109.838 20.5407 109.838 16.9234C109.838 13.3062 106.677 10.4641 102.654 10.4641C98.6315 10.4641 95.4707 13.3062 95.4707 16.9234C95.4707 20.5407 98.4878 23.3828 102.654 23.3828ZM102.654 42.7608C98.6315 42.7608 95.4707 45.6029 95.4707 49.2201C95.4707 52.8373 98.6315 55.6794 102.654 55.6794C106.677 55.6794 109.838 52.8373 109.838 49.2201C109.838 45.6029 106.677 42.7608 102.654 42.7608ZM40.2996 0C21.7656 0 4.9557 11.756 4.9557 27.1292C4.9557 37.2057 10.8854 44.9704 20.0415 45.732C40.8212 47.4606 46.2348 21.2964 24.0644 20.0239C18.1738 20.0239 13.5762 24.1579 14.0072 24.1579C13.2888 24.1579 13.0015 23.512 13.0015 22.0909C13.0015 12.9187 25.7885 4.13397 37.5698 4.13397C54.0924 4.13397 64.5806 16.5359 64.5806 33.0718C64.5806 53.6124 51.2189 76.4785 29.9551 93.6603C25.7782 97.0308 17.2127 101.693 8.71847 105.08C7.61003 105.522 7.94765 107.002 9.11336 106.747C39.4552 100.11 83.2583 69.2189 83.2583 38.3684C83.1147 21.0574 74.3505 0 40.2996 0Z"
        fill="black"
      />
    </g>
`,
  w: 104.88 * 0.3 + 5,
  h: 106.78 * 0.3,

  skinKey: StandardStaffSkinKeyEnum.Bass,
};

const trebleF = {
  content: `
       <g transform="
               scale(0.32)">
          <path id="Vector"
                d="M58.2521 128.588L52.5358 100.789C71.9986 84.2187 80.9814 66.5533 80.9814 47.2446C80.9814 32.3181 75.1289 16.5699 63.1519 0C49.6777 10.9553 41.9198 32.7289 41.9198 56.1458C41.9198 64.4992 43.0086 72.4417 44.7779 80.1104C14.9713 105.308 0 128.451 0 149.676C0 174.6 25.5874 195.278 53.2163 195.278C59.341 195.278 63.9685 194.319 68.1877 192.265L73.2235 216.641C76.0308 232.176 60.9865 244.44 46.4112 244.44C42.0559 244.44 37.8367 243.344 34.0258 241.427C44.0974 240.331 51.7192 234.169 51.7192 225.131C51.7192 217.051 45.1862 208.698 36.7479 208.698C27.2206 208.698 20.6877 216.093 20.6877 225.679C20.6877 239.099 31.5759 248 44.6418 248C62.1991 248 77.0344 236.497 77.0344 220.064C77.0344 216.504 71.5903 191.991 71.4542 191.17C85.4728 184.322 95 172.272 95 159.399C94.8431 138.883 77.0476 126.943 58.2521 128.588ZM65.4656 18.7609C71.9195 18.7609 74.3123 29.9375 74.3123 34.9199C74.3123 47.6554 65.3295 62.0342 47.6361 77.7824C44.0453 63.3306 46.2924 18.7609 65.4656 18.7609ZM12.1132 156.66C12.1132 139.132 25.043 121.056 49.5415 102.706L54.9857 128.998C41.3754 131.874 29.8066 143.514 29.8066 156.523C29.8066 167.616 37.7006 175.284 49.4054 177.202C42.192 172.683 38.6533 167.068 38.6533 160.358C38.6533 151.32 47.0917 144.61 57.8438 143.103L67.235 188.431C45.0494 200.606 12.1132 182.493 12.1132 156.66ZM70.5014 186.65L61.2464 142.692C73.7567 141.724 83.5673 151.091 83.5673 164.055C83.5673 172.683 79.0759 180.214 70.5014 186.65Z"
                fill="black"/>
      </g>
`, w: 95 * 0.32 + 5, h: 79.36, skinKey: StandardStaffSkinKeyEnum.Treble_f
};
const bassF = {
  content: `
    <g transform=" translate(-2.0814, 0.0000)
               scale(0.42)">
      <path
        d="M102.654 23.3828C106.677 23.3828 109.838 20.5407 109.838 16.9234C109.838 13.3062 106.677 10.4641 102.654 10.4641C98.6315 10.4641 95.4707 13.3062 95.4707 16.9234C95.4707 20.5407 98.4878 23.3828 102.654 23.3828ZM102.654 42.7608C98.6315 42.7608 95.4707 45.6029 95.4707 49.2201C95.4707 52.8373 98.6315 55.6794 102.654 55.6794C106.677 55.6794 109.838 52.8373 109.838 49.2201C109.838 45.6029 106.677 42.7608 102.654 42.7608ZM40.2996 0C21.7656 0 4.9557 11.756 4.9557 27.1292C4.9557 37.2057 10.8854 44.9704 20.0415 45.732C40.8212 47.4606 46.2348 21.2964 24.0644 20.0239C18.1738 20.0239 13.5762 24.1579 14.0072 24.1579C13.2888 24.1579 13.0015 23.512 13.0015 22.0909C13.0015 12.9187 25.7885 4.13397 37.5698 4.13397C54.0924 4.13397 64.5806 16.5359 64.5806 33.0718C64.5806 53.6124 51.2189 76.4785 29.9551 93.6603C25.7782 97.0308 17.2127 101.693 8.71847 105.08C7.61003 105.522 7.94765 107.002 9.11336 106.747C39.4552 100.11 83.2583 69.2189 83.2583 38.3684C83.1147 21.0574 74.3505 0 40.2996 0Z"
        fill="black"
      />
    </g>
`, w: 104.88 * 0.42 + 5,
  h: 45, skinKey: StandardStaffSkinKeyEnum.Bass_f
};

const altoF = {
  content: `
       <g transform="translate(0.0000, -1.2500)">
        <g transform=" scale(1,1.8) scale(0.09259259)">
                <rect id="XMLID_517_" y="7.5" width="60" height="270"></rect>
                <rect id="XMLID_518_" x="90" y="7.5" width="30" height="270"></rect>
                <path id="XMLID_519_" d="M225,157.428v-29.855c33.084,0,60-26.916,60-60c0-33.084-26.916-60-60-60   c-31.424,0-57.18,23.901-59.779,54.892c-0.02,0.158-0.173,1.825-0.173,2.515c0,0.031,0.005,0.06,0.005,0.091   c-0.001,0.024-0.004,0.047-0.005,0.071l0.009,0.001c0.088,10.97,9,19.837,19.991,19.837c11.046,0,20-8.954,20-20   c0-5.252-2.041-10.017-5.353-13.586c5.326-8.344,14.666-13.821,25.305-13.821c16.542,0,30,13.458,30,30c0,16.542-13.458,30-30,30   V82.5l-75,60l75,60v-15.072c16.542,0,30,13.458,30,29.999c0,16.542-13.458,30.001-30,30.001c-10.639,0-19.979-5.477-25.305-13.821   c3.312-3.569,5.353-8.333,5.353-13.586c0-11.046-8.954-20-20-20c-10.991,0-19.903,8.868-19.991,19.837l-0.009,0.001   c0.001,0.024,0.004,0.047,0.005,0.071c0,0.031-0.005,0.06-0.005,0.091c0,0.69,0.153,2.357,0.173,2.515   c2.6,30.991,28.355,54.892,59.779,54.892c33.084,0,60-26.916,60-60.001C285,184.343,258.084,157.428,225,157.428z"></path>
            </g>
</g>
`,
  w: 26.39 + 5,
  h: 45,

  skinKey: StandardStaffSkinKeyEnum.Alto_f,
};
const tenorF = {
  content: `
       <g transform="translate(0.0000, -1.2500) translate(0, -11)">
        <g transform=" scale(1,1.8) scale(0.09259259) ">
                <rect id="XMLID_517_" y="7.5" width="60" height="270"></rect>
                <rect id="XMLID_518_" x="90" y="7.5" width="30" height="270"></rect>
                <path id="XMLID_519_" d="M225,157.428v-29.855c33.084,0,60-26.916,60-60c0-33.084-26.916-60-60-60   c-31.424,0-57.18,23.901-59.779,54.892c-0.02,0.158-0.173,1.825-0.173,2.515c0,0.031,0.005,0.06,0.005,0.091   c-0.001,0.024-0.004,0.047-0.005,0.071l0.009,0.001c0.088,10.97,9,19.837,19.991,19.837c11.046,0,20-8.954,20-20   c0-5.252-2.041-10.017-5.353-13.586c5.326-8.344,14.666-13.821,25.305-13.821c16.542,0,30,13.458,30,30c0,16.542-13.458,30-30,30   V82.5l-75,60l75,60v-15.072c16.542,0,30,13.458,30,29.999c0,16.542-13.458,30.001-30,30.001c-10.639,0-19.979-5.477-25.305-13.821   c3.312-3.569,5.353-8.333,5.353-13.586c0-11.046-8.954-20-20-20c-10.991,0-19.903,8.868-19.991,19.837l-0.009,0.001   c0.001,0.024,0.004,0.047,0.005,0.071c0,0.031-0.005,0.06-0.005,0.091c0,0.69,0.153,2.357,0.173,2.515   c2.6,30.991,28.355,54.892,59.779,54.892c33.084,0,60-26.916,60-60.001C285,184.343,258.084,157.428,225,157.428z"></path>
            </g>
</g>
`,
  w: 26.39 + 5,
  h: 45,

  skinKey: StandardStaffSkinKeyEnum.Alto_f,
};

// 变音记号
const sharp = {
  content: `
    <g transform="
    translate(-37.88,-13.1562),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
`,
  w: 12.24,
  h: 30.04,

  skinKey: StandardStaffSkinKeyEnum.Sharp,
};

const flat = {
  content: `
     <g transform="translate(-39.6836, -20.7969)">
      <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
      />
  </g>
`,
  w: 8.63,
  h: 29.42,

  skinKey: StandardStaffSkinKeyEnum.Flat,
};

const doubleSharp = {
  content: `
     <g transform="translate(-37.8828, -13.1562)">
         <rect id="Rectangle 1264" x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black"></rect>
        <rect id="Rectangle 1265" x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black"></rect>
        <path id="Rectangle 1266" d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black"></path>
        <path id="Rectangle 1267" d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black"></path>
        <g transform="translate(14,0)">
            <rect id="Rectangle 1264" x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black"></rect>
            <rect id="Rectangle 1265" x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black"></rect>
            <path id="Rectangle 1266" d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black"></path>
            <path id="Rectangle 1267" d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black"></path>
        </g>
</g>
`,
  w: 26.24,
  h: 30.04,

  skinKey: StandardStaffSkinKeyEnum.Double_sharp,
};

const doubleFlat = {
  content: `<g transform="translate(-39.6836, -21.7969)">
        <path d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969" stroke="black" fill="transparent" stroke-width="1.52124"></path>
        <g transform="translate(11,0)">
            <path d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969" stroke="black" fill="transparent" stroke-width="1.52124"></path>
    
        </g>
</g>`,
  w: 19.63,
  h: 29.42,

  skinKey: StandardStaffSkinKeyEnum.Double_flat,
};

const natural = {
  content: `<g transform="translate(-3.5000, -11.0000)">
        <path id="natural_1_" d="M5.1,23.1v5.1l5.6-1.2v-5L5.1,23.1z M12.2,17.8V39h-1.6v-8.3l-7.1,1.5V11h1.6v8.3L12.2,17.8z"></path>
</g>`,
  w: 8.7,
  h: 28,

  skinKey: StandardStaffSkinKeyEnum.Natural,
};

// 调号：C 为空；其余由 sharp/flat 按五线位置堆叠。keySignature 小节居中，上方留 3 格，h = STAFF_HEIGHT + 3*LINE_SPACING
const LINE_SPACING = STAFF_HEIGHT / 8;
const KEY_SIG_EXTRA_TOP = 3 * LINE_SPACING;
const KEY_SIG_H = STAFF_HEIGHT + KEY_SIG_EXTRA_TOP;
const SHARP_HALF_H = sharp.h / 2;
const FLAT_HALF_H = flat.h / 2;
const SHARP_INNER = sharp.content.trim().replace(/\s+/g, ' ');
const FLAT_INNER = flat.content.trim().replace(/\s+/g, ' ');
const KEY_SIG_SHARP_OFFSET_X = sharp.w * 0.45;
const KEY_SIG_FLAT_OFFSET_X = flat.w * 0.4;

function makeKeySignature(key: StandardStaffSkinKeyEnum): {
  content: string;
  w: number;
  h: number;
  skinKey: StandardStaffSkinKeyEnum
} {
  if (key === StandardStaffSkinKeyEnum.C) {
    return {content: '', w: 0, h: STAFF_HEIGHT, skinKey: key};
  }
  const sharpKeys = [
    StandardStaffSkinKeyEnum.G,
    StandardStaffSkinKeyEnum.D,
    StandardStaffSkinKeyEnum.A,
    StandardStaffSkinKeyEnum.E,
    StandardStaffSkinKeyEnum.B,
    StandardStaffSkinKeyEnum.F_sharp,
    StandardStaffSkinKeyEnum.C_sharp,
  ];
  const flatKeys = [
    StandardStaffSkinKeyEnum.F,
    StandardStaffSkinKeyEnum.B_flat,
    StandardStaffSkinKeyEnum.E_flat,
    StandardStaffSkinKeyEnum.A_flat,
    StandardStaffSkinKeyEnum.D_flat,
    StandardStaffSkinKeyEnum.G_flat,
    StandardStaffSkinKeyEnum.C_flat,
  ];
  const sharpCount = sharpKeys.indexOf(key) + 1;
  const flatCount = flatKeys.indexOf(key) + 1;
  if (sharpCount > 0) {
    const items: { x: number; y: number }[] = [];
    for (let i = 0; i < sharpCount; i++) {
      const centerY = KEY_SIG_EXTRA_TOP + i * (LINE_SPACING / 2);
      items.push({x: i * KEY_SIG_SHARP_OFFSET_X, y: centerY - SHARP_HALF_H});
    }
    const content = items.map(({
                                 x,
                                 y
                               }) => `<g transform="translate(${x.toFixed(2)},${y.toFixed(2)})">${SHARP_INNER}</g>`).join('');
    const w = sharp.w + (sharpCount - 1) * KEY_SIG_SHARP_OFFSET_X;
    return {content, w, h: KEY_SIG_H, skinKey: key};
  }
  if (flatCount > 0) {
    const items: { x: number; y: number }[] = [];
    for (let i = 0; i < flatCount; i++) {
      const centerY = KEY_SIG_EXTRA_TOP + i * (LINE_SPACING / 2);
      items.push({x: i * KEY_SIG_FLAT_OFFSET_X, y: centerY - FLAT_HALF_H});
    }
    const content = items.map(({
                                 x,
                                 y
                               }) => `<g transform="translate(${x.toFixed(2)},${y.toFixed(2)})">${FLAT_INNER}</g>`).join('');
    const w = flat.w + (flatCount - 1) * KEY_SIG_FLAT_OFFSET_X;
    return {content, w, h: KEY_SIG_H, skinKey: key};
  }
  return {content: '', w: 0, h: STAFF_HEIGHT, skinKey: key};
}

// 小节线
const singleBarline = {
  content: `
      <line x1="4.5" y1="0" x2="4.5" y2="45" stroke="black" stroke-width="1" />
`,
  w: 5,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.Single_barline,
};

const doubleBarline = {
  content: `
      <line x1="4" y1="0" x2="4" y2="45" stroke="black" stroke-width="1" />
      <line x1="7" y1="0" x2="7" y2="45" stroke="black" stroke-width="1" />
`,
  w: 6,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.Double_barline,
};

const startRepeatBarline = {
  content: `
      <line x1="6" y1="0" x2="6" y2="45" stroke="black" stroke-width="3" />
      <line x1="10" y1="0" x2="10" y2="45" stroke="black" stroke-width="2" />
      <circle cx="14" cy="15" r="1.5" fill="black" />
      <circle cx="14" cy="30" r="1.5" fill="black" />
`,
  w: 11.5,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.StartRepeat_barline,
};

const endRepeatBarline = {
  content: `
      <line x1="8" y1="0" x2="8" y2="45" stroke="black" stroke-width="2" />
      <line x1="12" y1="0" x2="12" y2="45" stroke="black" stroke-width="3" />
      <circle cx="4" cy="15" r="1.5" fill="black" />
      <circle cx="4" cy="30" r="1.5" fill="black" />
`,
  w: 12,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.EndRepeat_barline,
};
const startEndRepeatBarline = {
  content: `
      <circle cx="4" cy="15" r="1.5" fill="black" />
<circle cx="4" cy="30" r="1.5" fill="black" />
<line x1="8" y1="0" x2="8" y2="45" stroke="black" stroke-width="2" />
<line x1="12" y1="0" x2="12" y2="45" stroke="black" stroke-width="3" />
<line x1="16" y1="0" x2="16" y2="45" stroke="black" stroke-width="2" />
<circle cx="20" cy="15" r="1.5" fill="black" />
<circle cx="20" cy="30" r="1.5" fill="black" />
`,
  w: 21.5,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.EndRepeat_barline,

}

const finalBarline = {
  content: `
      <line x1="4" y1="0" x2="4" y2="45" stroke="black" stroke-width="1" />
      <line x1="8" y1="0" x2="8" y2="45" stroke="black" stroke-width="3" />
`,
  w: 8,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.Final_barline,
};

const dashedBarline = {
  content: `
      <line x1="5" y1="0" x2="5" y2="45" stroke="black" stroke-width="1" stroke-dasharray="3 3" />
`,
  w: 4,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.Dashed_barline,
};

const dottedBarline = {
  content: `
      <line x1="5" y1="0" x2="5" y2="45" stroke="black" stroke-width="1" stroke-dasharray="1 3" />
`,
  w: 4,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.Dotted_barline,
};

const reverseBarline = {
  content: `
      <line x1="8" y1="0" x2="8" y2="45" stroke="black" stroke-width="1" />
      <line x1="4" y1="0" x2="4" y2="45" stroke="black" stroke-width="3" />
`,
  w: 8,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.Reverse_barline,
};

const heavyBarline = {
  content: `
      <line x1="5" y1="0" x2="5" y2="45" stroke="black" stroke-width="3" />
`,
  w: 6,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.Heavy_barline,
};

const heavyDoubleBarline = {
  content: `
      <line x1="5" y1="0" x2="5" y2="45" stroke="black" stroke-width="3" />
      <line x1="10" y1="0" x2="10" y2="45" stroke="black" stroke-width="3" />
`,
  w: 10,
  h: STAFF_HEIGHT,

  skinKey: StandardStaffSkinKeyEnum.Heavy_double_barline,
};

// 拍号
function makeTimeSignature(content: string, key: StandardStaffSkinKeyEnum) {
  const [top, bottom] = content.split("/");
  return {
    content: `<g >
  <text x="15" y="24" text-anchor="middle"  font-size="22" font-weight="600">${top}</text>
  <text x="15" y="46" text-anchor="middle" font-size="22"  font-weight="600">${bottom}</text>
</g>`,
    w: 30,
    h: 56,
    widthRatio: 0,
    widthRatioForMeasure: 0,
    skinKey: key,
  };
}

// 音符头：1=全音符空心椭圆(h=10)，2=倾斜空心，3=倾斜实心
function makeNoteHead(key: StandardStaffSkinKeyEnum) {
  // 全音符：不倾斜的圆环 path，稍大（外圈 8×5，内圈 5×2.5）
  const uprightRingPath = "M 16 4 A 8 5 0 0 1 0 4 A 8 5 0 0 1 16 4 L 13 4 A 5 2.5 0 0 0 3 4 A 5 2.5 0 0 0 13 4 Z";
  if (key === StandardStaffSkinKeyEnum.NoteHead_1) {
    return {
      content: `<g transform="translate(0, 1)">
        <path d="${uprightRingPath}" fill="black"></path>
</g>`,
      w: 16,
      h: 10,
      skinKey: key,
    };
  }
  // 空心倾斜：外圈闭合后向内约 3px 再绕内圈一周形成圆环（加厚）
  const ringPath = "M 15 4 A 7 4.5 -20 0 1 1 4 A 7 4.5 -20 0 1 15 4 L 11.76 5.37 A 4 2 -20 0 0 4.24 2.63 A 4 2 -20 0 0 11.76 5.37 Z";
  const tiltedEllipse = `
<g transform="translate(-0.7051, 1.2474)">
        <path d="${ringPath}" fill="black"></path>
</g>
`;
  const tiltedEllipseFilled = `
<g transform="translate(-0.7051, 1.2474)">
        <path d="M 15 4 A 7 4.5 -20 0 1 1 4 A 7 4.5 -20 0 1 15 4" fill="black"></path>
</g>
`;
  if (key === StandardStaffSkinKeyEnum.NoteHead_2) {
    return {content: tiltedEllipse, w: 14.59, h: 10.49, skinKey: key};
  }
  if (key === StandardStaffSkinKeyEnum.NoteHead_3) {
    return {content: tiltedEllipseFilled, w: 14.59, h: 10.49, skinKey: key};
  }

  return {content: tiltedEllipseFilled, w: 14, h: 90, skinKey: key};
}

// 符干（高度由 transfer 动态传入 node.h，需拉伸填满故用 preserveAspectRatio="none"）
const noteStem = {
  content: `<g >
  <rect width="node.w" height="node.h" />
</g>`,
  w: 1,
  h: 0, // 符干的高度是动态的，最小为3/4的小节高。这里h没有意义

  skinKey: StandardStaffSkinKeyEnum.NoteStem,
};

// 符尾
function makeNoteTail(multiplier: number, key: StandardStaffSkinKeyEnum) {
  if (key === StandardStaffSkinKeyEnum.NoteTail_1) {
    return {
      content: `<g transform=" scale(1.5) translate(0.7000, 0.0000) ">
        <path d="     M3.9,15.4c0.5-1.5,1.1-3.8,0.3-5.6C3.5,8.2,2,6.8-0.1,6.1l-0.1,0.8h-0.5V0h0.6l0.3,2c0.3,1,0.6,1.2,1.2,2L2,4.8l2.1,2.6  c2.3,2.9,1.1,6.4-0.1,8.1C4,15.6,3.8,15.7,3.9,15.4z   " fill="black"></path>
</g>`,
      w: 9.16, // 符尾的宽高其实不参与计算，这个完全是左上定点对齐的，但是这里还是写一下吧
      h: 23.4,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_2) {
    return {
      content: `<g transform=" scale(1.5) translate(0.7000, 0.0000)">
        <path d="     M5.8,10.3C5.7,8.7,5.2,7.3,4.1,6c-0.7-1-1.7-2-3-3c-0.5-0.5-0.8-1-1-1.5L-0.1,0h-0.6v10h0.5V9.6c1.3,0.4,2.5,1.2,3.3,2  c0.5,0.5,0.8,1.1,1.1,1.6C5,15.1,4.5,17.1,4,18.6c0,0.1,0.1,0.1,0.1,0.1c0.2-0.3,0.4-0.4,0.6-0.9c0.2-0.4,0.4-0.9,0.5-1.4  c0.2-0.7,0.3-1.4,0.2-2.1l0,0c0-0.4-0.1-0.8-0.2-1.3C5.7,12.3,5.8,11.1,5.8,10.3z M4.1,10.9L3,9.6L2,8.3L1.4,7.5  c-0.5-0.7-0.9-1-1.2-1.7c0,0-0.1-0.3-0.1-0.4c0,0-0.1-0.7-0.1-1l0,0c1.5,0.8,2.8,1.8,3.8,2.9c0.9,0.9,1.3,1.9,1.6,3  c0,0.1,0,0.2,0,0.3L5,12.5C4.8,11.9,4.5,11.4,4.1,10.9z   " fill="black"></path>
</g>`,
      w: 9.75,
      h: 28.05,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_3) {
    return {
      content: `<g transform=" scale(1.5) translate(0.7000, 4.5000)">
        <path d="     M5.4,12.8c0-0.1,0.1-0.2,0.1-0.3c0.2-0.7,0.3-1.4,0.3-2C5.7,9.7,5.6,9,5.4,8.4c0.3-0.8,0.4-1.7,0.4-2.6 c-0.1-1.6-0.6-3-1.7-4.3c-0.8-1-1.8-2-3-3C0.6-2,0.3-2.5,0.1-3l-0.2-1.5h-0.6v14.7h0.5V9.7l2.5,1.6C3.3,11.8,4,12.4,4.6,13c0,0,0,0,0,0.1C5.3,14,5.5,16,5.5,16c0,0.6,0,1.1-0.2,1.8l0,0.2c0,0.3-0.1,0.4-0.1,0.6c0,0.1,0.1,0.1,0.1,0.1C5.6,17.9,6,17,6,15.7  C6,15,5.8,13.6,5.4,12.8z M-0.1-0.1c1.5,0.8,2.8,1.7,3.8,2.9c0.8,0.9,1.3,2,1.4,3.4v1.6c-0.2-0.6-0.6-1.1-1-1.6  c-0.8-0.9-1.8-1.9-3-3c-0.5-0.5-0.8-1-1-1.5l-0.2-1.5V-0.1z M5.1,12.2l-0.6-0.8l-0.2-0.2l-0.8-0.9L2.1,9c-0.5-0.5-1-1.1-1.4-2  C0.2,6.2,0,5.4-0.1,4.5c1.5,0.8,2.8,1.8,3.8,2.9c0.8,1,1.3,2.1,1.5,3.3l-0.1,1.1L5.1,12.2z   " fill="black"></path>
</g>`,
      w: 10.05,
      h: 34.8,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_4) {
    return {
      content: `<g transform="scale(1.5) translate(0.7000, 9.0000) ">
        <path d="     M5.8,3.9c0.3-0.8,0.4-1.7,0.4-2.6C6.1-0.3,5.6-1.7,4.5-3c-0.8-1-1.8-2-3-3C1-6.5,0.7-7,0.5-7.5L-0.2-9h-0.5v19.4H0V9.9  c0,0,2.6,1,3.3,1.9c0.5,0.5,0.9,1.1,1.1,1.8c0.8,1.8,0.3,3.8-0.2,5.3c-0.1,0.3,0.1,0.2,0.1,0.1c0.8-1.1,1.4-2.6,1.3-4.5l0,0  c-0.2-2.1-1.8-3.9-1.8-3.9S1.5,8,1.1,7.2C0.9,6.9,0,5,0,4.7h0.4c1.5,0.8,2.8,1.8,3.8,2.9c2.3,2.1,1.1,5.7,1.1,5.7l0.1,0.3  c1-1.6,0.7-4.4,0.5-5C6.1,7.8,6.2,6.9,6.2,6C6.2,5.3,6,4.6,5.8,3.9z M5.5,8c-0.2-0.6-0.6-1.1-1-1.6c-0.8-0.9-1.8-1.9-3-3  c-0.5-0.5-0.8-1-1-1.5L0,0.1C1.4,0.9,3.1,1.8,4.1,3c0.8,1,1.3,2,1.4,3.4V8z M5.5,3.3l-1-1.6c-0.8-1-1.8-2-3-3c-0.5-0.5-0.8-1-1-1.5  L0-4.6c1.5,0.8,3.1,1.7,4.2,2.9c0.8,0.9,1.3,2,1.4,3.2V3.3z   " fill="black"></path>
</g>`,
      w: 10.35,
      h: 42.15,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_5) {
    return {
      content: `<g transform="scale(1.5) translate(0.7000, 9.8000) ">
        <path d="     M5.7,14.3c0.1-0.4,0.2-0.7,0.3-1.1c0-0.2,0-0.4,0-0.5c0-0.5-0.1-1-0.2-1.6c-0.1-0.4-0.1-0.9,0-1.3C5.9,9.4,5.9,9,5.9,8.6  c0-0.5-0.1-1.1-0.1-1.7c0-0.3,0-0.6,0-0.9l0.1-0.9c0-0.2,0-0.4,0-0.6c0-0.5-0.1-0.9-0.1-1.5c0-0.3,0-0.6,0-0.9l0.1-1  c0-0.2,0-0.4,0-0.5c0-0.7-0.1-1.5-0.4-2.4C5.2-2.8,4.7-3.7,4-4.6C3.4-5.5,2.4-6.4,1.3-7.4c-0.5-0.5-0.8-1-1-1.4l-0.5-1h-0.5v21.1  h0.4v-0.6l2.7,1.7c0.8,0.5,1.4,1,1.9,1.5c0.2,0.2,0.3,0.3,0.5,0.5c0.1,0.2,0.2,0.3,0.3,0.4c0.2,0.4,0.3,0.8,0.4,1.3  c0,0,0.4,1.2,0,2.2l-0.2,0.4c0,0.1,0.1,0,0.1,0c0.3-0.5,0.4-0.4,0.6-1.2c0.1-0.4,0.1-0.8,0.1-1.2C6.3,15.6,6.1,14.9,5.7,14.3z   M-0.1-6C1-5.4,2-4.8,2.8-4.1c0.8,0.6,1.5,1.5,2,2.7l0.3,1.1c0,0.1,0.1,0.3,0.1,0.4L5.4,1v0.7C5.1,0.9,4.7,0.1,4.1-0.7  C3.4-1.5,2.4-2.5,1.3-3.5c-0.5-0.5-0.8-1-1-1.4l-0.4-1V-6z M2.8-0.2c0.8,0.6,1.5,1.5,2,2.7l0.3,1.1c0,0.2,0.1,0.3,0.1,0.5l0.2,1v0.6  C5.1,4.7,4.7,3.9,4.1,3.2C3.4,2.3,2.4,1.3,1.3,0.4c-0.5-0.5-0.9-1-1-1.5l-0.4-1C1-1.5,2-0.9,2.8-0.2z M-0.1,1.7C1,2.3,2,3,2.8,3.7  c0.8,0.6,1.5,1.5,2,2.7l0.3,1.1c0,0.1,0.1,0.3,0.1,0.4l0.2,0.9v0.7C5.1,8.7,4.7,7.9,4.1,7.1C3.4,6.2,2.4,5.3,1.3,4.3  c-0.5-0.5-0.8-1-1-1.4l-0.4-1.1V1.7z M4.6,12.6l-1-1.1l-1.4-1.4C1.7,9.6,1.2,9,0.8,8.2C0.3,7.4,0.1,6.6,0,5.7c1.1,0.6,2,1.2,2.8,1.8  c0.7,0.6,1.4,1.4,1.9,2.4c0.1,0.2,0.2,0.4,0.2,0.6l0.3,1l0.1,0.4l0.1,0.8v1.1l-0.7-1L4.6,12.6z   " fill="black"></path>
</g>`,
      w: 10.32,
      h: 42.82,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_6) {
    return {
      content: `<g transform="scale(1.5) translate(0.9000, 18.0000) ">
        <path d="     M5.2,12.7c0.1-0.3,0.2-0.6,0.2-0.9c0.1-0.5,0.2-1,0.2-1.5c-0.1-0.7-0.2-1.4-0.4-2c0.3-0.8,0.4-1.7,0.4-2.6  c0-0.8-0.2-1.5-0.4-2.1C5.5,2.8,5.6,1.9,5.6,1c0-0.7-0.1-1.4-0.3-2c0.2-0.8,0.3-1.6,0.3-2.5c0-0.6-0.1-1.2-0.3-1.8  c0.2-0.8,0.3-1.6,0.3-2.4C5.5-9.3,5-10.7,3.9-12c-0.8-1-1.8-2-3-3c-0.5-0.5-0.9-1-1.1-1.5L-0.5-18h-0.4v28h0.5V9.6l0.1,0.1L0.3,10  l1.8,1.1c0.9,0.5,1.7,1.1,2.2,1.7c0.9,1.1,1,3,1,3c0,0.6-0.1,1.3-0.3,2c0,0-0.1,0.2-0.1,0.3C4.8,18.4,5,18.3,5,18.2  c0.4-0.6,0.6-0.9,0.8-1.8C6.1,15.4,5.6,13.5,5.2,12.7z M3.4-10.7c0.9,1,1.4,2.1,1.5,3.1v1.3L3.8-7.9c-0.8-1-1.8-2-3-3  c-0.5-0.5-0.8-1-1-1.5l-0.2-1.2C1.1-12.8,2.4-11.9,3.4-10.7z M3.4-6.5c0.9,1,1.4,2.1,1.5,3.3l-0.1,1v0.4l-1-1.6c-0.8-1-1.8-2-3-3  c-0.5-0.5-0.8-1-1-1.5l-0.2-1.5C1.1-8.6,2.4-7.7,3.4-6.5z M-0.4-5c1.5,0.8,2.8,1.7,3.8,2.9c0.9,1,1.4,2.1,1.5,3.3V3l-1-1.6  c-0.8-1-1.8-2-3-3C0.4-2.1,0-2.6-0.2-3.2l-0.2-1.5V-5z M-0.4-0.2c1.5,0.8,2.8,1.7,3.8,2.9c0.9,0.9,1.4,2,1.5,3.2v1.7  C4.7,7,4.3,6.5,3.9,6c-0.8-0.9-1.8-1.9-3-3C0.4,2.5,0,2-0.2,1.5L-0.4,0V-0.2z M-0.4,4.4c0.3,0.1,0.5,0.3,0.8,0.4  c1.2,0.7,2.2,1.5,3,2.5c0.9,1,1.4,2.1,1.5,3.3V12l-0.6-0.8l-1-1.1L1.9,8.8C1.3,8.3,0.8,7.7,0.4,6.9C-0.1,6.1-0.3,5.3-0.4,4.4z   " fill="black"></path>
</g>`,
      w: 10.19,
      h: 54.45,
      skinKey: key,
    };
  }
  return {
    content: `<g transform="scale(1.5) translate(0.7000, 0.0000) ">
        <path d="     M3.9,15.4c0.5-1.5,1.1-3.8,0.3-5.6C3.5,8.2,2,6.8-0.1,6.1l-0.1,0.8h-0.5V0h0.6l0.3,2c0.3,1,0.6,1.2,1.2,2L2,4.8l2.1,2.6  c2.3,2.9,1.1,6.4-0.1,8.1C4,15.6,3.8,15.7,3.9,15.4z   " fill="black"></path>
</g>`,
    w: 9.16,
    h: 23.4,
    skinKey: key,
  };
}

const NOTE_TAIL_R_TO_BASE: Partial<Record<StandardStaffSkinKeyEnum, {
  mult: number;
  key: StandardStaffSkinKeyEnum
}>> = {
  [StandardStaffSkinKeyEnum.NoteTail_1_r]: {mult: 1, key: StandardStaffSkinKeyEnum.NoteTail_1},
  [StandardStaffSkinKeyEnum.NoteTail_2_r]: {mult: 1.1, key: StandardStaffSkinKeyEnum.NoteTail_2},
  [StandardStaffSkinKeyEnum.NoteTail_3_r]: {mult: 1.2, key: StandardStaffSkinKeyEnum.NoteTail_3},
  [StandardStaffSkinKeyEnum.NoteTail_4_r]: {mult: 1.3, key: StandardStaffSkinKeyEnum.NoteTail_4},
  [StandardStaffSkinKeyEnum.NoteTail_5_r]: {mult: 1.4, key: StandardStaffSkinKeyEnum.NoteTail_5},
  [StandardStaffSkinKeyEnum.NoteTail_6_r]: {mult: 1.5, key: StandardStaffSkinKeyEnum.NoteTail_6},
};

/** 符尾倒：复用正符尾内容，外层 scale(1,-1) translate(0,-node.h) 纵向翻转 */
function makeNoteTailReversed(key: StandardStaffSkinKeyEnum): {
  content: string;
  w: number;
  h: number;
  skinKey: StandardStaffSkinKeyEnum
} {
  if (key === StandardStaffSkinKeyEnum.NoteTail_1_r) {
    return {
      content: `<g transform="translate(1.0500, 23.4000)">
        <g transform="scale(1,-1)  scale(1.5)">
            <path d="     M3.9,15.4c0.5-1.5,1.1-3.8,0.3-5.6C3.5,8.2,2,6.8-0.1,6.1l-0.1,0.8h-0.5V0h0.6l0.3,2c0.3,1,0.6,1.2,1.2,2L2,4.8l2.1,2.6  c2.3,2.9,1.1,6.4-0.1,8.1C4,15.6,3.8,15.7,3.9,15.4z   " fill="black"></path>
        </g>
</g>`,
      w: 9.16, // 符尾的宽高其实不参与计算，这个完全是左上定点对齐的，但是这里还是写一下吧
      h: 23.4,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_2_r) {
    return {
      content: `<g transform="translate(1.0500, 28.0500)">
        <g transform="scale(1,-1)  scale(1.5)">
            <path d="     M5.8,10.3C5.7,8.7,5.2,7.3,4.1,6c-0.7-1-1.7-2-3-3c-0.5-0.5-0.8-1-1-1.5L-0.1,0h-0.6v10h0.5V9.6c1.3,0.4,2.5,1.2,3.3,2  c0.5,0.5,0.8,1.1,1.1,1.6C5,15.1,4.5,17.1,4,18.6c0,0.1,0.1,0.1,0.1,0.1c0.2-0.3,0.4-0.4,0.6-0.9c0.2-0.4,0.4-0.9,0.5-1.4  c0.2-0.7,0.3-1.4,0.2-2.1l0,0c0-0.4-0.1-0.8-0.2-1.3C5.7,12.3,5.8,11.1,5.8,10.3z M4.1,10.9L3,9.6L2,8.3L1.4,7.5  c-0.5-0.7-0.9-1-1.2-1.7c0,0-0.1-0.3-0.1-0.4c0,0-0.1-0.7-0.1-1l0,0c1.5,0.8,2.8,1.8,3.8,2.9c0.9,0.9,1.3,1.9,1.6,3  c0,0.1,0,0.2,0,0.3L5,12.5C4.8,11.9,4.5,11.4,4.1,10.9z   " fill="black"></path>
    </g>
</g>`,
      w: 9.75,
      h: 28.05,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_3_r) {
    return {
      content: `
       <g transform="translate(1.0500, 28.0500)">
        <g transform="scale(1,-1)  scale(1.5)">
                <path d="     M5.4,12.8c0-0.1,0.1-0.2,0.1-0.3c0.2-0.7,0.3-1.4,0.3-2C5.7,9.7,5.6,9,5.4,8.4c0.3-0.8,0.4-1.7,0.4-2.6 c-0.1-1.6-0.6-3-1.7-4.3c-0.8-1-1.8-2-3-3C0.6-2,0.3-2.5,0.1-3l-0.2-1.5h-0.6v14.7h0.5V9.7l2.5,1.6C3.3,11.8,4,12.4,4.6,13c0,0,0,0,0,0.1C5.3,14,5.5,16,5.5,16c0,0.6,0,1.1-0.2,1.8l0,0.2c0,0.3-0.1,0.4-0.1,0.6c0,0.1,0.1,0.1,0.1,0.1C5.6,17.9,6,17,6,15.7  C6,15,5.8,13.6,5.4,12.8z M-0.1-0.1c1.5,0.8,2.8,1.7,3.8,2.9c0.8,0.9,1.3,2,1.4,3.4v1.6c-0.2-0.6-0.6-1.1-1-1.6  c-0.8-0.9-1.8-1.9-3-3c-0.5-0.5-0.8-1-1-1.5l-0.2-1.5V-0.1z M5.1,12.2l-0.6-0.8l-0.2-0.2l-0.8-0.9L2.1,9c-0.5-0.5-1-1.1-1.4-2  C0.2,6.2,0,5.4-0.1,4.5c1.5,0.8,2.8,1.8,3.8,2.9c0.8,1,1.3,2.1,1.5,3.3l-0.1,1.1L5.1,12.2z   " fill="black"></path>
              </g>
</g>
`,
      w: 10.05,
      h: 34.8,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_4_r) {
    return {
      content: `<g transform="translate(1.0500, 28.6500)">
        <g transform="scale(1,-1)  scale(1.5)">
            <path d="     M5.8,3.9c0.3-0.8,0.4-1.7,0.4-2.6C6.1-0.3,5.6-1.7,4.5-3c-0.8-1-1.8-2-3-3C1-6.5,0.7-7,0.5-7.5L-0.2-9h-0.5v19.4H0V9.9  c0,0,2.6,1,3.3,1.9c0.5,0.5,0.9,1.1,1.1,1.8c0.8,1.8,0.3,3.8-0.2,5.3c-0.1,0.3,0.1,0.2,0.1,0.1c0.8-1.1,1.4-2.6,1.3-4.5l0,0  c-0.2-2.1-1.8-3.9-1.8-3.9S1.5,8,1.1,7.2C0.9,6.9,0,5,0,4.7h0.4c1.5,0.8,2.8,1.8,3.8,2.9c2.3,2.1,1.1,5.7,1.1,5.7l0.1,0.3  c1-1.6,0.7-4.4,0.5-5C6.1,7.8,6.2,6.9,6.2,6C6.2,5.3,6,4.6,5.8,3.9z M5.5,8c-0.2-0.6-0.6-1.1-1-1.6c-0.8-0.9-1.8-1.9-3-3  c-0.5-0.5-0.8-1-1-1.5L0,0.1C1.4,0.9,3.1,1.8,4.1,3c0.8,1,1.3,2,1.4,3.4V8z M5.5,3.3l-1-1.6c-0.8-1-1.8-2-3-3c-0.5-0.5-0.8-1-1-1.5  L0-4.6c1.5,0.8,3.1,1.7,4.2,2.9c0.8,0.9,1.3,2,1.4,3.2V3.3z   " fill="black"></path>
    </g>
</g>`,
      w: 10.35,
      h: 42.15,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_5_r) {
    return {
      content: `<g transform="translate(1.0500, 28.1167)">
        <g transform="scale(1,-1)  scale(1.5)">
            <path d="     M5.7,14.3c0.1-0.4,0.2-0.7,0.3-1.1c0-0.2,0-0.4,0-0.5c0-0.5-0.1-1-0.2-1.6c-0.1-0.4-0.1-0.9,0-1.3C5.9,9.4,5.9,9,5.9,8.6  c0-0.5-0.1-1.1-0.1-1.7c0-0.3,0-0.6,0-0.9l0.1-0.9c0-0.2,0-0.4,0-0.6c0-0.5-0.1-0.9-0.1-1.5c0-0.3,0-0.6,0-0.9l0.1-1  c0-0.2,0-0.4,0-0.5c0-0.7-0.1-1.5-0.4-2.4C5.2-2.8,4.7-3.7,4-4.6C3.4-5.5,2.4-6.4,1.3-7.4c-0.5-0.5-0.8-1-1-1.4l-0.5-1h-0.5v21.1  h0.4v-0.6l2.7,1.7c0.8,0.5,1.4,1,1.9,1.5c0.2,0.2,0.3,0.3,0.5,0.5c0.1,0.2,0.2,0.3,0.3,0.4c0.2,0.4,0.3,0.8,0.4,1.3  c0,0,0.4,1.2,0,2.2l-0.2,0.4c0,0.1,0.1,0,0.1,0c0.3-0.5,0.4-0.4,0.6-1.2c0.1-0.4,0.1-0.8,0.1-1.2C6.3,15.6,6.1,14.9,5.7,14.3z   M-0.1-6C1-5.4,2-4.8,2.8-4.1c0.8,0.6,1.5,1.5,2,2.7l0.3,1.1c0,0.1,0.1,0.3,0.1,0.4L5.4,1v0.7C5.1,0.9,4.7,0.1,4.1-0.7  C3.4-1.5,2.4-2.5,1.3-3.5c-0.5-0.5-0.8-1-1-1.4l-0.4-1V-6z M2.8-0.2c0.8,0.6,1.5,1.5,2,2.7l0.3,1.1c0,0.2,0.1,0.3,0.1,0.5l0.2,1v0.6  C5.1,4.7,4.7,3.9,4.1,3.2C3.4,2.3,2.4,1.3,1.3,0.4c-0.5-0.5-0.9-1-1-1.5l-0.4-1C1-1.5,2-0.9,2.8-0.2z M-0.1,1.7C1,2.3,2,3,2.8,3.7  c0.8,0.6,1.5,1.5,2,2.7l0.3,1.1c0,0.1,0.1,0.3,0.1,0.4l0.2,0.9v0.7C5.1,8.7,4.7,7.9,4.1,7.1C3.4,6.2,2.4,5.3,1.3,4.3  c-0.5-0.5-0.8-1-1-1.4l-0.4-1.1V1.7z M4.6,12.6l-1-1.1l-1.4-1.4C1.7,9.6,1.2,9,0.8,8.2C0.3,7.4,0.1,6.6,0,5.7c1.1,0.6,2,1.2,2.8,1.8  c0.7,0.6,1.4,1.4,1.9,2.4c0.1,0.2,0.2,0.4,0.2,0.6l0.3,1l0.1,0.4l0.1,0.8v1.1l-0.7-1L4.6,12.6z   " fill="black"></path>
    </g>
</g>`,
      w: 10.32,
      h: 42.82,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.NoteTail_6_r) {
    return {
      content: `<g transform="translate(1.3500, 27.4500)">
        <g transform="scale(1,-1)  scale(1.5)">
            <path d="     M5.2,12.7c0.1-0.3,0.2-0.6,0.2-0.9c0.1-0.5,0.2-1,0.2-1.5c-0.1-0.7-0.2-1.4-0.4-2c0.3-0.8,0.4-1.7,0.4-2.6  c0-0.8-0.2-1.5-0.4-2.1C5.5,2.8,5.6,1.9,5.6,1c0-0.7-0.1-1.4-0.3-2c0.2-0.8,0.3-1.6,0.3-2.5c0-0.6-0.1-1.2-0.3-1.8  c0.2-0.8,0.3-1.6,0.3-2.4C5.5-9.3,5-10.7,3.9-12c-0.8-1-1.8-2-3-3c-0.5-0.5-0.9-1-1.1-1.5L-0.5-18h-0.4v28h0.5V9.6l0.1,0.1L0.3,10  l1.8,1.1c0.9,0.5,1.7,1.1,2.2,1.7c0.9,1.1,1,3,1,3c0,0.6-0.1,1.3-0.3,2c0,0-0.1,0.2-0.1,0.3C4.8,18.4,5,18.3,5,18.2  c0.4-0.6,0.6-0.9,0.8-1.8C6.1,15.4,5.6,13.5,5.2,12.7z M3.4-10.7c0.9,1,1.4,2.1,1.5,3.1v1.3L3.8-7.9c-0.8-1-1.8-2-3-3  c-0.5-0.5-0.8-1-1-1.5l-0.2-1.2C1.1-12.8,2.4-11.9,3.4-10.7z M3.4-6.5c0.9,1,1.4,2.1,1.5,3.3l-0.1,1v0.4l-1-1.6c-0.8-1-1.8-2-3-3  c-0.5-0.5-0.8-1-1-1.5l-0.2-1.5C1.1-8.6,2.4-7.7,3.4-6.5z M-0.4-5c1.5,0.8,2.8,1.7,3.8,2.9c0.9,1,1.4,2.1,1.5,3.3V3l-1-1.6  c-0.8-1-1.8-2-3-3C0.4-2.1,0-2.6-0.2-3.2l-0.2-1.5V-5z M-0.4-0.2c1.5,0.8,2.8,1.7,3.8,2.9c0.9,0.9,1.4,2,1.5,3.2v1.7  C4.7,7,4.3,6.5,3.9,6c-0.8-0.9-1.8-1.9-3-3C0.4,2.5,0,2-0.2,1.5L-0.4,0V-0.2z M-0.4,4.4c0.3,0.1,0.5,0.3,0.8,0.4  c1.2,0.7,2.2,1.5,3,2.5c0.9,1,1.4,2.1,1.5,3.3V12l-0.6-0.8l-1-1.1L1.9,8.8C1.3,8.3,0.8,7.7,0.4,6.9C-0.1,6.1-0.3,5.3-0.4,4.4z   " fill="black"></path>
    </g>
</g>`,
      w: 10.19,
      h: 54.45,
      skinKey: key,
    };
  }
  return {
    content: `<g transform="translate(1.0500, 23.4000)">
        <g transform="scale(1,-1)  scale(1.5)">
            <path d="     M3.9,15.4c0.5-1.5,1.1-3.8,0.3-5.6C3.5,8.2,2,6.8-0.1,6.1l-0.1,0.8h-0.5V0h0.6l0.3,2c0.3,1,0.6,1.2,1.2,2L2,4.8l2.1,2.6  c2.3,2.9,1.1,6.4-0.1,8.1C4,15.6,3.8,15.7,3.9,15.4z   " fill="black"></path>
    </g>
</g>`,
    w: 9.16,
    h: 23.4,
    skinKey: key,
  };
}

// 休止符
function makeRest(key: StandardStaffSkinKeyEnum) {
  if (key === StandardStaffSkinKeyEnum.Rest_1) {
    return {
      content: `<rect x="0" y="0" width="10" height="6" fill="black"/>`,
      w: 10, // 符尾的宽高其实不参与计算，这个完全是左上定点对齐的，但是这里还是写一下吧
      h: 6,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.Rest_2) {
    return {
      content: `<rect x="0" y="0" width="10" height="6" fill="black"/>`,
      w: 10,
      h: 6,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.Rest_3) {
    return {
      content: `<g transform="translate(0.0000, 8.9000)">
        <path stroke="black" d="M6.2-4.3C4.7-2.6,3.9-1.2,3.8,0.2c0,0.8,0.3,1.6,0.8,2.4l1.6,2.1L5.8,5.1C5.2,4.8,4.6,4.6,4.1,4.6c-0.5,0-0.9,0.2-1.3,0.7C2.4,6.1,2.3,6.8,2.6,7.4c0.3,0.6,0.6,1.1,1,1.4L3.3,9.3L1.2,7.4C0.5,6.7,0.1,5.9,0,4.9c0.1-1.4,0.9-2.1,2.3-2.1c0.5,0,1.2,0.2,1.9,0.6V3.4L0.4-1.5c0.7-0.6,1.3-1.3,1.8-2.1s0.7-1.7,0.6-2.6C2.5-7.3,2-8.1,1.4-8.9h1L6.2-4.3"></path>
</g>`,
      w: 6.2,
      h: 18.2,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.Rest_4) {
    return {
      content: `<g transform="translate(-0.1000, 6.3361)">
        <path stroke="black" d="M3.3-4.1L3.2-3.8c0.1,0.3,0.3,0.3,0.6,0.2c1-0.4,1.7-1.1,2.1-2h0.4L3.5,4.7H2.6L5-3.4C4.1-2.9,3.3-2.6,2.3-2.5c-0.6,0-1.1-0.2-1.6-0.6C0.4-3.5,0.1-3.9,0.1-4.5c0-1,0.5-1.6,1.5-1.8c0.5-0.1,0.9,0,1.3,0.4c0.4,0.3,0.5,0.7,0.6,1.3L3.3-4.1"></path>
</g>`,
      w: 6.2,
      h: 11.04,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.Rest_5) {
    return {
      content: `<g transform="translate(0.0000, 4.3260)">
        <path stroke="black" d="M2.3-1C1.9-1.4,1.6-1.9,1.6-2.5c0-1,0.5-1.6,1.5-1.8C3.6-4.4,4-4.2,4.3-3.9c0.4,0.3,0.6,0.7,0.6,1.3L4.8-2L4.7-1.7c0.1,0.2,0.3,0.3,0.6,0.1C6.3-2,7-2.7,7.5-3.6H8L3.4,12.7H2.6l2.3-8.2C4.1,5.1,3.2,5.4,2.3,5.4c-0.6,0-1.1-0.2-1.6-0.6C0.3,4.5,0,4,0,3.5c0.1-1.1,0.7-1.7,1.8-1.9c0.5,0,0.9,0.2,1.2,0.6c0.3,0.4,0.4,0.8,0.4,1.3L3.2,4.2c0.1,0.1,0.2,0.2,0.3,0.2c0.3,0,0.6-0.1,0.9-0.4l0.8-0.6l1.3-4.7C5.6-0.9,4.8-0.6,3.8-0.5C3.3-0.5,2.8-0.7,2.3-1"></path>
</g>`,
      w: 8,
      h: 17.03,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.Rest_6) {
    return {
      content: `<g transform="translate(0.0000, 12.2260)">
        <path stroke="black" d="M6.5-10L6.4-9.7c0.1,0.3,0.3,0.3,0.6,0.2c0.9-0.4,1.7-1.1,2.2-2h0.4L3.5,10.8H2.6l2.3-8.2C4.1,3.1,3.2,3.4,2.3,3.5c-0.6,0-1.1-0.2-1.6-0.6C0.3,2.6,0,2.1,0,1.5c0.1-1.1,0.7-1.7,1.8-1.9c1,0.1,1.5,0.7,1.6,1.7L3.2,2.3c0.1,0.1,0.2,0.2,0.3,0.1c0.3,0,0.6-0.1,1-0.4l0.8-0.7l1.2-4.7C5.7-2.8,4.8-2.5,3.9-2.5C3.3-2.5,2.8-2.7,2.3-3C1.9-3.4,1.6-3.8,1.6-4.4c0-1.1,0.6-1.7,1.8-1.9c0.5,0,0.9,0.2,1.2,0.6C4.8-5.3,5-4.9,4.9-4.4L4.8-3.7c0.1,0.1,0.2,0.2,0.3,0.2c0.3,0,0.6-0.1,1-0.4l0.8-0.8l1.3-4.7C7.3-8.8,6.5-8.5,5.6-8.5C5-8.5,4.4-8.7,4-9c-0.4-0.4-0.7-0.8-0.7-1.4c0-1,0.5-1.6,1.5-1.8c0.5-0.1,0.9,0.1,1.3,0.4c0.4,0.3,0.6,0.7,0.6,1.3C6.7-10.4,6.6-10.2,6.5-10"></path>
</g>`,
      w: 9.6,
      h: 23.03,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.Rest_7) {
    return {
      content: `<g transform="translate(0.0000, 12.2260)">
        <path stroke="black" d="M7.3-8.5C6.7-8.5,6.2-8.7,5.7-9C5.3-9.4,5-9.9,5-10.4c0-1,0.5-1.6,1.5-1.8c0.5-0.1,1,0.1,1.3,0.4c0.4,0.3,0.6,0.7,0.6,1.3L8.3-10L8.2-9.7c0.1,0.3,0.3,0.3,0.6,0.2c1-0.4,1.7-1.1,2.2-2h0.4L3.5,16.8H2.6l2.3-8.2C4.1,9.1,3.2,9.4,2.3,9.5c-0.6,0-1.1-0.2-1.6-0.6S0,8.1,0,7.6c0.1-1.1,0.7-1.7,1.8-1.9c1,0.1,1.5,0.7,1.6,1.7L3.2,8.3c0.1,0.1,0.2,0.2,0.3,0.1c0.3,0,0.6-0.1,0.9-0.4l0.8-0.7l1.3-4.7C5.7,3.2,4.8,3.5,3.9,3.5C3.3,3.5,2.8,3.3,2.3,3C1.9,2.6,1.6,2.2,1.6,1.6c0-1.1,0.6-1.7,1.8-1.9c0.5,0,0.9,0.2,1.2,0.6S5,1.1,5,1.6L4.8,2.3C4.9,2.5,5,2.5,5.1,2.5c0.3,0,0.6-0.1,1-0.4l0.8-0.8l1.3-4.7C7.4-2.8,6.5-2.5,5.6-2.5C5-2.5,4.4-2.7,4-3C3.5-3.4,3.3-3.9,3.3-4.4c0-1,0.5-1.6,1.5-1.8c0.5-0.1,0.9,0.1,1.3,0.4C6.5-5.5,6.7-5,6.7-4.5L6.6-4L6.5-3.7c0.1,0.3,0.3,0.3,0.6,0.2c0.5-0.2,1-0.5,1.5-1.1l1.3-4.7C9.1-8.8,8.2-8.5,7.3-8.5"></path>
</g>`,
      w: 11.4,
      h: 29.03,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.Rest_8) {
    return {
      content: `<g transform="translate(0.0000, 18.2260)">
        <path stroke="black" d="M12.9-17.6L3.5,16.8H2.6l2.2-8.2C4.1,9.1,3.2,9.4,2.3,9.5c-0.6,0-1.1-0.2-1.6-0.6S0,8.1,0,7.5c0.1-1.1,0.7-1.7,1.8-1.9c1,0.1,1.5,0.7,1.6,1.7L3.2,8.3c0.1,0.1,0.2,0.2,0.3,0.2c0.3,0,0.6-0.1,0.9-0.4l0.8-0.7l1.2-4.7C5.6,3.1,4.8,3.4,3.9,3.5c-0.6,0-1.1-0.2-1.6-0.6C1.9,2.6,1.6,2.1,1.6,1.6c0-1.1,0.6-1.7,1.8-1.8c0.5,0,0.9,0.2,1.2,0.6C4.8,0.7,5,1.1,4.9,1.5L4.8,2.3c0.1,0.1,0.2,0.2,0.3,0.1c0.3,0,0.6-0.1,0.9-0.4l0.8-0.8l1.4-4.6C7.3-2.8,6.5-2.5,5.6-2.5C5-2.5,4.4-2.7,4-3C3.5-3.4,3.3-3.9,3.3-4.4c0-1,0.5-1.6,1.5-1.8c0.5-0.1,0.9,0.1,1.3,0.4c0.4,0.3,0.6,0.8,0.6,1.3L6.5-4L6.4-3.7c0.1,0.3,0.3,0.3,0.6,0.2c0.5-0.2,1-0.5,1.5-1.1l1.3-4.7C9-8.8,8.2-8.5,7.2-8.5C6.6-8.5,6.1-8.7,5.7-9C5.2-9.4,5-9.9,5-10.4c0-1,0.5-1.6,1.5-1.8c0.5-0.1,1,0.1,1.3,0.4c0.4,0.3,0.5,0.8,0.6,1.3L8.2-10L8.1-9.7c0.1,0.3,0.3,0.3,0.6,0.2c0.6-0.2,1.1-0.6,1.5-1.1l1.2-4.7c-0.8,0.5-1.7,0.8-2.6,0.9c-0.6,0-1.1-0.2-1.6-0.6c-0.5-0.4-0.7-0.8-0.7-1.4c0-1,0.5-1.6,1.5-1.8c0.5-0.1,1,0.1,1.3,0.4c0.4,0.3,0.5,0.7,0.6,1.3L9.8-16l-0.1,0.3c0.1,0.3,0.3,0.3,0.6,0.2c0.9-0.4,1.6-1.1,2.1-2H12.9"></path>
</g>`,
      w: 12.9,
      h: 35.03,
      skinKey: key,
    };
  } else if (key === StandardStaffSkinKeyEnum.Rest_9) {
    return {
      content: `<g transform="translate(0.0000, 18.3260)">
        <path stroke="black" d="M14.4-17.7L5,16.7l0,0l-1.6,5.7H2.5l1.6-5.7l0,0l0.7-2.5C4,14.7,3.2,15,2.3,15.1c-0.6,0-1.1-0.2-1.6-0.6C0.3,14.2,0,13.7,0,13.1c0-1,0.5-1.6,1.5-1.8c0.5-0.1,0.9,0,1.3,0.4C3.1,12,3.3,12.4,3.3,13l-0.1,0.6l-0.1,0.3c0.1,0.3,0.3,0.3,0.6,0.2l1.4-1l1.2-4.5C5.5,9.1,4.7,9.4,3.7,9.5c-0.6,0-1.1-0.2-1.6-0.6C1.8,8.5,1.6,8,1.5,7.4c0.1-1.1,0.7-1.7,1.8-1.9c1,0.1,1.5,0.7,1.6,1.7L4.7,8.1C4.8,8.2,4.9,8.3,5,8.2c0.3,0,0.6-0.1,0.9-0.4l0.8-0.7l1.2-4.7C7.2,3,6.3,3.3,5.4,3.4c-0.6,0-1.1-0.2-1.6-0.6C3.4,2.5,3.2,2,3.2,1.5c0-1.1,0.6-1.7,1.8-1.8c0.5,0,0.9,0.2,1.2,0.6C6.4,0.6,6.5,1,6.5,1.4L6.3,2.2c0.1,0.1,0.2,0.2,0.3,0.2c0.3,0,0.6-0.1,0.9-0.4l0.8-0.8l1.4-4.6C8.9-2.9,8-2.6,7.1-2.6C6.5-2.6,6-2.8,5.5-3.1C5.1-3.5,4.8-4,4.8-4.5c0-1,0.5-1.6,1.5-1.8c0.5-0.1,0.9,0,1.3,0.3C8-5.6,8.2-5.2,8.2-4.7L8.1-4.1L8-3.8c0.1,0.3,0.3,0.3,0.6,0.2c0.5-0.2,1-0.5,1.5-1.1l1.3-4.7c-0.8,0.5-1.7,0.8-2.6,0.9c-0.6,0-1.1-0.2-1.6-0.6C6.8-9.5,6.5-10,6.5-10.5c0-1,0.5-1.6,1.5-1.8c0.5-0.1,1,0.1,1.3,0.4c0.4,0.3,0.5,0.8,0.6,1.3l-0.1,0.5L9.7-9.8c0.1,0.3,0.3,0.3,0.6,0.2c0.6-0.2,1.1-0.6,1.5-1.1l1.2-4.7c-0.8,0.5-1.7,0.8-2.6,0.9c-0.6,0-1.1-0.2-1.6-0.6c-0.5-0.4-0.7-0.8-0.7-1.4c0-1,0.5-1.6,1.5-1.8c0.5-0.1,1,0.1,1.3,0.4c0.4,0.3,0.5,0.7,0.6,1.3L11.4-16l-0.1,0.3c0.1,0.3,0.3,0.3,0.6,0.2c0.9-0.4,1.6-1.1,2.1-2h0.4"></path>
</g>`,
      w: 14.4,
      h: 40.73,
      skinKey: key,
    };
  }
  return {
    content: `<rect x="0" y="0" width="10" height="6" fill="black"/>`,
    w: 10, // 符尾的宽高其实不参与计算，这个完全是左上定点对齐的，但是这里还是写一下吧
    h: 6,
    skinKey: key,
  };

}

/** 五线谱默认皮肤（单套曲谱模式下的 skinKey -> 内容与尺寸） */
const standardStaffSkin: StandardStaffSkinPack = {
  [StandardStaffSkinKeyEnum.Measure]: measure,

  // 谱号
  [StandardStaffSkinKeyEnum.Treble]: treble,
  [StandardStaffSkinKeyEnum.Bass]: bass,
  [StandardStaffSkinKeyEnum.Alto]: alto,
  [StandardStaffSkinKeyEnum.Tenor]: tenor,
  [StandardStaffSkinKeyEnum.Treble_f]: trebleF,
  [StandardStaffSkinKeyEnum.Bass_f]: bassF,
  [StandardStaffSkinKeyEnum.Alto_f]: altoF,
  [StandardStaffSkinKeyEnum.Tenor_f]: tenorF,

  // 变音符
  [StandardStaffSkinKeyEnum.Sharp]: sharp,
  [StandardStaffSkinKeyEnum.Flat]: flat,
  [StandardStaffSkinKeyEnum.Double_sharp]: doubleSharp,
  [StandardStaffSkinKeyEnum.Double_flat]: doubleFlat,
  [StandardStaffSkinKeyEnum.Natural]: natural,

  // 调号
  [StandardStaffSkinKeyEnum.C]: {
    content: '',
    w: 0,
    h: 45,
    skinKey: StandardStaffSkinKeyEnum.C,
  },
  [StandardStaffSkinKeyEnum.C_sharp]: {
    content: `
    <g transform="
    translate(-37.88,-6.6762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-23.88,9.8238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-9.88,-12.1762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(4.12,4.3238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(18.12,20.8238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(32.12,-1.1762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(46.12,15.3238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
`,
    w: 96.24 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.C_sharp,
  },
  [StandardStaffSkinKeyEnum.D_flat]: {
    content: `
     <g transform="translate(-39.6836, -1.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g><g transform="translate(-27.6836, -17.5919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(-15.6836, 4.4081)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(-3.6836, -12.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(8.3164,9.9081)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
`,
    w: 49.0496 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.D_flat,
  },
  [StandardStaffSkinKeyEnum.D]: {
    content: `
    <g transform="
    translate(-37.88,-6.6762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-23.88,9.8238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    
`,
    w: 26.24 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.D,
  },
  [StandardStaffSkinKeyEnum.E_flat]: {
    content: `
     <g transform="translate(-39.6836, -1.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g><g transform="translate(-27.6836, -17.5919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(-15.6836, 4.4081)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  
`,
    w: 32.63 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.E_flat,
  },
  [StandardStaffSkinKeyEnum.E]: {
    content: `
    <g transform="
    translate(-37.88,-6.6762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-23.88,9.8238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-9.88,-12.1762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(4.12,4.3238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    
`,
    w: 54.24 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.E,
  },
  [StandardStaffSkinKeyEnum.F]: {
    content: `
     <g transform="translate(-39.6836, -1.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
`,
    w: 8.63 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.F,
  },
  [StandardStaffSkinKeyEnum.F_sharp]: {
    content: `
    <g transform="
    translate(-37.88,-6.6762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-23.88,9.8238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-9.88,-12.1762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(4.12,4.3238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(18.12,20.8238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(32.12,-1.1762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
   
`,
    w: 82.24 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.F_sharp,
  },
  [StandardStaffSkinKeyEnum.G_flat]: {
    content: `
     <g transform="translate(-39.6836, -1.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g><g transform="translate(-27.6836, -17.5919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(-15.6836, 4.4081)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(-3.6836, -12.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(8.3164,9.9081)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(20.3164,-6.5919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
`,
    w: 68.63 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.G_flat,
  },
  [StandardStaffSkinKeyEnum.G]: {
    content: `
    <g transform="
    translate(-37.88,-6.6762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    
`,
    w: 12.24 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.G,
  },
  [StandardStaffSkinKeyEnum.A_flat]: {
    content: `
     <g transform="translate(-39.6836, -1.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g><g transform="translate(-27.6836, -17.5919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(-15.6836, 4.4081)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(-3.6836, -12.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  
`,
    w: 44.63 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.A_flat,
  },
  [StandardStaffSkinKeyEnum.A]: {
    content: `
    <g transform="
    translate(-37.88,-6.6762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-23.88,9.8238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-9.88,-12.1762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    
`,
    w: 40.24 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.A,
  },
  [StandardStaffSkinKeyEnum.B_flat]: {
    content: `
     <g transform="translate(-39.6836, -1.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g><g transform="translate(-27.6836, -17.5919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  
`,
    w: 20.63 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.B_flat,
  },
  [StandardStaffSkinKeyEnum.B]: {
    content: `
    <g transform="
    translate(-37.88,-6.6762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-23.88,9.8238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(-9.88,-12.1762),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(4.12,4.3238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    <g transform="
    translate(18.12,20.8238),
               scale(1)">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
    
`,
    w: 68.24 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.B,
  },
  [StandardStaffSkinKeyEnum.C_flat]: {
    content: `
     <g transform="translate(-39.6836, -1.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g><g transform="translate(-27.6836, -17.5919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(-15.6836, 4.4081)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(-3.6836, -12.0919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(8.3164,9.9081)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(20.3164,-6.5919)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
  <g transform="translate(32.3164,15.4081)">
    <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
    />
  </g>
`,
    w: 80.63 + 5,
    h: 87,

    skinKey: StandardStaffSkinKeyEnum.C_flat,
  },

  // 小节线
  [StandardStaffSkinKeyEnum.Single_barline]: singleBarline,
  [StandardStaffSkinKeyEnum.Double_barline]: doubleBarline,
  [StandardStaffSkinKeyEnum.StartRepeat_barline]: startRepeatBarline,
  [StandardStaffSkinKeyEnum.EndRepeat_barline]: endRepeatBarline,
  [StandardStaffSkinKeyEnum.Dashed_barline]: dashedBarline,
  [StandardStaffSkinKeyEnum.Final_barline]: finalBarline,
  [StandardStaffSkinKeyEnum.Start_end_repeat_barline]: startEndRepeatBarline,
  [StandardStaffSkinKeyEnum.Dotted_barline]: dottedBarline,
  [StandardStaffSkinKeyEnum.Reverse_barline]: reverseBarline,
  [StandardStaffSkinKeyEnum.Heavy_barline]: heavyBarline,
  [StandardStaffSkinKeyEnum.Heavy_double_barline]: heavyDoubleBarline,

  // 拍号
  [StandardStaffSkinKeyEnum["1_1"]]: makeTimeSignature("1/1", StandardStaffSkinKeyEnum["1_1"]),
  [StandardStaffSkinKeyEnum["1_4"]]: makeTimeSignature("1/4", StandardStaffSkinKeyEnum["1_4"]),
  [StandardStaffSkinKeyEnum["2_4"]]: makeTimeSignature("2/4", StandardStaffSkinKeyEnum["2_4"]),
  [StandardStaffSkinKeyEnum["3_4"]]: makeTimeSignature("3/4", StandardStaffSkinKeyEnum["3_4"]),
  [StandardStaffSkinKeyEnum["4_4"]]: makeTimeSignature("4/4", StandardStaffSkinKeyEnum["4_4"]),
  [StandardStaffSkinKeyEnum["3_8"]]: makeTimeSignature("3/8", StandardStaffSkinKeyEnum["3_8"]),
  [StandardStaffSkinKeyEnum["6_8"]]: makeTimeSignature("6/8", StandardStaffSkinKeyEnum["6_8"]),

  // 音符头
  [StandardStaffSkinKeyEnum.NoteHead_1]: makeNoteHead(StandardStaffSkinKeyEnum.NoteHead_1),
  [StandardStaffSkinKeyEnum.NoteHead_2]: makeNoteHead(StandardStaffSkinKeyEnum.NoteHead_2),
  [StandardStaffSkinKeyEnum.NoteHead_3]: makeNoteHead(StandardStaffSkinKeyEnum.NoteHead_3),

  // 符干
  [StandardStaffSkinKeyEnum.NoteStem]: noteStem,

  // 符尾
  [StandardStaffSkinKeyEnum.NoteTail_1]: makeNoteTail(1, StandardStaffSkinKeyEnum.NoteTail_1),
  [StandardStaffSkinKeyEnum.NoteTail_2]: makeNoteTail(1.1, StandardStaffSkinKeyEnum.NoteTail_2),
  [StandardStaffSkinKeyEnum.NoteTail_3]: makeNoteTail(1.2, StandardStaffSkinKeyEnum.NoteTail_3),
  [StandardStaffSkinKeyEnum.NoteTail_4]: makeNoteTail(1.3, StandardStaffSkinKeyEnum.NoteTail_4),
  [StandardStaffSkinKeyEnum.NoteTail_5]: makeNoteTail(1.4, StandardStaffSkinKeyEnum.NoteTail_5),
  [StandardStaffSkinKeyEnum.NoteTail_6]: makeNoteTail(1.5, StandardStaffSkinKeyEnum.NoteTail_6),
  [StandardStaffSkinKeyEnum.NoteTail_1_r]: makeNoteTailReversed(StandardStaffSkinKeyEnum.NoteTail_1_r),
  [StandardStaffSkinKeyEnum.NoteTail_2_r]: makeNoteTailReversed(StandardStaffSkinKeyEnum.NoteTail_2_r),
  [StandardStaffSkinKeyEnum.NoteTail_3_r]: makeNoteTailReversed(StandardStaffSkinKeyEnum.NoteTail_3_r),
  [StandardStaffSkinKeyEnum.NoteTail_4_r]: makeNoteTailReversed(StandardStaffSkinKeyEnum.NoteTail_4_r),
  [StandardStaffSkinKeyEnum.NoteTail_5_r]: makeNoteTailReversed(StandardStaffSkinKeyEnum.NoteTail_5_r),
  [StandardStaffSkinKeyEnum.NoteTail_6_r]: makeNoteTailReversed(StandardStaffSkinKeyEnum.NoteTail_6_r),


  // 休止符
  [StandardStaffSkinKeyEnum.Rest_1]: makeRest(StandardStaffSkinKeyEnum.Rest_1),
  [StandardStaffSkinKeyEnum.Rest_2]: makeRest(StandardStaffSkinKeyEnum.Rest_2),
  [StandardStaffSkinKeyEnum.Rest_3]: makeRest(StandardStaffSkinKeyEnum.Rest_3),
  [StandardStaffSkinKeyEnum.Rest_4]: makeRest(StandardStaffSkinKeyEnum.Rest_4),
  [StandardStaffSkinKeyEnum.Rest_5]: makeRest(StandardStaffSkinKeyEnum.Rest_5),
  [StandardStaffSkinKeyEnum.Rest_6]: makeRest(StandardStaffSkinKeyEnum.Rest_6),
  [StandardStaffSkinKeyEnum.Rest_7]: makeRest(StandardStaffSkinKeyEnum.Rest_7),
  [StandardStaffSkinKeyEnum.Rest_8]: makeRest(StandardStaffSkinKeyEnum.Rest_8),
  [StandardStaffSkinKeyEnum.Rest_9]: makeRest(StandardStaffSkinKeyEnum.Rest_9),

  // 附点：直径 3 的实心圆点，紧贴左边；1/2/3 分别为 1/2/3 个点，点间距 2
  [StandardStaffSkinKeyEnum.AugmentationDot_1]: {
    content: `<circle cx="1.5" cy="1.5" r="1.5" fill="black"/>`,
    w: 3,
    h: 3,
    skinKey: StandardStaffSkinKeyEnum.AugmentationDot_1,
  },
  [StandardStaffSkinKeyEnum.AugmentationDot_2]: {
    content: `<circle cx="1.5" cy="1.5" r="1.5" fill="black"/><circle cx="6.5" cy="1.5" r="1.5" fill="black"/>`,
    w: 8,
    h: 3,
    skinKey: StandardStaffSkinKeyEnum.AugmentationDot_2,
  },
  [StandardStaffSkinKeyEnum.AugmentationDot_3]: {
    content: `<circle cx="1.5" cy="1.5" r="1.5" fill="black"/><circle cx="6.5" cy="1.5" r="1.5" fill="black"/><circle cx="11.5" cy="1.5" r="1.5" fill="black"/>`,
    w: 13,
    h: 3,
    skinKey: StandardStaffSkinKeyEnum.AugmentationDot_3,
  },
  [StandardStaffSkinKeyEnum.AddLine_u]: {
    content: `<line x1="0" y1="0.5" x2="16" y2="0.5" stroke="black" stroke-width="1" />`,
    w: 16,
    h: 11,
    skinKey: StandardStaffSkinKeyEnum.AddLine_u,
  },
  [StandardStaffSkinKeyEnum.AddLine_d]: {
    content: `<line x1="0" y1="10.5" x2="16" y2="10.5" stroke="black" stroke-width="1" />`,
    w: 16,
    h: 11,
    skinKey: StandardStaffSkinKeyEnum.AddLine_d,
  },
} as StandardStaffSkinPack;

// 简谱拍号：复用五线谱的上下数字样式
function makeNumberNotationTimeSignature(top: string, bottom: string, key: NumberNotationSkinKeyEnum) {
  return {
    content: `<g><text x="15" y="24" text-anchor="middle" font-size="22" font-weight="600">${top}</text><text x="15" y="46" text-anchor="middle" font-size="22" font-weight="600">${bottom}</text></g>`,
    w: 30,
    h: 56,
    skinKey: key,
  };
}


const numberNotationSkin: NumberNotationSkinPack = {
  [NumberNotationSkinKeyEnum.Measure]: {
    content: `<rect x="0" y="0" width="node.w" height="45" stroke="transparent" fill="transparent"></rect>`,
    w: 1,
    h: STAFF_HEIGHT,
    skinKey: NumberNotationSkinKeyEnum.Measure,
  },
  [NumberNotationSkinKeyEnum.Number_0]: {
    content: `<g transform="translate(-3.3301, -1.7500)">
        <text x="10" y="28" text-anchor="middle" font-size="24" font-weight="600" fill="black">0</text>
</g>`,
    w: 14.16,
    h: 35,
    skinKey: NumberNotationSkinKeyEnum.Number_0
  },
  [NumberNotationSkinKeyEnum.Number_1]: {
    content: `<g transform="translate(-5.1660, -1.7500)">
        <text x="10" y="28" text-anchor="middle" font-size="24" font-weight="600" fill="black">1</text>
</g>`,
    w: 14.16,
    h: 35,
    skinKey: NumberNotationSkinKeyEnum.Number_1
  },
  [NumberNotationSkinKeyEnum.Number_2]: {
    content: `<g transform="translate(-3.3301, -1.7500)">
        <text x="10" y="28" text-anchor="middle" font-size="24" font-weight="600" fill="black">2</text>
</g>`,
    w: 14.16,
    h: 35,
    skinKey: NumberNotationSkinKeyEnum.Number_2
  },
  [NumberNotationSkinKeyEnum.Number_3]: {
    content: `<g transform="translate(-3.3301, -1.7500)">
        <text x="10" y="28" text-anchor="middle" font-size="24" font-weight="600" fill="black">3</text>
</g>`,
    w: 14.16,
    h: 35,
    skinKey: NumberNotationSkinKeyEnum.Number_3
  },
  [NumberNotationSkinKeyEnum.Number_4]: {
    content: `<g transform="translate(-3.0859, -1.7500)">
        <text x="10" y="28" text-anchor="middle" font-size="24" font-weight="600" fill="black">4</text>
</g>`,
    w: 14.16,
    h: 35,
    skinKey: NumberNotationSkinKeyEnum.Number_4
  },
  [NumberNotationSkinKeyEnum.Number_5]: {
    content: `<g transform="translate(-3.3301, -1.7500)">
        <text x="10" y="28" text-anchor="middle" font-size="24" font-weight="600" fill="black">5</text>
</g>`,
    w: 14.16,
    h: 35,
    skinKey: NumberNotationSkinKeyEnum.Number_5
  },
  [NumberNotationSkinKeyEnum.Number_6]: {
    content: `<g transform="translate(-3.3008, -1.7500)">
        <text x="10" y="28" text-anchor="middle" font-size="24" font-weight="600" fill="black">6</text>
</g>`,
    w: 14.16,
    h: 35,
    skinKey: NumberNotationSkinKeyEnum.Number_6
  },
  [NumberNotationSkinKeyEnum.Number_7]: {
    content: `<g transform="translate(-3.5645, -1.7500)">
        <text x="10" y="28" text-anchor="middle" font-size="24" font-weight="600" fill="black">7</text>
</g>`,
    w: 14.16,
    h: 35,
    skinKey: NumberNotationSkinKeyEnum.Number_7
  },
  [NumberNotationSkinKeyEnum.Number_X]: {
    content: `<g transform="translate(-1.6602, -1.7500)">
        <text x="10" y="28" text-anchor="middle" font-size="24" font-weight="600" fill="black">X</text>
</g>`,
    w: 14.16,
    h: 35,
    skinKey: NumberNotationSkinKeyEnum.Number_X
  },
  [NumberNotationSkinKeyEnum.ReduceLine_1]: {
    content: `<line x1="0" y1="0.5" x2="node.w" y2="0.5" stroke="black" stroke-width="1"/>`,
    w: 0, // 这个w没用
    h: 1,
    skinKey: NumberNotationSkinKeyEnum.ReduceLine_1
  },
  [NumberNotationSkinKeyEnum.ReduceLine_2]: {
    content: `<line x1="0" y1="0.5" x2="node.w" y2="0.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="4.5" x2="node.w" y2="4.5" stroke="black" stroke-width="1"/>`,
    w: 0, // 这个w没用
    h: 5,
    skinKey: NumberNotationSkinKeyEnum.ReduceLine_2
  },
  [NumberNotationSkinKeyEnum.ReduceLine_3]: {
    content: `<line x1="0" y1="0.5" x2="node.w" y2="0.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="4.5" x2="node.w" y2="4.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="7.5" x2="node.w" y2="7.5" stroke="black" stroke-width="1"/>`,
    w: 0, // 这个w没用
    h: 8,
    skinKey: NumberNotationSkinKeyEnum.ReduceLine_3
  },
  [NumberNotationSkinKeyEnum.ReduceLine_4]: {
    content: `<line x1="0" y1="0.5" x2="node.w" y2="0.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="4.5" x2="node.w" y2="4.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="7.5" x2="node.w" y2="7.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="9.5" x2="node.w" y2="9.5" stroke="black" stroke-width="1"/>`,
    w: 0, // 这个w没用
    h: 10,
    skinKey: NumberNotationSkinKeyEnum.ReduceLine_4
  },
  [NumberNotationSkinKeyEnum.ReduceLine_5]: {
    content: `<line x1="0" y1="0.5" x2="node.w" y2="0.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="4.5" x2="node.w" y2="4.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="7.5" x2="node.w" y2="7.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="9.5" x2="node.w" y2="9.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="11.5" x2="node.w" y2="11.5" stroke="black" stroke-width="1"/>`,
    w: 0, // 这个w没用
    h: 12,
    skinKey: NumberNotationSkinKeyEnum.ReduceLine_5
  },
  [NumberNotationSkinKeyEnum.ReduceLine_6]: {
    content: `<line x1="0" y1="0.5" x2="node.w" y2="0.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="4.5" x2="node.w" y2="4.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="7.5" x2="node.w" y2="7.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="9.5" x2="node.w" y2="9.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="11.5" x2="node.w" y2="11.5" stroke="black" stroke-width="1"/>
<line x1="0" y1="13.5" x2="node.w" y2="13.5" stroke="black" stroke-width="1"/>`,
    w: 0, // 这个w没用
    h: 14,
    skinKey: NumberNotationSkinKeyEnum.ReduceLine_6
  },
  [NumberNotationSkinKeyEnum.addLine]: {
    content: `<rect x="0" y="0" width="10" height="4" fill="black"/>`,
    w: 10,
    h: 4,
    skinKey: NumberNotationSkinKeyEnum.addLine
  },
  [NumberNotationSkinKeyEnum.Sharp]: {
    content: `
    <g transform="scale(0.5) 
    translate(-37.88,-13.1562)
               ">
      <rect x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black" />
      <rect x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black" />
      <path d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black" />
      <path d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black" />
    </g>
`,
    w: 6.12,
    h: 15.02,
    skinKey: NumberNotationSkinKeyEnum.Sharp
  },
  [NumberNotationSkinKeyEnum.Flat]: {
    content: `
     <g transform="scale(0.5) translate(-39.6836, -20.7969)">
      <path
        d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969"
        stroke="black"
        fill="transparent"
        stroke-width="1.52124"
      />
  </g>
`,
    w: 4.32,
    h: 14.71,
    skinKey: NumberNotationSkinKeyEnum.Flat
  },
  [NumberNotationSkinKeyEnum.Double_sharp]: {
    content: `
     <g transform="scale(0.5) translate(-37.8828, -13.1562)">
         <rect id="Rectangle 1264" x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black"></rect>
        <rect id="Rectangle 1265" x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black"></rect>
        <path id="Rectangle 1266" d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black"></path>
        <path id="Rectangle 1267" d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black"></path>
        <g transform="translate(14,0)">
            <rect id="Rectangle 1264" x="40.1074" y="14.6406" width="1.48319" height="28.5514" fill="black"></rect>
            <rect id="Rectangle 1265" x="46.4102" y="13.1562" width="1.48319" height="28.5514" fill="black"></rect>
            <path id="Rectangle 1266" d="M37.8828 21.6815L50.1191 19.0859V23.5355L37.8828 26.1311V21.6815Z" fill="black"></path>
            <path id="Rectangle 1267" d="M37.8828 33.9237L50.1191 31.3281V35.7777L37.8828 38.3733V33.9237Z" fill="black"></path>
        </g>
</g>
`,
    w: 13.12,
    h: 15.02,
    skinKey: NumberNotationSkinKeyEnum.Double_sharp
  },
  [NumberNotationSkinKeyEnum.Double_flat]: {
    content: `<g transform="scale(0.5) translate(-39.6836, -21.7969)">
        <path d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969" stroke="black" fill="transparent" stroke-width="1.52124"></path>
        <g transform="translate(11,0)">
            <path d="M39.6836 39.941C44.1108 34.3597 56.6663 39.6271 39.6836 50.2217M39.6836 39.941C41.2414 38.4368 45.5825 35.9737 46.9165 40.0869C48.1652 43.937 43.0033 48.4515 39.6836 50.2217M39.6836 39.941C43.5534 36.8878 46.0949 37.9243 46.7436 39.6271C48.2747 43.6464 42.7809 48.2894 39.6836 50.2217M39.6836 50.2217V20.7969" stroke="black" fill="transparent" stroke-width="1.52124"></path>
    
        </g>
</g>`,
    w: 9.82,
    h: 14.71,
    skinKey: NumberNotationSkinKeyEnum.Double_flat
  },
  [NumberNotationSkinKeyEnum.Natural]: {
    content: `<g transform="scale(0.5) translate(-3.5000, -11.0000)">
        <path id="natural_1_" d="M5.1,23.1v5.1l5.6-1.2v-5L5.1,23.1z M12.2,17.8V39h-1.6v-8.3l-7.1,1.5V11h1.6v8.3L12.2,17.8z"></path>
</g>`,
    w: 4.35,
    h: 14,
    skinKey: NumberNotationSkinKeyEnum.Natural
  },
  [NumberNotationSkinKeyEnum.Single_barline]: {
    content: singleBarline.content,
    w: singleBarline.w,
    h: singleBarline.h,
    skinKey: NumberNotationSkinKeyEnum.Single_barline
  },
  [NumberNotationSkinKeyEnum.Double_barline]: {
    content: doubleBarline.content,
    w: doubleBarline.w,
    h: doubleBarline.h,
    skinKey: NumberNotationSkinKeyEnum.Double_barline
  },
  [NumberNotationSkinKeyEnum.StartRepeat_barline]: {
    content: startRepeatBarline.content,
    w: startRepeatBarline.w,
    h: startRepeatBarline.h,
    skinKey: NumberNotationSkinKeyEnum.StartRepeat_barline
  },
  [NumberNotationSkinKeyEnum.EndRepeat_barline]: {
    content: endRepeatBarline.content,
    w: endRepeatBarline.w,
    h: endRepeatBarline.h,
    skinKey: NumberNotationSkinKeyEnum.EndRepeat_barline
  },
  [NumberNotationSkinKeyEnum.Dashed_barline]: {
    content: dashedBarline.content,
    w: dashedBarline.w,
    h: dashedBarline.h,
    skinKey: NumberNotationSkinKeyEnum.Dashed_barline
  },
  [NumberNotationSkinKeyEnum.Final_barline]: {
    content: finalBarline.content,
    w: finalBarline.w,
    h: finalBarline.h,
    skinKey: NumberNotationSkinKeyEnum.Final_barline
  },
  [NumberNotationSkinKeyEnum.Start_end_repeat_barline]: {
    content: startEndRepeatBarline.content,
    w: startEndRepeatBarline.w,
    h: startEndRepeatBarline.h,
    skinKey: NumberNotationSkinKeyEnum.Start_end_repeat_barline
  },
  [NumberNotationSkinKeyEnum.Dotted_barline]: {
    content: dottedBarline.content,
    w: dottedBarline.w,
    h: dottedBarline.h,
    skinKey: NumberNotationSkinKeyEnum.Dotted_barline
  },
  [NumberNotationSkinKeyEnum.Reverse_barline]: {
    content: reverseBarline.content,
    w: reverseBarline.w,
    h: reverseBarline.h,
    skinKey: NumberNotationSkinKeyEnum.Reverse_barline
  },
  [NumberNotationSkinKeyEnum.Heavy_barline]: {
    content: heavyBarline.content,
    w: heavyBarline.w,
    h: heavyBarline.h,
    skinKey: NumberNotationSkinKeyEnum.Heavy_barline
  },
  [NumberNotationSkinKeyEnum.Heavy_double_barline]: {
    content: heavyDoubleBarline.content,
    w: heavyDoubleBarline.w,
    h: heavyDoubleBarline.h,
    skinKey: NumberNotationSkinKeyEnum.Heavy_double_barline
  },
  [NumberNotationSkinKeyEnum['1_1']]: makeNumberNotationTimeSignature('1', '1', NumberNotationSkinKeyEnum['1_1']),
  [NumberNotationSkinKeyEnum['1_4']]: makeNumberNotationTimeSignature('1', '4', NumberNotationSkinKeyEnum['1_4']),
  [NumberNotationSkinKeyEnum['2_4']]: makeNumberNotationTimeSignature('2', '4', NumberNotationSkinKeyEnum['2_4']),
  [NumberNotationSkinKeyEnum['3_4']]: makeNumberNotationTimeSignature('3', '4', NumberNotationSkinKeyEnum['3_4']),
  [NumberNotationSkinKeyEnum['4_4']]: makeNumberNotationTimeSignature('4', '4', NumberNotationSkinKeyEnum['4_4']),
  [NumberNotationSkinKeyEnum['3_8']]: makeNumberNotationTimeSignature('3', '8', NumberNotationSkinKeyEnum['3_8']),
  [NumberNotationSkinKeyEnum['6_8']]: makeNumberNotationTimeSignature('6', '8', NumberNotationSkinKeyEnum['6_8']),
  [NumberNotationSkinKeyEnum.AugmentationDot_1]: {
    content: `<circle cx="1.5" cy="1.5" r="1.5" fill="black"/>`,
    w: 3,
    h: 3,
    skinKey: NumberNotationSkinKeyEnum.AugmentationDot_1
  },
  [NumberNotationSkinKeyEnum.AugmentationDot_2]: {
    content: `<circle cx="1.5" cy="1.5" r="1.5" fill="black"/><circle cx="6.5" cy="1.5" r="1.5" fill="black"/>`,
    w: 8,
    h: 3,
    skinKey: NumberNotationSkinKeyEnum.AugmentationDot_2
  },
  [NumberNotationSkinKeyEnum.AugmentationDot_3]: {
    content: `<circle cx="1.5" cy="1.5" r="1.5" fill="black"/><circle cx="6.5" cy="1.5" r="1.5" fill="black"/><circle cx="11.5" cy="1.5" r="1.5" fill="black"/>`,
    w: 13,
    h: 3,
    skinKey: NumberNotationSkinKeyEnum.AugmentationDot_3
  },
  [NumberNotationSkinKeyEnum.C]: {
    content: `<g transform="translate(0.0000, 17.2727)">
        <text>1=C</text>
</g>`, w: 28.79, h: 22.73, skinKey: NumberNotationSkinKeyEnum.C
  },
  [NumberNotationSkinKeyEnum.G]: {
    content: `<g transform="translate(0.0000, 17.2727)">
        <text>1=G</text>
</g>`, w: 28.79, h: 22.73, skinKey: NumberNotationSkinKeyEnum.G
  },
  [NumberNotationSkinKeyEnum.D]: {
    content: `<g transform="translate(0.0000, 17.2727)">
        <text>1=D</text>
</g>`, w: 28.79, h: 22.73, skinKey: NumberNotationSkinKeyEnum.D
  },
  [NumberNotationSkinKeyEnum.A]: {
    content: `<g transform="translate(0.0000, 17.2727)">
        <text>1=A</text>
</g>`, w: 28.79, h: 22.73, skinKey: NumberNotationSkinKeyEnum.A
  },
  [NumberNotationSkinKeyEnum.E]: {
    content: `<g transform="translate(0.0000, 17.2727)">
        <text>1=E</text>
</g>`, w: 28.79, h: 22.73, skinKey: NumberNotationSkinKeyEnum.E
  },
  [NumberNotationSkinKeyEnum.B]: {
    content: `<g transform="translate(0.0000, 17.2727)">
        <text>1=B</text>
</g>`, w: 28.79, h: 22.73, skinKey: NumberNotationSkinKeyEnum.B
  },
  [NumberNotationSkinKeyEnum.F_sharp]: {
    content: `<g transform="translate(0.0000, 17.2727)">
        <text>1=F♯</text>
</g>`, w: 42.6, h: 22.73, skinKey: NumberNotationSkinKeyEnum.F_sharp
  },
  [NumberNotationSkinKeyEnum.F]: {
    content: `<g transform="translate(0.0000, 17.2727)">
        <text>1=F</text>
</g>`, w: 28.79, h: 22.73, skinKey: NumberNotationSkinKeyEnum.F
  },
  [NumberNotationSkinKeyEnum.B_flat]: {
    content: `<g transform="translate(0.0000, 17.2727)">
        <text>1=B♭</text>
</g>`, w: 42.6, h: 22.73, skinKey: NumberNotationSkinKeyEnum.B_flat
  },
  [NumberNotationSkinKeyEnum.E_flat]: {
    content: `<text>1=B♭</text>`,
    w: 44.28,
    h: 22.73,
    skinKey: NumberNotationSkinKeyEnum.B_flat
  },
  [NumberNotationSkinKeyEnum.A_flat]: {
    content: `<text>1=A♭</text>`,
    w: 44.28,

    skinKey: NumberNotationSkinKeyEnum.A_flat
  },
  [NumberNotationSkinKeyEnum.D_flat]: {
    content: `<text>1=D♭</text>`,
    w: 44.28,
    h: 3,
    skinKey: NumberNotationSkinKeyEnum.D_flat
  },
  [NumberNotationSkinKeyEnum.G_flat]: {
    content: `<text>1=G♭</text>`,
    w: 44.28,
    h: 3,
    skinKey: NumberNotationSkinKeyEnum.G_flat
  }, [NumberNotationSkinKeyEnum.C_flat]: {
    content: `<text>1=C♭</text>`,
    w: 44.28,
    h: 3,
    skinKey: NumberNotationSkinKeyEnum.C_flat
  },
}
export const defaultSkin: SkinPack = {
  standardStaff: standardStaffSkin,
  numberNotation: numberNotationSkin
};

/** 将皮肤包中所有 fill="black"、stroke="black" 替换为目标颜色，并为隐式黑色元素包一层 g 以应用颜色 */
function applySkinColor(color: string): SkinPack {
  const replaceColor = (content: string) => {
    let s = content
      .replace(/stroke="black"/g, `stroke="${color}"`)
      .replace(/fill="black"/g, `fill="${color}"`);
    return `<g fill="${color}" stroke="${color}">${s}</g>`;
  };
  const mapPack = <T extends Record<string, { content: string; w: number; h: number; skinKey: unknown }>>(
    pack: T
  ): T => {
    const out = {} as T;
    for (const k of Object.keys(pack) as (keyof T)[]) {
      const item = pack[k];
      out[k] = { ...item, content: replaceColor(item.content) } as T[keyof T];
    }
    return out;
  };
  return {
    standardStaff: standardStaffSkin ? mapPack(standardStaffSkin) : undefined,
    numberNotation: numberNotationSkin ? mapPack(numberNotationSkin) : undefined,
  };
}

export const defaultSkinRed: SkinPack = applySkinColor('#c00');
export const defaultSkinBlue: SkinPack = applySkinColor('#06c');

