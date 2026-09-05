/** 从 File / Blob / URL 读取图片原始像素宽高 */
export async function readImageSize(
  source: File | Blob | string,
): Promise<{width: number; height: number}> {
  if (typeof source !== 'string' && typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(source)
      const size = {width: bitmap.width, height: bitmap.height}
      bitmap.close()
      if (size.width > 0 && size.height > 0) return size
    } catch {
      // 部分 SVG / 类型走 Image 回退
    }
  }

  const url =
    typeof source === 'string' ? source : URL.createObjectURL(source)
  const revoke = typeof source !== 'string'

  try {
    const img = await loadHtmlImage(url)
    const width = img.naturalWidth
    const height = img.naturalHeight
    if (!(width > 0 && height > 0)) {
      throw new Error('无法读取图片原始宽高')
    }
    return {width, height}
  } finally {
    if (revoke) URL.revokeObjectURL(url)
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
}
