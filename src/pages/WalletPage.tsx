import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Copy,
  Check,
  ExternalLink,
  Wallet as WalletIcon,
  AlertCircle,
  Plus,
  ArrowDownToLine,
  X,
  CheckCircle2,
} from 'lucide-react'
import { useMyWallet, useChargeWallet, useWithdrawWallet } from '@/hooks/wallet'
import { useMyAccount, useAccountBalance } from '@/hooks/account'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { toErrorMessage } from '@/api/client'
import Button from '@/components/ui/Button'
import HanaLogo from '@/components/icons/HanaLogo'
import type {
  WalletResponse,
  WalletTxResponse,
  BankAccountResponse,
  MyDataBalanceResponse,
} from '@/types/api'

type TxMode = 'charge' | 'withdraw'

const BRAND_GRADIENT = 'linear-gradient(135deg, #5DD9D9 0%, #A78BFA 100%)'

/** 주소를 0x1234…abcd 형태로 줄임. */
function shortenAddress(address: string): string {
  if (address.length <= 13) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/**
 * 내 커스터디 지갑 화면.
 * 브랜드 그라데이션 잔액 카드 + 주소(복사) + 익스플로러 링크.
 * 지갑 미생성(3000)은 빈 상태로 안내한다.
 */
export default function WalletPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data: wallet, isPending, error, refetch, isFetching } = useMyWallet(!!accessToken)

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  const noWallet = error?.status === ErrorCode.WALLET_NOT_FOUND

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
          padding: '8px 20px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          boxSizing: 'border-box',
        }}
      >
        {/* 상단 바 */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로"
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 12,
              cursor: 'pointer',
              color: '#191f28',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={26} />
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#191f28',
              letterSpacing: '-0.02em',
            }}
          >
            내 지갑
          </h1>
        </header>

        {isPending && <WalletSkeleton />}

        {!isPending && noWallet && <EmptyWallet />}

        {!isPending && error && !noWallet && (
          <ErrorState message={`${error.message} (${error.status ?? '?'})`} onRetry={() => void refetch()} retrying={isFetching} />
        )}

        {!isPending && wallet && <WalletView wallet={wallet} />}
      </div>
    </main>
  )
}

function WalletView({ wallet }: { wallet: WalletResponse }) {
  const [copied, setCopied] = useState(false)
  const [txMode, setTxMode] = useState<TxMode | null>(null)
  const { data: account } = useMyAccount(true)
  const { data: balance, isPending: balancePending } = useAccountBalance(account?.accountNumber)

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.walletAddress)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 클립보드 미지원/거부 — 조용히 무시 (주소는 화면에 노출돼 있음) */
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 잔액 카드 */}
      <section
        style={{
          background: BRAND_GRADIENT,
          borderRadius: 24,
          padding: 28,
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          boxShadow: '0 12px 32px -8px rgba(167, 139, 250, 0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            opacity: 0.92,
            letterSpacing: '-0.01em',
          }}
        >
          <WalletIcon size={18} strokeWidth={2.4} />
          예금토큰 잔액
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          >
            {wallet.tokenBalance.toLocaleString('ko-KR')}
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, opacity: 0.92 }}>원</span>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2, letterSpacing: '-0.01em' }}>
          서버에 캐시된 잔액이에요
        </div>
      </section>

      {/* 충전 / 전환 */}
      <div style={{ display: 'flex', gap: 12 }}>
        <ActionButton
          icon={<Plus size={20} strokeWidth={2.6} />}
          label="충전"
          sublabel="원 → 토큰"
          onClick={() => setTxMode('charge')}
        />
        <ActionButton
          icon={<ArrowDownToLine size={20} strokeWidth={2.6} />}
          label="전환"
          sublabel="토큰 → 원"
          onClick={() => setTxMode('withdraw')}
        />
      </div>

      {/* 연동 계좌 + 잔액 (충전 시 출금되는 통장) */}
      <FundingAccount account={account} balance={balance} balancePending={balancePending} />

      {/* 지갑 정보 카드 */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 주소 + 복사 */}
        <button
          type="button"
          onClick={() => void copyAddress()}
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '18px 20px',
            cursor: 'pointer',
            borderRadius: 16,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>지갑 주소</span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#191f28',
                letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {shortenAddress(wallet.walletAddress)}
            </span>
          </div>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              fontSize: 13,
              fontWeight: 600,
              color: copied ? '#12b886' : '#8B5CF6',
              letterSpacing: '-0.01em',
            }}
          >
            {copied ? <Check size={16} strokeWidth={2.6} /> : <Copy size={16} strokeWidth={2.4} />}
            {copied ? '복사됨' : '복사'}
          </span>
        </button>

        <div style={{ height: 1, background: '#f2f4f6', margin: '0 20px' }} />

        {/* 익스플로러 링크 */}
        <a
          href={wallet.explorerUrl}
          target="_blank"
          rel="noreferrer noopener"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '18px 20px',
            textDecoration: 'none',
            borderRadius: 16,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>익스플로러</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em' }}>
              블록체인에서 보기
            </span>
          </div>
          <ExternalLink size={18} strokeWidth={2.2} color="#8b95a1" style={{ flexShrink: 0 }} />
        </a>
      </section>

      <p
        style={{
          margin: 0,
          padding: '0 4px',
          fontSize: 12,
          lineHeight: 1.6,
          color: '#adb5bd',
          letterSpacing: '-0.01em',
        }}
      >
        개인키는 안전하게 보관되며 외부에 노출되지 않습니다.
      </p>

      {txMode && (
        <TxModal
          mode={txMode}
          balance={wallet.tokenBalance}
          availableAmt={balance?.available_amt}
          onClose={() => setTxMode(null)}
        />
      )}
    </div>
  )
}

