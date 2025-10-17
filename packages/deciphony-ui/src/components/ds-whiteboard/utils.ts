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
