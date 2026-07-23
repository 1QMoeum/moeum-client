import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * 하나원큐 홈 화면(캡처 기반, 반응형).
 * 캡처(1284×2549)를 콘텐츠 단위 가로 스트립 3장으로 잘라 세로로 쌓고, 스트립 사이의
 * 여백을 flex 로 늘려 기종 비율 차이를 흡수한다. 가로는 항상 100% 폭이라 어떤 기종에서도
 * 좌우가 잘리지 않는다 (기존 cover 방식은 길쭉한 기종에서 moeum 카드가 잘렸다).
 *
 *  - hero (0–1562행): 상단 바 + 계좌 + 전체계좌 카드. 계좌번호 오버레이 포함.
 *  - cards (1562–2010행): 바로가기 카드 줄. 첫 카드("개인사업자") 를 moeum 카드로 덮는다.
 *  - dock (2010–2549행): 하나더 시리즈 + 하단 탭바. 화면 바닥에 붙는다.
 *  - 신축 여백 2곳은 캡처의 균일한 배경 행(1560·2008행) 2px 슬라이스를 세로로 늘려 채운다.
 *
 * 각 스트립은 container(inline-size) 라서 오버레이 좌표는 스트립 기준 %, 글자·아이콘
 * 크기는 cqw(= 캡처 기준폭 404.031px 의 1%) 로 캡처 확대/축소에 비례해 스케일된다.
 * 클릭 시 모음 진입 스플래시(`/hana/moeum`) 를 거쳐 모음 온보딩(`/start`) 으로 넘어간다.
 */
export default function HanaHomePage() {
  const navigate = useNavigate()

  return (
    <main style={{ minHeight: '100dvh', background: '#dcf3e4' }}>
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 상단 — 계좌 영역. 계좌번호는 캡처 위에 데모용 번호를 덮어 노출한다. */}
        <div style={stripStyle}>
          <img src="/hana/home-hero.png" alt="하나원큐 홈 화면" draggable={false} style={stripImgStyle} />
          <div style={accountOverlayStyle}>153-162342-36116</div>
        </div>

        <div style={{ ...gapStyle, flexGrow: 3, backgroundImage: 'url(/hana/home-seam1.png)' }} />

        {/* 바로가기 카드 줄 — 첫 카드를 moeum 카드(글로우 펄스 + N 배지)로 덮어 교체 */}
        <div style={stripStyle}>
          <img src="/hana/home-cards.png" alt="" draggable={false} style={stripImgStyle} />
          <button
            type="button"
            aria-label="모음 시작하기"
            className="moeum-hana-glow"
            style={moeumCardStyle}
            onClick={() => navigate('/hana/moeum')}
          >
            <span aria-hidden style={moeumBadgeStyle}>
              N
            </span>
            <img
              src="/hana/moeum-mark.svg"
              alt=""
              style={{ width: '8.28cqw', height: '4.7cqw' }}
            />
            <span style={moeumTextColStyle}>
              <span style={moeumTitleStyle}>moeum 모음</span>
              <span style={moeumSubtitleStyle}>투명한 공동모금</span>
            </span>
          </button>
        </div>

        <div style={{ ...gapStyle, flexGrow: 1, maxHeight: 64, backgroundImage: 'url(/hana/home-seam2.png)' }} />

        {/* 하단 — 하나더 시리즈 + 탭바 */}
        <div style={stripStyle}>
          <img src="/hana/home-dock.png" alt="" draggable={false} style={stripImgStyle} />
        </div>
      </div>
    </main>
  )
}

const stripStyle: CSSProperties = {
  position: 'relative',
  containerType: 'inline-size',
}

const stripImgStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: 'auto',
  userSelect: 'none',
}

/** 스트립 사이 신축 여백 — 캡처의 균일 배경 2px 슬라이스를 세로로 늘려 이어붙인다. */
const gapStyle: CSSProperties = {
  flexBasis: 0,
  minHeight: 0,
  backgroundSize: '100% 100%',
}

// 계좌번호 마스킹 오버레이 — hero 스트립(1562px 높이) 기준 좌표
const accountOverlayStyle: CSSProperties = {
  position: 'absolute',
  left: '35.375%',
  top: '28.63%',
  width: '38.683%',
  height: '4.811%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#d7fefc',
  color: '#27282c',
  fontSize: '3.96cqw', // 캡처 기준폭 404.031px 에서 16px — 캡처 스케일에 비례
  lineHeight: 1.4,
  letterSpacing: '-0.02em',
  whiteSpace: 'nowrap',
}

// 캡처의 첫 바로가기 카드(개인사업자) 를 정확히 덮는 좌표 — cards 스트립(448px 높이) 기준.
// 살짝 여유를 둬 원본이 비치지 않게 한다.
const moeumCardStyle: CSSProperties = {
  position: 'absolute',
  left: '4.67%',
  top: '5.1%',
  width: '31%',
  height: '89.47%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '4.21cqw',
  padding: '6.68cqw 0 0 3.71cqw',
  background: '#fff',
  border: 'none',
  borderRadius: '5.94cqw',
  cursor: 'pointer',
  textAlign: 'left',
}

// 캡처 속 알림 종의 빨간 N 배지와 같은 문법 — 하나원큐 네이티브처럼 보이게 한다.
const moeumBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: '-1.5cqw',
  right: '-1.5cqw',
  minWidth: '4.95cqw',
  height: '4.95cqw',
  padding: '0 1.2cqw',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#ff4d4f',
  color: '#fff',
  fontSize: '2.97cqw', // 캡처 기준폭 404.031px 에서 12px
  fontWeight: 700,
  lineHeight: 1,
  borderRadius: '999px',
  border: '0.5cqw solid #fff',
}

const moeumTextColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

const moeumTitleStyle: CSSProperties = {
  color: '#27282c',
  fontSize: '3.96cqw', // 캡처 기준폭 404.031px 에서 16px
  fontWeight: 600,
  lineHeight: 1.4,
  letterSpacing: '-0.02em',
}

const moeumSubtitleStyle: CSSProperties = {
  color: '#5e6976',
  fontSize: '3.47cqw', // 캡처 기준폭 404.031px 에서 14px
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: '-0.02em',
}
