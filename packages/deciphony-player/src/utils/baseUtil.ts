export function base64ToArrayBuffer(base64:string) {
    // 先去掉 dataURL 的头部（如果有的话）
    const binaryString = atob(base64.replace(/^data:.*;base64,/, ''));
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer; // 返回 ArrayBuffer
}
