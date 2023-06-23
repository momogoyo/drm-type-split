export const siteId = ''
export const licenseURI = 'https://license.pallycon.com/ri/licenseManager.do'
export const fairplayCertURI = `https://license-global.pallycon.com/ri/fpsKeyManager.do?siteId=${siteId}`

export const checkSupportedDRM = () => {
  const config = [{
    initDataTypes: ['cenc'],
    audioCapabilities: [{
      contentType: 'audio/mp4;codecs="mp4a.40.2"',
      robustness: 'SW_SECURE_CRYPTO'
    }],
    videoCapabilities: [{
      contentType: 'video/mp4;codecs="avc1.42E01E"',
      robustness: 'SW_SECURE_CRYPTO'
    }],
  }]

  const drm = {
    Widevine: {
      name: 'Widevine',
      mediaKey: 'com.widevine.alpha',
    },
    PlayReady: {
      name: 'PlayReady',
      mediaKey: 'com.microsoft.playready',
    },
    FairPlay: {
      name: 'FairPlay',
      mediaKey: 'com.apple.fps.1_0',
    }
  }

  for (const key of Object.keys(drm)) {
    try {
      return navigator
        .requestMediaKeySystemAccess(drm[key].mediaKey, config)
        .then((mediaKeySystemAccess) => drm[key].name)
        .catch(console.log)
    } catch (error) {
      return Promise.resolve('')
    }
  }
}

export const getDrmConfigure = ({
  resourceUrl,
  licenseToken
}) => {
  const configure = {
    src: resourceUrl,
    type: 'application/dash+xml',
    keySystemOptions: []    
  }

  configure.keySystemOptions.push({
    name: 'com.widevine.alpha',
    options: {
      serverURL: licenseURI,
      httpRequestHeaders: {
        'pallycon-customdata-v2': licenseToken
      },
      persistentState: 'required',
      'videoRobustness': 'SW_SECURE_CRYPTO',
      'audioRobustness': 'SW_SECURE_CRYPTO'
    }
  })

  return configure
}