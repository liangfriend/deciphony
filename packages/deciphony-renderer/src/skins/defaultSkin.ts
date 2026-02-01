import {Skin} from "@/types/common";

// 五线谱小节线：五条横线，使用0-1归一化坐标便于缩放
// 五线从上到下：y=0, 0.25, 0.5, 0.75, 1
const measure = `
    <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="black" stroke-width="1"></line>
    <line x1="0" y1="11.5" x2="100" y2="11.5" stroke="black" stroke-width="1"></line>
    <line x1="0" y1="22.5" x2="100" y2="22.5" stroke="black" stroke-width="1"></line>
    <line x1="0" y1="33.5" x2="100" y2="33.5" stroke="black" stroke-width="1"></line>
    <line x1="0" y1="44.5" x2="100" y2="44.5" stroke="black" stroke-width="1"></line>
`

export const defaultSkin: Skin = {
    measure: measure
}