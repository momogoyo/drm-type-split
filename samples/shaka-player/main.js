import Player from './player'

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const sessionId = '20B4A3A5F9F6BA4DD519CEF23E73E2461639E498'

const getMediaResource = (
  resources
) => {
  return fetch('https://qa-apis.millie.co.kr/v1/inka/token/', {
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
