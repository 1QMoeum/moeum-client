import { Navigate, useNavigate } from 'react-router-dom'
import { useLogout } from '@/hooks/auth'
import { useAuthStore } from '@/store/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'

/**
 * 인증 완료 후 임시 랜딩. 다음 PR에서 마이페이지/홈으로 교체.
 * 디버그 용도로 토큰 일부 + 로그아웃 버튼 노출.
 */
export default function DonePage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const { mutate: logout, isPending } = useLogout()

  if (!accessToken || !refreshToken) {
    return <Navigate to="/" replace />
  }

  const mask = (t: string) => `${t.slice(0, 16)}…${t.slice(-8)}`

  // logout 은 멱등 — 서버 실패해도 훅의 onSettled 에서 토큰 클리어 후 홈으로
  const handleLogout = () => {
    logout(refreshToken, {
      onSettled: () => navigate('/', { replace: true }),
    })
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>로그인 완료</h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        다음 단계(계좌 연동·지갑 생성)는 다음 PR.
      </p>

      <section
        style={{
          padding: 16,
          background: '#f9fafb',
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div>
          <strong>access</strong>: {mask(accessToken)}
        </div>
        <div>
          <strong>refresh</strong>: {mask(refreshToken)}
        </div>
      </section>

      <Button onClick={handleLogout} disabled={isPending} style={{ background: '#ef4444' }}>
        {isPending ? '로그아웃 중…' : '로그아웃'}
      </Button>
    </Screen>
  )
}
