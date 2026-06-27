import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAccessToken } from '@/api/client'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (access: string, refresh: string) => void
  clearTokens: () => void
}

/**
 * refresh 는 localStorage 에 persist (디바이스 식별자 겸용 — 다음 방문에 PIN 로그인 가능).
 * access 는 메모리만 (페이지 새로고침 시 refresh 로 재발급).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (accessToken, refreshToken) => {
        setAccessToken(accessToken)
        set({ accessToken, refreshToken })
      },
      clearTokens: () => {
        setAccessToken(null)
        set({ accessToken: null, refreshToken: null })
      },
    }),
    {
      name: 'moeum-auth',
      // access 는 persist 에서 제외 — 짧고 자주 바뀜
      partialize: (s) => ({ refreshToken: s.refreshToken }),
      onRehydrateStorage: () => (state) => {
        // 새로고침 후 access 가 비어있을 때 refresh 로 자동 갱신은
        // 라우터 가드/AuthBootstrap 에서 처리 (Task #7).
        if (state?.accessToken) setAccessToken(state.accessToken)
      },
    },
  ),
)