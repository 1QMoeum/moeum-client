import { apiClient, unwrap } from '@/api/client'
import type { WalletResponse } from '@/types/api'

export const walletApi = {
  /** 내 커스터디 지갑 조회 — 주소·예금토큰 잔액(캐시)·익스플로러 링크. 지갑 없으면 status 3000. */
  myWallet: () => unwrap<WalletResponse>(apiClient.get('/v1/users/me/wallet')),
}
