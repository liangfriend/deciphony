//分离数字和单位
export function parseAndFormatDimension(dimension: string | number): { unit: string, value: number } {
    if (typeof dimension === 'number') {
        return {value: dimension, unit: 'px'};
    }
    // 使用正则分离数值和单位
    const match = dimension.match(/^([0-9.]+)([a-zA-Z%]*)$/);

    if (match) {
        const value = match[1]; // 数字部分
        const unit = match[2] || 'px'; // 单位部分，默认是 px
        return {value: parseFloat(value), unit}; // 返回分离的值和单位
    }

    // 如果匹配失败，抛出异常
    throw new Error(`Invalid dimension format: ${dimension}`);
}

// matrix转换为角度
export function getRotationAngleFromMatrix(matrix: string): number {
    if (!matrix || matrix === 'none') return 0;

    let values: number[] = [];

    if (matrix.startsWith('matrix3d(')) {
        // matrix3d(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
        values = matrix.slice(9, -1).split(',').map(parseFloat);
        if (values.length >= 16) {
            const [a, b, , , c, d] = values;
            return Math.atan2(b, a) * (180 / Math.PI);
        }
    } else if (matrix.startsWith('matrix(')) {
        // matrix(a, b, c, d, tx, ty)
        values = matrix.slice(7, -1).split(',').map(parseFloat);
        if (values.length >= 4) {
            const [a, b, c, d] = values;
            return Math.atan2(b, a) * (180 / Math.PI);
        }
    }

    return 0;
}
