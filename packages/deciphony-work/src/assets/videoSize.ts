/** 从 File / Blob / URL 读取视频原始像素宽高 */
export async function readVideoSize(
  source: File | Blob | string,
): Promise<{width: number; height: number}> {
  const url = typeof source === 'string' ? source : URL.createObjectURL(source)
  const revoke = typeof source !== 'string'

  try {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    await new Promise<void>((resolve, reject) => {
      const done = () => {
        video.onloadedmetadata = null
        video.onerror = null
        resolve()
      }
      video.onloadedmetadata = () => done()
      video.onerror = () => reject(new Error('视频加载失败'))
      video.src = url
    })
    const width = video.videoWidth
    const height = video.videoHeight
    video.removeAttribute('src')
    video.load()
    if (!(width > 0 && height > 0)) {
      throw new Error('无法读取视频原始宽高')
    }
    return {width, height}
  } finally {
    if (revoke) URL.revokeObjectURL(url)
  }
}
