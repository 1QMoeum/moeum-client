import type { CSSProperties } from 'react'

interface Props {
  height?: number
}

/**
 * 모음 워드마크. public/moeum-logo.png 를 그대로 사용.
 * 디자이너 SVG 받으면 그때 교체.
 */
export default function MoeumLogo({ height = 56 }: Props) {
  const imgStyle: CSSProperties & { WebkitUserDrag?: string } = {
    height,
    width: 'auto',
    userSelect: 'none',
    WebkitUserDrag: 'none',
  }
  return <img src="/moeum-logo.png" alt="moeum" draggable={false} style={imgStyle} />
}
