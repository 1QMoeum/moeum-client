import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLogout } from '@/hooks/auth'
import { accountApi } from '@/api/account'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'
import HanaLogo from '@/components/icons/HanaLogo'
import type { BankAccountResponse } from '@/types/api'

/**
 * 인증 + (선택적으로) 계좌 연동 후 임시 랜딩.
 * 연동 계좌 유무에 따라 메시지/액션 분기.
 *
 *  - undefined: 로딩
 *  - null: 미연동 → "로그인 완료" + 계좌 연동하러 가기
 *  - BankAccountResponse: 연동됨 → "연동 완료" + 계좌 카드
 */
export default function DonePage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const { mutate: logout, isPending } = useLogout()

  const [account, setAccount] = useState<BankAccountResponse | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void accountApi
      .myAccount()
      .then((a) => {
        if (!cancelled) setAccount(a)
      })
      .catch(() => {
        if (!cancelled) setAccount(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!accessToken || !refreshToken) {
    return <Navigate to="/" replace />
  }

  const handleLogout = () => {
    logout(refreshToken, {
      onSettled: () => navigate('/', { replace: true }),
    })
  }

  const isLinked = account !== null && account !== undefined

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#ffffff',
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
          padding: '40px 24px 120px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              color: '#191f28',
            }}
          >
            {account === undefined ? '확인 중…' : isLinked ? '연동 완료' : '로그인 완료'}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.5,
              color: '#6b7684',
              letterSpacing: '-0.01em',
              whiteSpace: 'pre-line',
            }}
          >
            {account === undefined
              ? '계좌 연동 상태를 확인하고 있어요.'
              : isLinked
                ? '예금 토큰 충전 계좌가 등록되어 있어요.\n내 커스터디 지갑을 확인해 보세요.'
                : '아직 예금 토큰 충전 계좌를 등록하지 않았어요.'}
          </p>
        </header>

        {isLinked && account && <LinkedAccountCard account={account} />}
      </div>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#ffffff',
          padding: '12px 24px max(24px, env(safe-area-inset-bottom))',
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {account === null && (
          <>
            <Button variant="solid" onClick={() => navigate('/mydata/consent')}>계좌 연동하러 가기</Button>
            <button
              type="button"
              onClick={() => navigate('/main')}
              style={{
                all: 'unset',
                width: '100%',
                padding: '12px 0',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#6b7684',
                letterSpacing: '-0.01em',
              }}
            >
              나중에 하고 시작하기
            </button>
          </>
        )}
        {isLinked && (
          <>
            <Button variant="solid" onClick={() => navigate('/main')}>시작하기</Button>
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              style={{
                all: 'unset',
                width: '100%',
                padding: '12px 0',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#6b7684',
                letterSpacing: '-0.01em',
              }}
            >
              내 지갑 보기
            </button>
            <button
              type="button"
              onClick={() => navigate('/mydata/consent')}
              style={{
                all: 'unset',
                width: '100%',
                padding: '12px 0',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#6b7684',
                letterSpacing: '-0.01em',
              }}
            >
              다른 계좌로 변경
            </button>
          </>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          style={{
            all: 'unset',
            width: '100%',
            padding: '12px 0',
            textAlign: 'center',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: '#8b95a1',
            letterSpacing: '-0.01em',
            opacity: isPending ? 0.5 : 1,
          }}
        >
          {isPending ? '로그아웃 중…' : '로그아웃'}
        </button>
      </footer>
    </main>
  )
}

function LinkedAccountCard({ account }: { account: BankAccountResponse }) {
  const isHana = account.accountType === 'HANA'

  return (
    <section
      style={{
        padding: 20,
        background: '#f9fafb',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: '#8b95a1',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        등록된 예금 토큰 충전 계좌
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
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#191f28',
              letterSpacing: '-0.01em',
            }}
          >
            {account.accountHolder}
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#6b7684',
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {account.accountNumber}
          </div>
        </div>
      </div>
    </section>
  )
}