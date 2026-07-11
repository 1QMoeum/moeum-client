import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'

/**
 * 로드 완료 후 페이드인하는 이미지.
 * 큰 원본 이미지가 위에서 아래로 줄줄이 그려지는(프로그레시브 렌더) 모습을 가리고,
 * 완료 전엔 부모 배경(플레이스홀더)이 보이다가 한 번에 나타난다. lazy 로딩 기본.
 */
export default function FadeImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { style, onLoad, ...rest } = props
  const [loaded, setLoaded] = useState(false)

  return (
    <img
      loading="lazy"
      decoding="async"
      {...rest}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
      style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.25s ease' }}
    />
  )
}
