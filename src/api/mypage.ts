import { apiClient, unwrap } from '@/api/client'
import type { MyPageResponse } from '@/types/mypage'

export const myPageApi = {
  /** 마이페이지 조회 — 내 정보·지갑·연동 계좌·카운트·최근 참여 이벤트를 한 번에. */
  get: (userId: number) =>
    unwrap<MyPageResponse>(apiClient.get('/v1/users/me/mypage', { params: { userId } })),
}