function ActionButton({
  icon,
  label,
  sublabel,
  onClick,
}: {
  icon: ReactNode
  label: string
  sublabel: string
  onClick: () => void
}) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        all: 'unset',
        flex: 1,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '18px 12px',
        background: '#ffffff',
        borderRadius: 18,
        cursor: 'pointer',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.12s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 22,
          background: '#f3f0ff',
          color: '#8B5CF6',
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em' }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: '#adb5bd', letterSpacing: '-0.01em' }}>{sublabel}</span>
    </button>
  )
}

/** 충전 계좌 + 마이데이터 잔액. 충전하면 이 통장에서 돈이 빠져나간다. */
function FundingAccount({
  account,
  balance,
  balancePending,
}: {
  account: BankAccountResponse | null | undefined
  balance: MyDataBalanceResponse | undefined
  balancePending: boolean
}) {
  const navigate = useNavigate()

  // 로딩
  if (account === undefined) {
    return <div style={{ height: 92, borderRadius: 20, background: '#eef0f3' }} />
  }

  // 미연동
  if (account === null) {
    return (
      <button
        type="button"
        onClick={() => navigate('/mydata/consent')}
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 20px',
          background: '#ffffff',
          borderRadius: 20,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em' }}>
            충전 계좌 연동하기
          </span>
          <span style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>
            계좌를 연동하면 바로 충전할 수 있어요
          </span>
        </div>
        <ChevronLeft size={20} color="#adb5bd" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
      </button>
    )
  }

  const isHana = account.accountType === 'HANA'

  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 13, color: '#8b95a1', fontWeight: 500, letterSpacing: '-0.01em' }}>
        충전 계좌
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isHana ? (
          <HanaLogo size={40} />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: '#0046FF',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '-0.02em',
              flexShrink: 0,
            }}
          >
            타행
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em' }}>
            {account.accountHolder}
          </span>
          <span
            style={{
              fontSize: 13,
              color: '#6b7684',
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {account.accountNumber}
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: '#f2f4f6' }} />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>출금 가능 금액</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#191f28',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {balancePending
            ? '조회 중…'
            : balance
              ? `${balance.available_amt.toLocaleString('ko-KR')}원`
              : '조회 실패'}
        </span>
      </div>
    </section>
  )
}

function WalletSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          height: 168,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #eef0f3 0%, #e6e8ec 100%)',
        }}
      />
      <div style={{ height: 132, borderRadius: 20, background: '#eef0f3' }} />
    </div>
  )
}

function EmptyWallet() {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: '#f3f0ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8B5CF6',
        }}
      >
        <WalletIcon size={28} strokeWidth={2.2} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em' }}>
        아직 지갑이 없어요
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.55,
          color: '#8b95a1',
          letterSpacing: '-0.01em',
          maxWidth: 260,
        }}
      >
        예금 토큰을 사용하려면 커스터디 지갑이 필요해요. 충전 계좌를 연동하면 자동으로 만들어집니다.
      </p>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string
  onRetry: () => void
  retrying: boolean
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <AlertCircle size={36} strokeWidth={2} color="#e03e3e" />
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#6b7684', letterSpacing: '-0.01em' }}>
          {message}
        </p>
      </div>
      <Button variant="solid" onClick={onRetry} disabled={retrying} style={{ width: 'auto', padding: '12px 28px' }}>
        {retrying ? '불러오는 중…' : '다시 시도'}
      </Button>
    </div>
  )
}

const QUICK_AMOUNTS = [10_000, 50_000, 100_000]

/**
 * 충전·전환 바텀시트.
 * 금액 입력 → mutation 호출 → 성공 시 tx 결과(해시·익스플로러) 화면.
 * 전환은 잔액(balance)을 상한으로 두고, 서버 잔액부족(3014)은 친절한 문구로 안내한다.
 */
