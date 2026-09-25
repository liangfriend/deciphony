/**
 * 标准键盘的 KeyboardEvent.code 枚举
 * 适用于主键区、小键盘、功能键、方向键、修饰键等
 */
export var KeyCodeEnum;
(function (KeyCodeEnum) {
    // ===== 控制键 =====
    KeyCodeEnum["Escape"] = "Escape";
    KeyCodeEnum["Tab"] = "Tab";
    KeyCodeEnum["CapsLock"] = "CapsLock";
    KeyCodeEnum["ShiftLeft"] = "ShiftLeft";
    KeyCodeEnum["ShiftRight"] = "ShiftRight";
    KeyCodeEnum["ControlLeft"] = "ControlLeft";
    KeyCodeEnum["ControlRight"] = "ControlRight";
    KeyCodeEnum["AltLeft"] = "AltLeft";
    KeyCodeEnum["AltRight"] = "AltRight";
    KeyCodeEnum["MetaLeft"] = "MetaLeft";
    KeyCodeEnum["MetaRight"] = "MetaRight";
    KeyCodeEnum["Space"] = "Space";
    KeyCodeEnum["Enter"] = "Enter";
    KeyCodeEnum["Backspace"] = "Backspace";
    // ===== 数字区（主键区）=====
    KeyCodeEnum["Backquote"] = "Backquote";
    KeyCodeEnum["Digit1"] = "Digit1";
    KeyCodeEnum["Digit2"] = "Digit2";
    KeyCodeEnum["Digit3"] = "Digit3";
    KeyCodeEnum["Digit4"] = "Digit4";
    KeyCodeEnum["Digit5"] = "Digit5";
    KeyCodeEnum["Digit6"] = "Digit6";
    KeyCodeEnum["Digit7"] = "Digit7";
    KeyCodeEnum["Digit8"] = "Digit8";
    KeyCodeEnum["Digit9"] = "Digit9";
    KeyCodeEnum["Digit0"] = "Digit0";
    KeyCodeEnum["Minus"] = "Minus";
    KeyCodeEnum["Equal"] = "Equal";
    // ===== 字母区 =====
    KeyCodeEnum["KeyQ"] = "KeyQ";
    KeyCodeEnum["KeyW"] = "KeyW";
    KeyCodeEnum["KeyE"] = "KeyE";
    KeyCodeEnum["KeyR"] = "KeyR";
    KeyCodeEnum["KeyT"] = "KeyT";
    KeyCodeEnum["KeyY"] = "KeyY";
    KeyCodeEnum["KeyU"] = "KeyU";
    KeyCodeEnum["KeyI"] = "KeyI";
    KeyCodeEnum["KeyO"] = "KeyO";
    KeyCodeEnum["KeyP"] = "KeyP";
    KeyCodeEnum["KeyA"] = "KeyA";
    KeyCodeEnum["KeyS"] = "KeyS";
    KeyCodeEnum["KeyD"] = "KeyD";
    KeyCodeEnum["KeyF"] = "KeyF";
    KeyCodeEnum["KeyG"] = "KeyG";
    KeyCodeEnum["KeyH"] = "KeyH";
    KeyCodeEnum["KeyJ"] = "KeyJ";
    KeyCodeEnum["KeyK"] = "KeyK";
    KeyCodeEnum["KeyL"] = "KeyL";
    KeyCodeEnum["KeyZ"] = "KeyZ";
    KeyCodeEnum["KeyX"] = "KeyX";
    KeyCodeEnum["KeyC"] = "KeyC";
    KeyCodeEnum["KeyV"] = "KeyV";
    KeyCodeEnum["KeyB"] = "KeyB";
    KeyCodeEnum["KeyN"] = "KeyN";
    KeyCodeEnum["KeyM"] = "KeyM";
    // ===== 标点区 =====
    KeyCodeEnum["BracketLeft"] = "BracketLeft";
    KeyCodeEnum["BracketRight"] = "BracketRight";
    KeyCodeEnum["Backslash"] = "Backslash";
    KeyCodeEnum["Semicolon"] = "Semicolon";
    KeyCodeEnum["Quote"] = "Quote";
    KeyCodeEnum["Comma"] = "Comma";
    KeyCodeEnum["Period"] = "Period";
    KeyCodeEnum["Slash"] = "Slash";
    // ===== 功能键 =====
    KeyCodeEnum["F1"] = "F1";
    KeyCodeEnum["F2"] = "F2";
    KeyCodeEnum["F3"] = "F3";
    KeyCodeEnum["F4"] = "F4";
    KeyCodeEnum["F5"] = "F5";
    KeyCodeEnum["F6"] = "F6";
    KeyCodeEnum["F7"] = "F7";
    KeyCodeEnum["F8"] = "F8";
    KeyCodeEnum["F9"] = "F9";
    KeyCodeEnum["F10"] = "F10";
    KeyCodeEnum["F11"] = "F11";
    KeyCodeEnum["F12"] = "F12";
    // ===== 导航键 =====
    KeyCodeEnum["Insert"] = "Insert";
    KeyCodeEnum["Delete"] = "Delete";
    KeyCodeEnum["Home"] = "Home";
    KeyCodeEnum["End"] = "End";
    KeyCodeEnum["PageUp"] = "PageUp";
    KeyCodeEnum["PageDown"] = "PageDown";
    KeyCodeEnum["ArrowUp"] = "ArrowUp";
    KeyCodeEnum["ArrowDown"] = "ArrowDown";
    KeyCodeEnum["ArrowLeft"] = "ArrowLeft";
    KeyCodeEnum["ArrowRight"] = "ArrowRight";
    // ===== 小键盘区 =====
    KeyCodeEnum["NumLock"] = "NumLock";
    KeyCodeEnum["NumpadDivide"] = "NumpadDivide";
    KeyCodeEnum["NumpadMultiply"] = "NumpadMultiply";
    KeyCodeEnum["NumpadSubtract"] = "NumpadSubtract";
    KeyCodeEnum["NumpadAdd"] = "NumpadAdd";
    KeyCodeEnum["NumpadEnter"] = "NumpadEnter";
    KeyCodeEnum["NumpadDecimal"] = "NumpadDecimal";
    KeyCodeEnum["Numpad0"] = "Numpad0";
    KeyCodeEnum["Numpad1"] = "Numpad1";
    KeyCodeEnum["Numpad2"] = "Numpad2";
    KeyCodeEnum["Numpad3"] = "Numpad3";
    KeyCodeEnum["Numpad4"] = "Numpad4";
    KeyCodeEnum["Numpad5"] = "Numpad5";
    KeyCodeEnum["Numpad6"] = "Numpad6";
    KeyCodeEnum["Numpad7"] = "Numpad7";
    KeyCodeEnum["Numpad8"] = "Numpad8";
    KeyCodeEnum["Numpad9"] = "Numpad9";
    // ===== 其他特殊键 =====
    KeyCodeEnum["PrintScreen"] = "PrintScreen";
    KeyCodeEnum["ScrollLock"] = "ScrollLock";
    KeyCodeEnum["Pause"] = "Pause";
    KeyCodeEnum["ContextMenu"] = "ContextMenu";
    KeyCodeEnum["Convert"] = "Convert";
    KeyCodeEnum["NonConvert"] = "NonConvert";
    // 媒体键（有些键盘才有）
    KeyCodeEnum["AudioVolumeMute"] = "AudioVolumeMute";
    KeyCodeEnum["AudioVolumeUp"] = "AudioVolumeUp";
    KeyCodeEnum["AudioVolumeDown"] = "AudioVolumeDown";
    KeyCodeEnum["MediaTrackNext"] = "MediaTrackNext";
    KeyCodeEnum["MediaTrackPrevious"] = "MediaTrackPrevious";
    KeyCodeEnum["MediaPlayPause"] = "MediaPlayPause";
})(KeyCodeEnum || (KeyCodeEnum = {}));
export var BoxType;
(function (BoxType) {
    BoxType["Instrument"] = "Instrument";
    BoxType["Normal"] = "Normal";
})(BoxType || (BoxType = {}));
export var ModelEnum;
(function (ModelEnum) {
    ModelEnum["Xiao"] = "Xiao";
})(ModelEnum || (ModelEnum = {}));
