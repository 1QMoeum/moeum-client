import type { ReactNode } from 'react'

/**
 * 하나원큐 인앱 화면 프레임.
 * 실제 앱 캡처 이미지를 배경으로 깔고, 위에 클릭 핫스팟/오버레이(children)를 얹는다.
 * 오버레이는 캡처(상태바 크롭 후 404.031 × 829.772 기준) 좌표를 % 로 환산해 절대 배치한다.
 *
 * <p>레이아웃 — 캡처 비율(ratio)의 "스테이지"를 화면에 cover 방식(가운데·하단 정렬)으로
 * 깔고, 이미지와 오버레이를 모두 스테이지 안에 둔다. 기기 비율이 달라 캡처가 잘려나가도
 * 오버레이가 항상 이미지의 같은 지점에 붙어 있다 (컨테이너 % 기준 배치의 표류 방지).
 * 스테이지는 container(inline-size) 라서 오버레이 글자·아이콘 크기는 cqw 로 지정하면
 * 캡처 확대/축소에 비례해 함께 스케일된다. (1cqw = 캡처 기준폭 404.031px 의 1%)
 */
export default function HanaScreen({
  image,
  alt,
  background = '#fff',
  ratio = 1284 / 2637,
  children,
}: {
  image: string
  alt: string
  /** 크롭·확대 시 노출될 수 있는 좌우 여백 색(대부분 케이스에선 안 보임) */
  background?: string
  /** 캡처 원본의 가로/세로 비율. home·assets 캡처(1284×2637)가 디폴트 */
  ratio?: number
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
          overflow: 'hidden',
        }}
      >
        {/* cover + center-bottom 을 CSS 로 재현한 스테이지 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `max(100%, calc(100dvh * ${ratio}))`,
            aspectRatio: String(ratio),
            containerType: 'inline-size',
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
              userSelect: 'none',
            }}
          />
          {children}
        </div>
      </div>
    </main>
  )
}
