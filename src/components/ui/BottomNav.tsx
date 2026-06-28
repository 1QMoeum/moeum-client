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
  { key: 'explore', label: '탐색', icon: Search },
  { key: 'map', label: '지도', icon: MapPin, to: '/events' },
]

interface Props {
  /** 가운데 + 버튼 클릭 (이벤트 생성 등) */
  onCreate?: () => void
}

/**
 * 하단 탭 바. 가운데 보라색 + FAB 를 중심으로 좌2 / 우2 배치.
 * 활성 탭은 현재 경로로 판별, 보라 액센트로 표시.
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
          gap: 4,
          background: 'none',
          border: 'none',
          padding: '8px 0',
          cursor: 'pointer',
          color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Icon size={24} strokeWidth={active ? 2.4 : 2} fill={active ? 'currentColor' : 'none'} />
        <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{item.label}</span>
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
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px calc(8px + env(safe-area-inset-bottom))',
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
            width: 56,
            height: 56,
            marginTop: -24,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            color: '#fff',
            border: '4px solid var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(124, 111, 240, 0.4)',
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
