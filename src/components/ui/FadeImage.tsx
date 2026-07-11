import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  /** src 로드 실패 시 대신 시도할 원본 주소 (리사이즈 프록시 장애 대비) */
  fallbackSrc?: string
}

/**
 * 로드 완료 후 페이드인하는 이미지.
 * 큰 원본 이미지가 위에서 아래로 줄줄이 그려지는(프로그레시브 렌더) 모습을 가리고,
 * 완료 전엔 부모 배경(플레이스홀더)이 보이다가 한 번에 나타난다. lazy 로딩 기본.
 */
export default function FadeImage(props: Props) {
  const { style, onLoad, fallbackSrc, src, ...rest } = props
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <img
      loading="lazy"
      decoding="async"
      {...rest}
      src={failed && fallbackSrc ? fallbackSrc : src}
      onError={() => {
        if (fallbackSrc && !failed) setFailed(true)
      }}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
      style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.25s ease' }}
    />
  )
}
