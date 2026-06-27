import { useEffect, useRef, useState, type ReactNode } from 'react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

/**
 * 앱 진입 시 1회 실행되는 인증 부트스트랩.
 *
 * access 는 메모리에만 두므로 새로고침하면 사라진다. 이때 persist 된 refresh 가
 * 있으면 그걸로 access 를 재발급해 세션을 복원한다. (refresh 도 실패하면 토큰 클리어)
 * 복원이 끝나기 전까지는 자식 렌더를 보류해, 보호 페이지가 잘못 리다이렉트하는 걸 막는다.
 */
export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setTokens = useAuthStore((s) => s.setTokens)
  const clearTokens = useAuthStore((s) => s.clearTokens)

  // refresh 가 없거나(복원할 게 없음) access 가 이미 있으면 바로 준비 완료
  const [ready, setReady] = useState(() => !refreshToken || !!accessToken)
  const started = useRef(false)

  useEffect(() => {
    if (ready || started.current) return
    started.current = true // StrictMode 이중 호출 가드 — refresh 재발급은 1회만
    authApi
      .refresh(refreshToken!)
      .then((t) => setTokens(t.accessToken, t.refreshToken))
      .catch(() => clearTokens())
      .finally(() => setReady(true))
  }, [ready, refreshToken, setTokens, clearTokens])

  if (!ready) return null
  return <>{children}</>
}