function TxModal({
  mode,
  balance,
  availableAmt,
  onClose,
}: {
  mode: TxMode
  balance: number
  availableAmt: number | undefined
  onClose: () => void
}) {
  const [amountStr, setAmountStr] = useState('')
  const charge = useChargeWallet()
  const withdraw = useWithdrawWallet()
  const tx = mode === 'charge' ? charge : withdraw

  const amount = Number(amountStr)
  const overBalance = mode === 'withdraw' && amount > balance
  // 충전: 통장 출금 가능액 초과는 경고만(제출은 허용 — mock 결제). 잔액 정보 없으면 경고 안 함.
  const overAvailable = mode === 'charge' && availableAmt != null && amount > availableAmt
  const canSubmit = amount > 0 && !overBalance && !tx.isPending && !tx.isSuccess

  const title = mode === 'charge' ? '충전하기' : '원화로 전환'
  const desc = mode === 'charge' ? '원화를 예금토큰으로 충전해요' : '예금토큰을 원화로 되돌려요'

  const errorText = (() => {
    if (!tx.error) return null
    if (tx.error.status === ErrorCode.INSUFFICIENT_BALANCE) return '잔액이 부족해요. 금액을 다시 확인해 주세요.'
    return toErrorMessage(tx.error)
  })()

  const submit = () => {
    if (!canSubmit) return
    tx.mutate({ amount })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#ffffff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '20px 24px 32px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: '#191f28', letterSpacing: '-0.02em' }}>
              {title}
            </span>
            <span style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>{desc}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 18,
              cursor: 'pointer',
              color: '#8b95a1',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {tx.isSuccess ? (
          <TxResult mode={mode} result={tx.data} onClose={onClose} />
        ) : (
          <>
            {/* 금액 입력 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  padding: '14px 16px',
                  background: '#f9fafb',
                  borderRadius: 16,
                  border: `1.5px solid ${overBalance ? '#ffc9c9' : '#f2f4f6'}`,
                }}
              >
                <input
                  inputMode="numeric"
                  autoFocus
                  placeholder="0"
                  value={amountStr ? Number(amountStr).toLocaleString('ko-KR') : ''}
                  onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#191f28',
                    letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#8b95a1' }}>원</span>
              </div>

              {mode === 'withdraw' && (
                <span style={{ fontSize: 12, color: overBalance ? '#e03e3e' : '#adb5bd', letterSpacing: '-0.01em' }}>
                  {overBalance
                    ? '보유 잔액을 초과했어요'
                    : `전환 가능 ${balance.toLocaleString('ko-KR')}원`}
                </span>
              )}

              {mode === 'charge' && availableAmt != null && (
                <span style={{ fontSize: 12, color: overAvailable ? '#f08c00' : '#adb5bd', letterSpacing: '-0.01em' }}>
                  출금 가능 {availableAmt.toLocaleString('ko-KR')}원
                </span>
              )}
            </div>

            {/* 빠른 금액 */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {QUICK_AMOUNTS.map((v) => (
                <QuickChip
                  key={v}
                  label={`+${(v / 10_000).toLocaleString('ko-KR')}만`}
                  onClick={() => setAmountStr(String((Number(amountStr) || 0) + v))}
                />
              ))}
              {mode === 'withdraw' && balance > 0 && (
                <QuickChip label="전액" onClick={() => setAmountStr(String(balance))} />
              )}
            </div>

            {overAvailable && !errorText && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  background: '#fff9db',
                  borderRadius: 12,
                  color: '#e8590c',
                  fontSize: 13,
                  letterSpacing: '-0.01em',
                }}
              >
                <AlertCircle size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                통장 출금 가능액을 초과해요. 그대로 충전할까요?
              </div>
            )}

            {errorText && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  background: '#fff5f5',
                  borderRadius: 12,
                  color: '#e03e3e',
                  fontSize: 13,
                  letterSpacing: '-0.01em',
                }}
              >
                <AlertCircle size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                {errorText}
              </div>
            )}

            <Button variant="solid" onClick={submit} disabled={!canSubmit}>
              {tx.isPending ? '처리 중…' : title}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function QuickChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        padding: '9px 16px',
        background: '#f3f0ff',
        color: '#8B5CF6',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '-0.01em',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function TxResult({
  mode,
  result,
  onClose,
}: {
  mode: TxMode
  result: WalletTxResponse
  onClose: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 4 }}>
      <CheckCircle2 size={52} strokeWidth={2} color="#12b886" />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#191f28', letterSpacing: '-0.02em' }}>
          {mode === 'charge' ? '충전이 완료됐어요' : '전환이 완료됐어요'}
        </span>
        <span style={{ fontSize: 14, color: '#8b95a1', letterSpacing: '-0.01em' }}>
          잔액 {result.tokenBalance.toLocaleString('ko-KR')}원
        </span>
      </div>

      <a
        href={result.explorerTxUrl}
        target="_blank"
        rel="noreferrer noopener"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: '#8B5CF6',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
        }}
      >
        트랜잭션 보기
        <ExternalLink size={15} strokeWidth={2.4} />
      </a>

      <Button variant="solid" onClick={onClose} style={{ marginTop: 4 }}>
        확인
      </Button>
    </div>
  )
}
