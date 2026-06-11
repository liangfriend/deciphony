export function getQuery() {
  // 获取 # 后面的部分，如 /game/game?saveId=9&gameId=4&type=game
  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')

  if (queryIndex === -1) return {}

  const queryStr = hash.slice(queryIndex + 1)
  const params = new URLSearchParams(queryStr)

  const obj: any = {}
  params.forEach((v, k) => {
    obj[k] = v
  })
  return obj
}
