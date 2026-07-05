import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import BankAvatar from '@/components/wallet/BankAvatar'
import type { BankAccountResponse } from '@/types/api'

interface Props {
  open: boolean
  accounts: BankAccountResponse[]
  /** accountId → 표시용 잔액 문자열 (예: "320,000원"). 없으면 잔액 줄 생략. */
  balances?: Record<number, string>
  selectedId: number | null
  onSelect: (account: BankAccountResponse) => void
  /** "계좌 변경하기" — 연동/재연동 플로우로 이동. */
  onManage: () => void
  onClose: () => void
}

/**
 * 충전·전환 시 출금/입금 계좌를 고르는 선택 모달.
 * 현재 백엔드는 1개의 연동 계좌만 내려주므로 목록은 보통 한 항목이지만,
 * 다계좌를 대비해 배열을 그대로 렌더한다.
 */
export default function AccountSelectSheet({
  open,
  accounts,
  balances,
  selectedId,
  onSelect,
  onManage,
  onClose,
}: Props) {
  const { t } = useTranslation()
  if (!open) return null

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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'moeum-sheet-fade 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#ffffff',
          borderRadius: 20,
          padding: 20,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'moeum-pop-in 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#151519', letterSpacing: '-0.02em' }}>
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
              color: '#86869f',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {accounts.map((account) => {
            const selected = account.accountId === selectedId
            const balanceText = balances?.[account.accountId]
            return (
              <button
                key={account.accountId}
                type="button"
                onClick={() => onSelect(account)}
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  background: selected ? '#f6f5ff' : '#fafafa',
                  border: `1.5px solid ${selected ? '#665bf7' : 'transparent'}`,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <BankAvatar account={account} size={36} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#151519',
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {account.accountHolder}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: '#86869f',
                      letterSpacing: '-0.01em',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {account.accountNumber}
                  </span>
                </div>
                {balanceText && (
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#151519',
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                    }}
                  >
                    {balanceText}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onManage}
          style={{
            all: 'unset',
            boxSizing: 'border-box',
            textAlign: 'center',
            padding: '14px',
            borderRadius: 14,
            background: '#fafafa',
            color: '#665bf7',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('wallet.changeAccount')}
        </button>
      </div>
    </div>
  )
}
