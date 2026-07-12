import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import HanaScreen from '@/components/hana/HanaScreen'

/**
 * 하나원큐 자산 탭 화면(캡처 기반).
 * 캡처 위에 "모음" 배너 카드를 얹고, 카드 클릭 시 모음 진입 스플래시(`/hana/moeum`) 를 거쳐
 * 모음 서비스 시작(`/start`) 으로 넘어간다. 스플래시가 브랜드 전환을 시각화한다.
 */
export default function HanaAssetsPage() {
  const navigate = useNavigate()

  return (
    <HanaScreen image="/hana/assets-tab.png" alt="하나원큐 자산 화면" background="#dcf3e4">
      <button
        type="button"
        aria-label="모음 시작하기"
        style={cardStyle}
        onClick={() => navigate('/hana/moeum')}
      >
        <img
          src="/hana/moeum-mark.svg"
          alt=""
          style={{ width: 63, height: 35.8, flexShrink: 0 }}
        />
        <span style={textColStyle}>
          <span style={titleStyle}>moeum 모음</span>
          <span style={subtitleStyle}>
            투명하고 안전하게
            <br />
            공동 모금하기
          </span>
        </span>
        <img src="/hana/close.svg" alt="" style={closeIconStyle} />
      </button>

      {/* 하단 네비 "홈" 탭 핫스팟 — 자산 탭 핫스팟(HanaHomePage) 좌표에서 왼쪽으로 한 칸 */}
      <button
        type="button"
        aria-label="홈 탭으로 이동"
        style={homeTabStyle}
        onClick={() => navigate('/hana/home')}
      />
    </HanaScreen>
  )
}

const cardStyle: CSSProperties = {
  position: 'absolute',
  left: '4.835%',
  top: '51.66%',
  width: '90.345%',
  height: '14.62%',
  display: 'flex',
  alignItems: 'center',
  gap: 25,
  padding: '0 23px',
  background: '#fff',
  border: 'none',
  borderRadius: 33,
  cursor: 'pointer',
  textAlign: 'left',
}

const textColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const titleStyle: CSSProperties = {
  color: '#73787e',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: '-0.29px',
}

const subtitleStyle: CSSProperties = {
  color: '#27282c',
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.4,
  letterSpacing: '-0.35px',
}

const closeIconStyle: CSSProperties = {
  position: 'absolute',
  top: '15.25%',
  right: '5.07%',
  width: 12.3,
  height: 12.3,
}

// 하단 탭 좌표는 HanaHomePage 의 자산 탭 좌표(left 21.378%, top 87.96%) 를 그대로
// 왼쪽 한 칸(width 20.105%) 만큼 이동해 홈 탭에 맞춤.
const homeTabStyle: CSSProperties = {
  position: 'absolute',
  left: '1.273%',
  top: '87.96%',
  width: '20.105%',
  height: '12.02%',
  padding: 0,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
}
