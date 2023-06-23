import Player from './player'

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const sessionId = ''

const getMediaResource = (
  resources
) => {
  return fetch('http://apis.co.kr/token/', {
    method : 'post',
    headers: {
      'content-type': 'application/json',
      'session-id': sessionId,
      'device-os': isSafari ? 'iOS' : 'AOS'
    },
    body: JSON.stringify({
      object_types: new Array(resources.length).fill(2),
      object_ids: resources
    })
  }).then((response) => response.json())
}

getMediaResource([45]).then((tokenList) => {
  const source = tokenList[0].resource_url
  const drmToken = tokenList[0].license_token

  const video = new Player(document.getElementById('video'), {
    source,
    shakaConfigure: {
      drm: {
        token: drmToken
      }
    }
  })
})
