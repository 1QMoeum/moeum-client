import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import HanaScreen from '@/components/hana/HanaScreen'

/**
 * 하나원큐 홈 화면(캡처 기반).
 * 캡처의 첫 바로가기 카드("개인사업자") 위에 "moeum 모음" 카드를 덮어 올리고,
 * 클릭 시 모음 진입 스플래시(`/hana/moeum`) 를 거쳐 모음 온보딩(`/start`) 으로 넘어간다.
 * 계좌번호 영역은 캡처 위에 데모용 번호를 덮어 노출한다.
 */
export default function HanaHomePage() {
  const navigate = useNavigate()

  return (
    <HanaScreen image="/hana/home.png" alt="하나원큐 홈 화면" background="#dcf3e4">
      {/* 계좌번호 마스킹 오버레이 */}
      <div style={accountOverlayStyle}>153-162342-36116</div>

      {/* "moeum 모음" 바로가기 카드 — 캡처의 첫 카드를 흰색 카드로 덮어 교체.
          글로우 펄스 + N 배지로 다른 바로가기 카드보다 시선이 먼저 가게 한다. */}
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
    </HanaScreen>
  )
}

const accountOverlayStyle: CSSProperties = {
  position: 'absolute',
  left: '35.375%',
  top: '16.96%',
  width: '38.683%',
  height: '2.85%',
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

// 캡처의 첫 바로가기 카드(개인사업자) 를 정확히 덮는 좌표. 살짝 여유를 둬 원본이 비치지 않게 한다.
const moeumCardStyle: CSSProperties = {
  position: 'absolute',
  left: '4.67%',
  top: '60.1%',
  width: '31%',
  height: '15.2%',
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
