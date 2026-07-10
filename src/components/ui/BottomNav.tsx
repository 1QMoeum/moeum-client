import type { CSSProperties, ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** Figma 디자인의 Solid 아이콘 세트 — currentColor로 활성/비활성 색을 전환한다. */
const ICON_PATHS: Record<string, ReactElement> = {
  home: (
    <path d="M13.796 4.13612C12.8136 3.1215 11.1863 3.1215 10.2039 4.13611L5.40546 9.09185C5.12987 9.37646 4.94469 9.73627 4.87323 10.1259C4.29047 13.3039 4.24745 16.5574 4.74599 19.7496L4.92249 20.8798C4.97824 21.2368 5.2857 21.5 5.64701 21.5H8.99997C9.27611 21.5 9.49997 21.2761 9.49997 21V14H14.5V21C14.5 21.2761 14.7238 21.5 15 21.5H18.3529C18.7142 21.5 19.0217 21.2368 19.0774 20.8798L19.2539 19.7496C19.7524 16.5574 19.7094 13.3039 19.1267 10.1259C19.0552 9.73627 18.87 9.37646 18.5944 9.09185L13.796 4.13612Z" />
  ),
  calendar: (
    <>
      <path d="M7.75 4C7.75 3.58579 7.41421 3.25 7 3.25C6.58579 3.25 6.25 3.58579 6.25 4V5.81643C4.75693 6.02751 3.57738 7.20845 3.3777 8.71484L3.29115 9.36779C3.27647 9.47849 3.26244 9.58926 3.24905 9.70008C3.21354 9.99405 3.44514 10.25 3.74125 10.25H20.2587C20.5548 10.25 20.7864 9.99405 20.7509 9.70008C20.7375 9.58926 20.7235 9.47849 20.7088 9.36779L20.6222 8.71484C20.4226 7.20847 19.243 6.02754 17.75 5.81644V4C17.75 3.58579 17.4142 3.25 17 3.25C16.5858 3.25 16.25 3.58579 16.25 4V5.66763C13.4223 5.4158 10.5777 5.4158 7.75 5.66763V4Z" />
      <path d="M20.9446 12.2256C20.9358 11.9591 20.7156 11.75 20.4491 11.75H3.55087C3.28429 11.75 3.06413 11.9591 3.05537 12.2256C2.99598 14.0332 3.10578 15.8446 3.38451 17.6359C3.59552 18.9919 4.69718 20.0335 6.06292 20.1681L7.25593 20.2858C10.411 20.5969 13.589 20.5969 16.744 20.2858L17.937 20.1681C19.3028 20.0335 20.4044 18.9919 20.6154 17.6359C20.8942 15.8446 21.004 14.0332 20.9446 12.2256Z" />
    </>
  ),
  explore: (
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.3851 15.4457C11.7348 17.5684 7.85537 17.4013 5.39858 14.9445C2.76254 12.3085 2.76254 8.03464 5.39858 5.3986C8.03462 2.76256 12.3085 2.76256 14.9445 5.3986C17.4013 7.85538 17.5684 11.7348 15.4457 14.3851L20.6014 19.5407C20.8943 19.8336 20.8943 20.3085 20.6014 20.6014C20.3085 20.8943 19.8336 20.8943 19.5407 20.6014L14.3851 15.4457ZM6.45924 13.8839C4.40899 11.8336 4.40899 8.50951 6.45924 6.45926C8.50949 4.40901 11.8336 4.40901 13.8839 6.45926C15.9326 8.50801 15.9341 11.8287 13.8884 13.8794C13.8869 13.8809 13.8854 13.8823 13.8838 13.8839C13.8823 13.8854 13.8808 13.8869 13.8794 13.8884C11.8287 15.9341 8.50799 15.9326 6.45924 13.8839Z"
    />
  ),
  map: (
    <>
      <path d="M8.75 10C8.75 8.20507 10.2051 6.75 12 6.75C13.7949 6.75 15.25 8.20507 15.25 10C15.25 11.7949 13.7949 13.25 12 13.25C10.2051 13.25 8.75 11.7949 8.75 10Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.77354 8.87739C4.11718 4.70845 7.60097 1.5 11.7841 1.5H12.216C16.3991 1.5 19.8829 4.70845 20.2265 8.87739C20.4115 11.122 19.7182 13.3508 18.2925 15.0943L13.4995 20.9561C12.7245 21.9039 11.2756 21.9039 10.5006 20.9561L5.70752 15.0943C4.28187 13.3508 3.58852 11.122 3.77354 8.87739ZM12 5.25C9.37665 5.25 7.25 7.37665 7.25 10C7.25 12.6234 9.37665 14.75 12 14.75C14.6234 14.75 16.75 12.6234 16.75 10C16.75 7.37665 14.6234 5.25 12 5.25Z"
      />
    </>
  ),
}

interface NavItem {
  key: keyof typeof ICON_PATHS
  /** i18n key — nav.<labelKey> */
  labelKey: string
  /** 이동 경로 (없으면 아직 미구현 — 비활성) */
  to?: string
}

const ITEMS: NavItem[] = [
  { key: 'home', labelKey: 'nav.home', to: '/main' },
  { key: 'calendar', labelKey: 'nav.calendar', to: '/calendar' },
  { key: 'explore', labelKey: 'nav.explore', to: '/explore' },
  { key: 'map', labelKey: 'nav.map', to: '/events' },
]

interface Props {
  /** 오른쪽 + 버튼 클릭 (이벤트 생성 등) */
  onCreate?: () => void
}

/**
 * 하단 탭 바 — 반투명 알약(pill) 위에 홈·캘린더·탐색·지도, 오른쪽에 원형 + 버튼.
 * 활성 탭은 현재 경로로 판별해 아이콘·라벨을 보라 액센트로 표시한다.
 */
export default function BottomNav({ onCreate }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const renderItem = (item: NavItem) => {
    const active = item.to ? pathname === item.to : false
    const label = t(item.labelKey)
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => item.to && navigate(item.to)}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        style={{
          width: 76,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          padding: '12px 0',
          cursor: 'pointer',
          color: active ? 'var(--color-accent)' : '#5c5c72',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          {ICON_PATHS[item.key]}
        </svg>
        <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '-0.02em' }}>
          {label}
        </span>
      </button>
    )
  }

  // background 는 blur 미지원 웹뷰에서도 알약이 보이도록 충분히 불투명하게 두고
  // (0.25 는 blur 없으면 거의 안 보임), backdrop-filter 는 향상 효과로만 유지.
  const pillStyle: CSSProperties & { WebkitBackdropFilter?: string } = {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 32,
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(255,255,255,0.6)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        zIndex: 10,
      }}
    >
      <div style={pillStyle}>{ITEMS.map(renderItem)}</div>

      <button
        type="button"
        onClick={onCreate}
        aria-label={t('nav.create')}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(124, 111, 240, 0.4)',
          WebkitTapHighlightColor: 'transparent',
          flexShrink: 0,
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
        </svg>
      </button>
    </nav>
  )
}
