import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAccessToken } from '@/api/client'

export type UserType = 'DOMESTIC' | 'FOREIGN'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userType: UserType | null
  /** 사용자 이름 — KYC/가입 시점에 저장, 간편 로그인 인사말에 사용 (persist) */
  userName: string | null
  /** 온보딩 화면을 이미 본 디바이스인지 — 첫 로그인에만 온보딩을 보여주기 위해 persist */
  hasOnboarded: boolean
  setTokens: (access: string, refresh: string) => void
  setUserType: (userType: UserType) => void
  setUserName: (name: string) => void
  setHasOnboarded: () => void
  clearTokens: () => void
}

/**
 * refresh 는 localStorage 에 persist (디바이스 식별자 겸용 — 다음 방문에 PIN 로그인 가능).
 * access 는 메모리만 (페이지 새로고침 시 refresh 로 재발급).
 * userType 은 진입 시점(HomePage 국내/외국 선택)에서 저장 — 이후 계좌 연동 라우팅,
 * 잔액 조회 provider 분기(mydata vs plaid)에 사용된다. 재방문 세션 복원을 위해 persist.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userType: null,
      userName: null,
      hasOnboarded: false,
      setTokens: (accessToken, refreshToken) => {
        setAccessToken(accessToken)
        set({ accessToken, refreshToken })
      },
      setUserType: (userType) => set({ userType }),
      setUserName: (userName) => set({ userName }),
      setHasOnboarded: () => set({ hasOnboarded: true }),
      clearTokens: () => {
        setAccessToken(null)
        // 로그아웃/토큰 초기화 = 다른 사용자가 쓸 수 있으므로 온보딩 이력·이름도 초기화
        set({ accessToken: null, refreshToken: null, userType: null, userName: null, hasOnboarded: false })
      },
    }),
    {
      name: 'moeum-auth',
      // access 는 persist 에서 제외 — 짧고 자주 바뀜
      partialize: (s) => ({
        refreshToken: s.refreshToken,
        userType: s.userType,
        userName: s.userName,
        hasOnboarded: s.hasOnboarded,
      }),
      onRehydrateStorage: () => (state) => {
        // 새로고침 후 access 가 비어있을 때 refresh 로 자동 갱신은
        // 라우터 가드/AuthBootstrap 에서 처리 (Task #7).
        if (state?.accessToken) setAccessToken(state.accessToken)
      },
    },
  ),
)
