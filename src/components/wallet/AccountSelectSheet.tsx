import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useMyAccount, useConnectAccount, useLinkableAccounts } from '@/hooks/account'
import type { LinkableAccount } from '@/hooks/account'
import { useAuthStore } from '@/store/auth'
import { isSameAccount } from '@/lib/account'
import BrandAvatar from '@/components/wallet/BrandAvatar'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * 충전 계좌 선택 바텀시트 (Figma 1037:12371).
 * 이미 동의를 마친 provider(마이데이터/Plaid) 계좌 전체를 보여주고,
 * 다른 계좌를 고르면 동의 화면 없이 바로 연동(connect)한다.
 * 하단 "계좌 변경하기"(새 계좌 추가/재동의)만 consent 플로우로 진입한다.
 */
export default function AccountSelectSheet({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const userType = useAuthStore((s) => s.userType)
  const consentPath = userType === 'FOREIGN' ? '/plaid/consent' : '/mydata/consent'

  const { data: accounts, isPending: listPending, error } = useLinkableAccounts(open)
  const { data: connected } = useMyAccount(open)
  const { mutate: connect, isPending: connecting } = useConnectAccount()
  const [pendingId, setPendingId] = useState<string | null>(null)

  if (!open) return null

  const selectable = (accounts ?? []).filter((a) => a.linkable)

  const isConnected = (a: LinkableAccount) =>
    !!connected && isSameAccount(connected.accountNumber, a.id)

  const handleSelect = (a: LinkableAccount) => {
    if (connecting) return
    if (isConnected(a)) {
      onClose()
      return
    }
    setPendingId(a.id)
    connect(a.id, {
      onSuccess: () => {
        setPendingId(null)
        onClose()
      },
      onError: () => setPendingId(null),
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('wallet.selectAccount')}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(17, 24, 39, 0.48)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        animation: 'moeum-sheet-fade 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#ffffff',
          borderRadius: '32px 32px 0 0',
          padding: '34px 20px max(20px, env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          animation: 'moeum-sheet-slideup 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* 타이틀 + 닫기 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 500, color: '#151519', letterSpacing: '-0.02em' }}>
            {t('wallet.selectAccount')}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('wallet.close')}
            style={{
              all: 'unset',
              display: 'flex',
              cursor: 'pointer',
              color: '#5c5c72',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* 계좌 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '48vh', overflowY: 'auto' }}>
          {listPending && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}

          {error && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: '#fff5f5',
                color: '#e03e3e',
                fontSize: 13.5,
                letterSpacing: '-0.01em',
              }}
            >
              {error.message}
            </div>
          )}

          {selectable.map((account) => {
            const selected = isConnected(account)
            const pending = pendingId === account.id && connecting
            const bankTitle = account.brand === 'HANA' ? '하나' : account.brand.short
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => handleSelect(account)}
                disabled={connecting}
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 16px',
                  borderRadius: 12,
                  cursor: connecting ? 'wait' : 'pointer',
                  background: '#ffffff',
                  border: `1px solid ${selected ? '#665bf7' : '#f2f2f6'}`,
                  boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                  opacity: connecting && !pending ? 0.55 : 1,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <BrandAvatar brand={account.brand} size={36} />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: '#151519',
                      letterSpacing: '-0.02em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bankTitle}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: '#2f2f3b',
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {account.displayNumber}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#151519',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  {pending ? t('wallet.connecting') : account.balanceText}
                </span>
              </button>
            )
          })}
        </div>

        {/* 계좌 변경하기 — 새 계좌 추가/재동의만 동의 화면으로 */}
        <button
          type="button"
          onClick={() => {
            onClose()
            navigate(consentPath)
          }}
          style={{
            all: 'unset',
            boxSizing: 'border-box',
            textAlign: 'center',
            padding: '12px 32px',
            borderRadius: 24,
            background: '#ffffff',
            boxShadow: '0 0 8px rgba(21,21,21,0.04)',
            border: '1px solid #f6f6fa',
            color: '#665bf7',
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('wallet.addAccount')}
        </button>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return <div style={{ height: 68, borderRadius: 12, background: '#f2f2f6', flexShrink: 0 }} />
}
