const sessionId = ''

const camelCased = (items) => {
  return items.map((item) => {
    const nItem = {}
    Object.keys(item).forEach((key) => {
      const camelCase = key.replace(/[-_]+(.)?/g, (m, w) => w.toUpperCase())
      if (Array.isArray(item[key])) {
        nItem[camelCase] = camelCased(item[key])
      } else {
        nItem[camelCase] = item[key]
      }
    })

    return nItem
  })
}

const request = ({
  url,
  method,
  headers,
  body
}) => {
  return fetch(url, {
    method,
    headers: {
      ...headers,
      'session-id': sessionId
    },
    body
  })
  .then((response) => response.json())
  .then((data) => camelCased(data))
}

export const getSeries = () => {
  return request({
    url: 'https://apis.co.kr/content/audio_program/?type_code=3',
  })
}

export const getChapter = (
  chapterId = 18
) => {
  return request({
    url: `https://apis.co.kr/content/audio_program/audio/${chapterId}/`,
  })  
}

export const getTokens = (
  mediaIds = []
) => {
  return request({
    url: 'https://apis.co.kr/token/',
    method: 'post',
    headers: {
      'content-type': 'application/json',
      'device-os': 'AOS'
    },
    body: JSON.stringify({
      object_types: new Array(mediaIds.length).fill(2),
      object_ids: mediaIds
    })
  })
}