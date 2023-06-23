import shaka from 'shaka-player'

export const siteId = 'JQ4I'

export const licenseURI = 'https://license.pallycon.com/ri/licenseManager.do'

export const fairplayCertURI = `https://license-global.pallycon.com/ri/fpsKeyManager.do?siteId=${siteId}`

export const drmTypes = {
  Widevine: {
    name: 'Widevine',
    mediaKey: 'com.widevine.alpha'
  },
  PlayReady: {
    name: 'PlayReady',
    mediaKey: 'com.microsoft.playready'
  },
  FairPlay: {
    name: 'FairPlay',
    mediaKey: 'com.apple.fps.1_0',
  }
}

export const getFpsCert = () => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText)
      } else {
        reject(xhr.statusText)
      }
    }

    xhr.onerror = () => reject(xhr.statusText)

    xhr.open('GET', fairplayCertURI, false)
    xhr.send()
  })
}

export const arrayBufferToString = (buffer) => {
  const arr = new Uint8Array(buffer)
  const str = String.fromCharCode.apply(String, arr)

  return str
}

export const parsingResponse = (response) => {
  let responseText = arrayBufferToString(response.data)
  responseText = responseText.trim()

  try {
  } catch (error) {}
}

export default class Player {
  constructor (
    media,
    config
  ) {
    this.shaka = null
    this.media = media
    this.config = config

    this.init()
  }

  init () {
    this.initShaka()
      .then(() => this.initEvents())
  }

  async initShaka () {
    shaka.polyfill.installAll()

    this.shaka = new shaka.Player(this.media)

    const { shakaConfigure } = this.config
    const extension = this.config.source.split('.').pop()
    const drmType = extension === 'm3u8' ? 'FairPlay' : 'Widevine'
    const drmToken = shakaConfigure.drm.token

    delete shakaConfigure.drm.token

    if (drmType === 'Widevine') {
      shakaConfigure.drm = {
        servers: {
          'com.widevine.alpha': licenseURI,
        },
        advanced: {
          'com.widevine.alpha': {
            'persistentStateRequired': true
          }
        }
      }

      this.shaka.getNetworkingEngine()
      .registerRequestFilter((
        type,
        request
      ) => {
        if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
          request.headers['pallycon-customdata-v2'] = drmToken
        }
      })
    }

    if (drmType === 'FairPlay') {
      // shaka.polyfill.PatchedMediaKeysApple?.install()
      const fairplayCert = shaka.util.Uint8ArrayUtils.fromBase64(await getFpsCert())

      shakaConfigure.drm = {
        servers: {
          'com.apple.fps': licenseURI
        },
        advanced: {
          'com.apple.fps': {
            serverCertificate: fairplayCert
          }
        }
      }

      this.shaka.getNetworkingEngine()
      .registerRequestFilter((
        type,
        request
      ) => {
        if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
          const originalPayload = new Uint8Array(request.body)
          const base64Payload = shaka.util.Uint8ArrayUtils.toBase64(originalPayload)
          const params = 'spc=' + encodeURIComponent(base64Payload);

          request.body = shaka.util.StringUtils.toUTF8(params)
          request.headers['pallycon-customdata-v2'] = drmToken
        }
      })

      this.shaka.getNetworkingEngine()
      .registerResponseFilter((
        type,
        response
      ) => {
        if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
          const responseText = shaka.util.StringUtils.fromUTF8(response.data).trim()
          response.data = shaka.util.Uint8ArrayUtils.fromBase64(responseText).buffer

          parsingResponse(response)
        }
      })
    }

    console.log(shakaConfigure)
    this.shaka.configure(shakaConfigure)    
  }

  initEvents () {
    this.media.addEventListener('play', this.onPlay.bind(this))
  }

  onPlay () {
    if (!this.loaded) {
      this.loadSource()
    }
  }

  async loadSource (
    source = this.config.source
  ) {
    if (this.shaka) {
      try {
        await this.shaka.load(source)

        this.loaded = true
      } catch (error) {
        console.error(error)
      }
    }
  }  
}