import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import HanaScreen from '@/components/hana/HanaScreen'

/**
 * 하나원큐 홈 화면(캡처 기반).
 * 실제 동작하는 요소는 하단 네비게이션의 "자산" 탭 하나 — 클릭 시 자산 탭 화면으로 이동한다.
 * 계좌번호 영역은 캡처 위에 데모용 번호를 덮어 노출한다.
 */
export default function HanaHomePage() {
  const navigate = useNavigate()

  return (
    <HanaScreen image="/hana/home.png" alt="하나원큐 홈 화면" background="#dcf3e4">
      {/* 계좌번호 마스킹 오버레이 */}
      <div style={accountOverlayStyle}>153-162342-36116</div>

      {/* 하단 네비 "자산" 탭 핫스팟 — 캡처에 이미 탭이 그려져 있어 투명 클릭 영역만 얹는다 */}
      <button
        type="button"
        aria-label="자산 탭으로 이동"
        style={assetTabStyle}
        onClick={() => navigate('/hana/assets')}
      />
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
  fontSize: 16,
  lineHeight: 1.4,
  letterSpacing: '-0.33px',
  whiteSpace: 'nowrap',
}

const assetTabStyle: CSSProperties = {
  position: 'absolute',
  left: '21.378%',
  top: '87.96%',
  width: '20.105%',
  height: '12.02%',
  padding: 0,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
}
