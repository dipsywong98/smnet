export const getParams = (): Record<string, string> => {
  const params: Record<string, string> = {}
  let items = location.search.substr(1).split('&')
  for (let index = 0; index < items.length; index++) {
    const [key, value] = items[index].split('=')
    params[key] = value
  }
  return params
}

export const attachParams = (params: Record<string, string>, url?: string) => {
  const {origin, pathname} = url === undefined ? window.location : new URL(url)
  return origin+pathname+'?'+Object.entries(params).map(pair => pair.join('=')).join('&')
}
