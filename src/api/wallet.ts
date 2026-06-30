import { apiClient, unwrap } from '@/api/client'
import type { WalletResponse, WalletTxRequest, WalletTxResponse } from '@/types/api'

export const walletApi = {
  /** 내 커스터디 지갑 조회 — 주소·예금토큰 잔액(캐시)·익스플로러 링크. 지갑 없으면 status 3000. */
  myWallet: () => unwrap<WalletResponse>(apiClient.get('/v1/users/me/wallet')),

  /** 충전(원→예금토큰) — mock 결제 후 HKRW 발행(mint). */
  charge: (userId: number, body: WalletTxRequest) =>
    unwrap<WalletTxResponse>(
      apiClient.post('/v1/users/me/wallet/charge', body, { params: { userId } }),
    ),

  /** 전환(예금토큰→원) — 토큰 소각(burn) 후 mock 지급. 잔액 부족 시 status 3014. */
  withdraw: (userId: number, body: WalletTxRequest) =>
    unwrap<WalletTxResponse>(
      apiClient.post('/v1/users/me/wallet/withdraw', body, { params: { userId } }),
    ),
}
