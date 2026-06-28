import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, Copy, Check, ExternalLink, Wallet as WalletIcon, AlertCircle } from 'lucide-react'
import { useMyWallet } from '@/hooks/wallet'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import Button from '@/components/ui/Button'
import type { WalletResponse } from '@/types/api'

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
    </div>
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
