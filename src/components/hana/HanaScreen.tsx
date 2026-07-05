import type { ReactNode } from 'react'

/**
 * 하나원큐 인앱 화면 프레임.
 * 실제 앱 캡처 이미지를 배경으로 깔고, 위에 클릭 핫스팟/오버레이(children)를 얹는다.
 * 오버레이는 캡처(상태바 크롭 후 404.031 × 829.772 기준) 좌표를 % 로 환산해 절대 배치한다.
 *
 * <p>레이아웃 — 이미지를 뷰포트 100dvh 에 꽉 채운다(object-fit: cover).
 * 아스펙트 비율 차이가 나면 상단만 최소 크롭 (object-position: center bottom).
 * 하단 네비는 항상 보존. 핫스팟(children)은 이미지와 동일 박스에 % 좌표로 배치되므로
 * 크롭이 소량이면 자연스레 이미지 위 정위치에 맞는다.
 */
export default function HanaScreen({
  image,
  alt,
  background = '#fff',
  children,
}: {
  image: string
  alt: string
  /** 크롭·확대 시 노출될 수 있는 좌우 여백 색(대부분 케이스에선 안 보임) */
  background?: string
  children?: ReactNode
}) {
  return (
    <main style={{ minHeight: '100dvh', background }}>
      <div
        style={{
          position: 'relative',
          maxWidth: 480,
          width: '100%',
          height: '100dvh',
          margin: '0 auto',
        }}
      >
        <img
          src={image}
          alt={alt}
          draggable={false}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center bottom',
            userSelect: 'none',
          }}
        />
        {children}
      </div>
    </main>
  )
}
