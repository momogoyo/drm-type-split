import videojs from 'video.js'
import 'videojs-contrib-eme'
import 'videojs-contrib-dash'

import {
  getSeries,
  getChapter,
  getTokens
} from './api'

import {
  getDrmConfigure
} from './drm'

let series = null

let chapterIndex = 0

const players = [
  { key: 'video', video: null },
  { key: 'bgm', video: null },
  { key: 'effect', video: null },
  { key: 'narration', video: null }
]

const setupVideoJS = () => {
  players.forEach((player) => {
    const rawVideo = document.getElementById(player.key)
    const video = videojs(rawVideo, {
      children: []
    })
    video.eme()

    player.rawVideo = rawVideo
    player.video = video
  })
}

const resetVideoJS = () => {
  players.forEach(({ video }) => {
    video.dash.mediaPlayer.reset()
    // video.reset()
  })
}

const getDrmConfigures = (
  tokens
) => {
  return tokens.map(({
    resourceUrl,
    licenseToken
  }) => getDrmConfigure({
    resourceUrl,
    licenseToken
  }))
}

const setDrmConfigures = (
  configures
) => {
  const promises = configures.map((
    configure,
    index
  ) => {
    return new Promise((resolve) => {
      const { video } = players[index]

      video.ready(resolve)
      video.src(configure)
    })
  })

  return Promise.all(promises)
}

const changeSource = async (
  index
) => {
  const updated = chapterIndex !== Math.min(Math.max(index, 0), series.length - 1)
  if (updated) {
    // 새 챕터 정보 가져옵니다.
    const chapterId = series[index].programId
    const chapter = await getChapter(chapterId)

    // 새 챕터의 토큰 정보를 가져옵니다.
    const tokens = await getTokens(
      chapter.map(({ audioId }) => audioId)
    )

    // 전체 videoJS 인스턴스를 reset합니다.
    resetVideoJS()

    // 토큰 정보를 토대로 복호화를 요청합니다.
    const configures = getDrmConfigures(tokens)
    await setDrmConfigures(configures)

    chapterIndex = index
  } else {
    alert('첫 번째 또는 마지막 챕터 입니다.')
  }
}

const addEventListeners = () => {
  // 전체 재생
  document.getElementById('playAll').addEventListener('click', () => {
    players.forEach(({ video }) => video.play())
  })

  // 전체 멈춤
  document.getElementById('pauseAll').addEventListener('click', () => {
    players.forEach(({ video }) => video.pause())
  })

  // 이전 챕터
  document.getElementById('prevChapter').addEventListener('click', () => {
    changeSource(chapterIndex - 1)
  })

  // 다음 챕터
  document.getElementById('nextChapter').addEventListener('click', () => {
    changeSource(chapterIndex + 1)
  })
}

const initialize = async () => {
  series = await getSeries()

  // 챕터 정보 가져옵니다.
  const chapterId = series[chapterIndex].programId
  const chapter = await getChapter(chapterId)

  // 현재 챕터의 토큰 정보를 가져옵니다.
  const tokens = await getTokens(
    chapter.map(({ audioId }) => audioId)
  )

  // videoJS 인스턴스를 생성합니다.
  setupVideoJS()

  // 토큰 정보를 토대로 복호화를 요청합니다.
  const configures = getDrmConfigures(tokens)
  await setDrmConfigures(configures)

  // 미디어 재생을 위한 준비가 완료되었습니다.
  players.forEach(({ rawVideo }) => {
    rawVideo.controls = true
  })

  // 기타 이벤트 처리
  addEventListeners()
}

initialize()
