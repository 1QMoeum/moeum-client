import type { LucideIcon } from 'lucide-react'
import { Calendar, Home, MapPin, Plus, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavItem {
  key: string
  label: string
  icon: LucideIcon
  /** 이동 경로 (없으면 아직 미구현 — 비활성) */
  to?: string
}

const ITEMS: NavItem[] = [
  { key: 'home', label: '홈', icon: Home, to: '/main' },
  { key: 'calendar', label: '캘린더', icon: Calendar },
  { key: 'explore', label: '탐색', icon: Search, to: '/explore' },
  { key: 'map', label: '지도', icon: MapPin, to: '/events' },
]

interface Props {
  /** 가운데 + 버튼 클릭 (이벤트 생성 등) */
  onCreate?: () => void
}

/**
 * 하단 탭 바 — 흰색 라운드 카드 위에 홈·캘린더·[+]·탐색·지도.
 * 활성 탭은 현재 경로로 판별, 아이콘만 보라 액센트(라벨은 검정 유지).
 */
export default function BottomNav({ onCreate }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const left = ITEMS.slice(0, 2)
  const right = ITEMS.slice(2)

  const renderItem = (item: NavItem) => {
    const active = item.to ? pathname === item.to : false
    const Icon = item.icon
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => item.to && navigate(item.to)}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
          background: 'none',
          border: 'none',
          padding: '6px 0',
          cursor: 'pointer',
          color: active ? 'var(--color-accent)' : '#191f28',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* 선형 유지 — 선택된 탭은 선 색만 보라색 */}
        <Icon size={25} strokeWidth={2} fill="none" />
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#191f28', letterSpacing: '-0.01em' }}>
          {item.label}
        </span>
      </button>
    )
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -6px 24px rgba(0,0,0,.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 12px calc(10px + env(safe-area-inset-bottom))',
        zIndex: 10,
      }}
    >
      {left.map(renderItem)}

      {/* 가운데 FAB */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onCreate}
          aria-label="이벤트 만들기"
          style={{
            width: 58,
            height: 58,
            marginTop: -10,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(124, 111, 240, 0.45)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus size={28} strokeWidth={2.6} />
        </button>
      </div>

      {right.map(renderItem)}
    </nav>
  )
}
