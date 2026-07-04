import type { CSSProperties } from 'react'

interface Props {
  height?: number
}

/**
 * 모음 워드마크. public/moeum-logo.svg 를 그대로 사용.
 */
export default function MoeumLogo({ height = 56 }: Props) {
  const imgStyle: CSSProperties & { WebkitUserDrag?: string } = {
    height,
    width: 'auto',
    userSelect: 'none',
    WebkitUserDrag: 'none',
  }
  return <img src="/moeum-logo.svg" alt="moeum" draggable={false} style={imgStyle} />
}
