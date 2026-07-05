import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { myPageApi } from '@/api/mypage'
import { getUserIdFromToken } from '@/lib/jwt'
import { useAuthStore } from '@/store/auth'
import type { MyPageResponse } from '@/types/mypage'

/**
 * 마이페이지 조회 (내 정보·지갑·카운트·최근 참여 이벤트). userId 는
 * accessToken(JWT sub)에서 파생하므로 로그인 전에는 비활성화된다.
 */
export function useMyPage(enabled = true) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = getUserIdFromToken(accessToken)
  return useQuery<MyPageResponse, ApiError>({
    queryKey: ['mypage', userId],
    enabled: enabled && userId != null,
    staleTime: 30_000,
    queryFn: () => myPageApi.get(userId as number),
  })
}
