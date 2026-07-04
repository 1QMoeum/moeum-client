import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/i18n'
import { useSwipeToDismiss } from '@/hooks/useSwipeToDismiss'

const PILL_BG_DEFAULT = '#F2F4F6'
const PILL_BG_PRESS = '#E5E8EB'

/**
 * 언어 선택 트리거 + 바텀시트.
 * 진입 언어는 i18n detector 가 결정(기본 ko) — 이 컴포넌트는 사후 변경 UI 만 담당.
 * 시트 타이틀은 두지 않음(옵션이 자기 언어로 노출돼 문맥이 자명함).
 */
export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'ko') as LanguageCode
  const currentLabel = SUPPORTED_LANGUAGES.find((l) => l.code === current)?.label ?? '한국어'
  const [open, setOpen] = useState(false)

  const handleSelect = (code: LanguageCode) => {
    if (code !== current) void i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          all: 'unset',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '9px 12px 9px 11px',
          fontSize: 14,
          fontWeight: 600,
          color: '#4E5968',
          letterSpacing: '-0.02em',
          background: PILL_BG_DEFAULT,
          borderRadius: 999,
          cursor: 'pointer',
          lineHeight: 1,
          transition: 'background 0.15s ease',
        }}
        onPointerDown={(e) => {
          e.currentTarget.style.background = PILL_BG_PRESS
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.background = PILL_BG_DEFAULT
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.background = PILL_BG_DEFAULT
        }}
      >
        <GlobeIcon />
        {currentLabel}
        <ChevronDown />
      </button>
      {open && (
        <LanguageSheet current={current} onSelect={handleSelect} onDismiss={() => setOpen(false)} />
      )}
    </>
  )
}

function LanguageSheet({
  current,
  onSelect,
  onDismiss,
}: {
  current: LanguageCode
  onSelect: (code: LanguageCode) => void
  onDismiss: () => void
}) {
  const swipe = useSwipeToDismiss({ onDismiss })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Language"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.48)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        WebkitTapHighlightColor: 'transparent',
        animation: 'moeum-lang-fade 0.2s ease',
      }}
      onClick={onDismiss}
    >
      <div
        {...swipe.handlers}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#FFFFFF',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '10px 12px max(20px, env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          animation: 'moeum-lang-slideup 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          ...swipe.style,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 36,
            height: 4,
            background: '#E5E8EB',
            borderRadius: 999,
            margin: '0 auto 6px',
          }}
        />
        <ul
          role="listbox"
          aria-label="Language"
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const selected = lang.code === current
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSelect(lang.code)}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    width: '100%',
                    minHeight: 56,
                    padding: '14px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    borderRadius: 14,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: selected ? 700 : 500,
                    color: selected ? '#5B4CE6' : '#191F28',
                    letterSpacing: '-0.02em',
                    background: 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.style.background = '#F4F6F8'
                  }}
                  onPointerUp={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span>{lang.label}</span>
                  {selected && <CheckIcon />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <style>{`
        @keyframes moeum-lang-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes moeum-lang-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6B7684"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B0B8C1"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ marginLeft: 1 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5B4CE6"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
