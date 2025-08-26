// 高音谱号 第二线 G4
import {AccidentalEnum, ClefEnum, KeySignatureEnum, StaffPositionTypeEnum, StaffRegionEnum} from "../../musicScoreEnum";
import getMidi from "../core/getMidi";

console.log(getMidi(AccidentalEnum.Natural, {
    region: StaffRegionEnum.Main,
    type: StaffPositionTypeEnum.Line,
    index: 2
}, ClefEnum.Treble, KeySignatureEnum.C));
// → 67 (G4)

// 高音谱号 第二间 A4
console.log(getMidi(AccidentalEnum.Sharp, {
    region: StaffRegionEnum.Main,
    type: StaffPositionTypeEnum.Space,
    index: 2
}, ClefEnum.Treble, KeySignatureEnum.C));
// → 70 (A#4)
// 低音谱号 第四线 F3，在 F 大调（B 降）
console.log(getMidi(AccidentalEnum.Natural, {
    region: StaffRegionEnum.Main,
    type: StaffPositionTypeEnum.Line,
    index: 4
}, ClefEnum.Bass, KeySignatureEnum.F));
// → 53 (F3)
// 2. 高音谱号，C 大调，第二间 (A4)
console.log(getMidi(
    AccidentalEnum.Natural,
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 2},
    ClefEnum.Treble,
    KeySignatureEnum.C
));
// 结果: 69 (A4)
// 3. 高音谱号，G 大调，第二线 (G4)，注意 G 大调有升 F
console.log(getMidi(
    AccidentalEnum.Natural,
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 2},
    ClefEnum.Treble,
    KeySignatureEnum.G
));
// 结果: 67 (G4)
// 5. 高音谱号，F 大调，第一间 (F4)，调号里有降 B
console.log(getMidi(
    AccidentalEnum.Natural,
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Space, index: 1},
    ClefEnum.Treble,
    KeySignatureEnum.F
));
// 结果: 65 (F4)

// 6. 高音谱号，D 大调，第四线 (D5)，调号有升 F、升 C
console.log(getMidi(
    AccidentalEnum.Natural,
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 4},
    ClefEnum.Treble,
    KeySignatureEnum.D
));
// 结果: 74 (D5)


// 1. 低音谱号，F 大调，五线谱中线 (A2)
console.log(getMidi(
    AccidentalEnum.Natural,
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 4},
    ClefEnum.Bass,
    KeySignatureEnum.F
));
// 结果: 45 (A2)


// 4. 中音谱号 (C4 在中线)，第一线 (E3)
console.log(getMidi(
    AccidentalEnum.Natural,
    {region: StaffRegionEnum.Main, type: StaffPositionTypeEnum.Line, index: 1},
    ClefEnum.Alto,
    KeySignatureEnum.C
));
// 结果: 52 (E3)
