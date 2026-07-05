import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/client'
import { plaidApi } from '@/api/plaid'
import { accountApi } from '@/api/account'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'
import { resolvePlaidBrand } from '@/constants/bankBrand'
import type { PlaidAccountListItem } from '@/types/api'

/**
 * Plaid 계좌 목록 + 잔액 + 선택 (외국인).
 * MyDataAccountsPage 의 외국인 미러. 서버가 이미 balances 를 목록 응답에 포함해 주므로
 * mydata 처럼 계좌별 잔액을 별도 호출할 필요는 없지만, 상세/카드 진입 시 최신 잔액이
 * 필요한 시나리오를 대비해 잔액 API 는 준비되어 있다.
 * 연동 가능: type='depository' AND subtype IN (checking, savings). 신용카드는 표시하되 선택 불가.
 */
export default function PlaidAccountsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [accounts, setAccounts] = useState<PlaidAccountListItem[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await plaidApi.accounts()
        if (cancelled) return
        setAccounts(res.accounts)
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
    if (!selectedId) return
    setError(null)
    setSubmitting(true)
    try {
      await accountApi.connect(selectedId)
      navigate('/onboarding', { replace: true })
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
            {t('plaid.accounts.title')}
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
            {t('plaid.accounts.subtitle')}
            {count > 0 ? ` · ${t('plaid.accounts.totalCount', { count })}` : ''}
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
            {t('plaid.accounts.loading')}
          </div>
        )}

        {accounts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accounts.map((a) => (
              <AccountCard
                key={a.account_id}
                item={a}
                selected={selectedId === a.account_id}
                onClick={() => setSelectedId(a.account_id)}
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
        <Button variant="solid" onClick={handleConnect} disabled={!selectedId || submitting}>
          {submitting
            ? t('plaid.accounts.submitting')
            : selectedId
              ? t('plaid.accounts.submit')
              : t('plaid.accounts.selectPrompt')}
        </Button>
      </footer>
    </main>
  )
}

function AccountCard({
  item,
  selected,
  onClick,
}: {
  item: PlaidAccountListItem
  selected: boolean
  onClick: () => void
}) {
  const isLinkable =
    item.type === 'depository' && (item.subtype === 'checking' || item.subtype === 'savings')
  const brand = resolvePlaidBrand(item.institution_id, item.name)
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
            fontSize: 16,
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}
        >
          {brand.short}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>
            {item.name}
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
            •••• {item.mask}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderTop: '1px solid #f2f4f6',
          paddingTop: 12,
        }}
      >
        <span style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>
          {item.subtype}
        </span>
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#191f28',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}
        >
          {item.balances.available.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          {item.balances.iso_currency_code}
        </span>
      </div>
    </button>
  )
}
