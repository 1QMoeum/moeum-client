import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { ApiError } from '@/api/client'
import { mydataApi } from '@/api/mydata'
import { useConnectAccount } from '@/hooks/account'
import { useAuthStore } from '@/store/auth'
import OnboardingLayout from '@/components/onboarding/OnboardingLayout'
import StepHeader from '@/components/onboarding/StepHeader'
import CtaButton from '@/components/onboarding/CtaButton'
import AccountCard from '@/components/onboarding/AccountCard'
import BrandAvatar from '@/components/wallet/BrandAvatar'
import { resolveDomesticBrand } from '@/constants/bankBrand'
import { maskAccountNum } from '@/lib/account'
import type { MyDataAccountListItem } from '@/types/api'

type AccountWithBalance = MyDataAccountListItem & { balance_amt: number }

/**
 * 온보딩 02 — 마이데이터 계좌 목록 + 잔액 + 선택.
 * 마이데이터는 국내 전용 플로우라 문구는 한국어 고정.
 */
export default function MyDataAccountsPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const userType = useAuthStore((s) => s.userType)

  const [accounts, setAccounts] = useState<AccountWithBalance[] | null>(null)
  const [selectedNum, setSelectedNum] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { mutate: connect, isPending: submitting, error: connectError } = useConnectAccount()

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
          setLoadError(`${e.message} (${e.status ?? '?'})`)
        } else if (e instanceof Error) {
          setLoadError(e.message)
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
  // 외국인은 MyData 대신 Plaid 흐름을 사용.
  if (userType === 'FOREIGN') {
    return <Navigate to="/plaid/accounts" replace />
  }

  const handleConnect = () => {
    if (!selectedNum) return
    connect(selectedNum, {
      onSuccess: () => navigate('/onboarding', { replace: true }),
    })
  }

  const count = accounts?.length ?? 0
  const error = loadError ?? (connectError ? `${connectError.message} (${connectError.status ?? '?'})` : null)

  return (
    <OnboardingLayout
      title="계좌 연동하기"
      onBack={() => navigate(-1)}
      footer={
        <CtaButton
          label={submitting ? '등록 중…' : '다음'}
          disabled={!selectedNum || submitting}
          onClick={handleConnect}
        />
      }
    >
      <StepHeader step="02" title={'예금토큰으로 충전할\n계좌를 선택해주세요'} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', color: '#222229' }}>
            연결 계좌
          </span>
          {count > 0 && (
            <span style={{ fontSize: 14, letterSpacing: '-0.02em', color: '#27282c' }}>
              전체 {count}개
            </span>
          )}
        </div>

        {accounts === null && !error && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: '#86869f',
              fontSize: 14,
              background: '#ffffff',
              borderRadius: 12,
              boxShadow: '0 0 8px rgba(21,21,21,0.04)',
              letterSpacing: '-0.01em',
            }}
          >
            계좌를 불러오는 중…
          </div>
        )}

        {accounts?.map((a) => {
          const brand = resolveDomesticBrand(a.account_name)
          const isLinkable = a.account_type === '1001'
          const selected = selectedNum === a.account_num
          return (
            <AccountCard
              key={a.account_num}
              logo={<BrandAvatar brand={brand.short === '하나' ? 'HANA' : brand} size={40} />}
              name={a.account_name}
              subtext={`${brand.short} ${maskAccountNum(a.account_num)}`}
              balanceText={`${a.balance_amt.toLocaleString('ko-KR')}원`}
              trailing={
                <Check
                  size={24}
                  strokeWidth={2.5}
                  color={selected ? '#665bf7' : '#d9d9e2'}
                  aria-hidden
                />
              }
              onClick={() => setSelectedNum(a.account_num)}
              disabled={!isLinkable}
              note={isLinkable ? undefined : '예적금 계좌는 예금 토큰 충전 계좌로 등록할 수 없습니다'}
            />
          )
        })}

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
      </section>
    </OnboardingLayout>
  )
}

