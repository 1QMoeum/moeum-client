import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { mydataApi } from '@/api/mydata'
import { accountApi } from '@/api/account'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'
import HanaLogo from '@/components/icons/HanaLogo'
import type { MyDataAccountListItem } from '@/types/api'

type AccountWithBalance = MyDataAccountListItem & { balance_amt: number }

interface BankBrand {
  short: string
  display: string
  color: string
  fg: string
}

/**
 * 마이데이터 계좌 목록 + 잔액 + 선택.
 * Toss In-app Design System 톤 차용 — 카드 listItem, 우측 큰 잔액, sticky CTA.
 */
export default function MyDataAccountsPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [accounts, setAccounts] = useState<AccountWithBalance[] | null>(null)
  const [selectedNum, setSelectedNum] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const list = await mydataApi.accounts()
        const balances = await Promise.all(
          list.account_list.map((a) => mydataApi.balance(a.account_num)),
        )
        if (cancelled) return
        const merged = list.account_list.map((a, i) => ({
          ...a,
          balance_amt: balances[i].balance_amt,
        }))
        setAccounts(merged)
      } catch (e) {
        if (cancelled) return
        if (e instanceof ApiError) {
          setError(`${e.message} (${e.status ?? '?'})`)
        } else if (e instanceof Error) {
          setError(e.message)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  const handleConnect = async () => {
    if (!selectedNum) return
    setError(null)
    setSubmitting(true)
    try {
      await accountApi.connect(selectedNum)
      navigate('/done', { replace: true })
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`${e.message} (${e.status ?? '?'})`)
      } else if (e instanceof Error) {
        setError(e.message)
      }
      setSubmitting(false)
    }
  }

  const count = accounts?.length ?? 0

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '40px 20px 120px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              color: '#191f28',
            }}
          >
            예금 토큰 충전 계좌를
            <br />
            선택해주세요
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.5,
              color: '#6b7684',
              letterSpacing: '-0.01em',
            }}
          >
            예금 토큰 충전·환불에 사용됩니다{count > 0 ? ` · 전체 ${count}개` : ''}
          </p>
        </header>

        {accounts === null && !error && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: '#8b95a1',
              fontSize: 14,
              background: '#ffffff',
              borderRadius: 16,
              letterSpacing: '-0.01em',
            }}
          >
            계좌를 불러오는 중…
          </div>
        )}

        {accounts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accounts.map((a) => (
              <AccountCard
                key={a.account_num}
                item={a}
                selected={selectedNum === a.account_num}
                onClick={() => setSelectedNum(a.account_num)}
              />
            ))}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 16,
              background: '#fff5f5',
              color: '#e03e3e',
              borderRadius: 12,
              fontSize: 14,
              letterSpacing: '-0.01em',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#f9fafb',
          padding: '12px 20px max(24px, env(safe-area-inset-bottom))',
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Button variant="solid" onClick={handleConnect} disabled={!selectedNum || submitting}>
          {submitting ? '등록 중…' : selectedNum ? '이 계좌로 등록' : '계좌를 선택해주세요'}
        </Button>
      </footer>
    </main>
  )
}

const BANK_BRAND: Record<string, BankBrand> = {
  '하나원큐': { short: '하나', display: '하나은행', color: '#008B84', fg: '#ffffff' },
  'S은행': { short: 'S', display: 'S은행', color: '#0046FF', fg: '#ffffff' },
  'K은행': { short: 'K', display: 'K은행', color: '#FFBC00', fg: '#191f28' },
  'N은행': { short: 'N', display: 'N은행', color: '#04AA59', fg: '#ffffff' },
}

function resolveBrand(accountName: string): BankBrand {
  for (const key of Object.keys(BANK_BRAND)) {
    if (accountName.includes(key)) return BANK_BRAND[key]
  }
  return { short: '·', display: '계좌', color: '#b0b8c1', fg: '#ffffff' }
}

function AccountCard({
  item,
  selected,
  onClick,
}: {
  item: AccountWithBalance
  selected: boolean
  onClick: () => void
}) {
  const isLinkable = item.account_type === '1001'
  const brand = resolveBrand(item.account_name)
  const [pressed, setPressed] = useState(false)

  return (
    <button
      type="button"
      onClick={isLinkable ? onClick : undefined}
      disabled={!isLinkable}
      onPointerDown={() => isLinkable && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        all: 'unset',
        cursor: isLinkable ? 'pointer' : 'not-allowed',
        opacity: isLinkable ? 1 : 0.45,
        textAlign: 'left',
        padding: 20,
        background: '#ffffff',
        border: selected ? '1.5px solid #A78BFA' : '1.5px solid transparent',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'border-color 0.15s ease, transform 0.12s ease',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {brand.short === '하나' ? (
          <HanaLogo size={40} />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: brand.color,
              color: brand.fg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: brand.short.length > 1 ? 12 : 16,
              letterSpacing: '-0.02em',
              flexShrink: 0,
            }}
          >
            {brand.short}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: '#8b95a1',
              letterSpacing: '-0.01em',
            }}
          >
            {brand.display}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#191f28',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.account_name}
          </div>
        </div>
        {selected && (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #5DD9D9 0%, #A78BFA 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ✓
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingLeft: 52,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: '#8b95a1',
            letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {item.account_num}
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#191f28',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {item.balance_amt.toLocaleString('ko-KR')}원
        </span>
      </div>

      {!isLinkable && (
        <div
          style={{
            fontSize: 13,
            color: '#e03e3e',
            paddingLeft: 52,
            letterSpacing: '-0.01em',
          }}
        >
          예적금 계좌는 예금 토큰 충전 계좌로 등록할 수 없습니다
        </div>
      )}
    </button>
  )
}