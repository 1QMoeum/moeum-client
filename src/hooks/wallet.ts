import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { walletApi } from '@/api/wallet'
import { getUserIdFromToken } from '@/lib/jwt'
import { useAuthStore } from '@/store/auth'
import type { WalletResponse, WalletTxResponse } from '@/types/api'

const WALLET_KEY = ['wallet', 'me'] as const

/**
 * 내 커스터디 지갑 조회. 지갑 미생성(status 3000)은 정상 흐름의 빈 상태이므로
 * 페이지에서 error.status === ErrorCode.WALLET_NOT_FOUND 로 분기한다.
 */
export function useMyWallet(enabled: boolean) {
  return useQuery<WalletResponse, ApiError>({
    queryKey: WALLET_KEY,
    enabled,
    staleTime: 30_000,
    retry: false,
    queryFn: () => walletApi.myWallet(),
  })
}

/** charge/withdraw 의 mutation 변수 (금액만 받고, idempotencyKey 는 훅이 생성). */
type WalletTxVars = { amount: number }

/**
 * 성공 응답의 갱신된 잔액을 지갑 캐시에 반영.
 * 트랜잭션 응답의 tokenBalance 가 처리 후 확정 잔액이므로 이 값을 그대로 쓴다.
 * 즉시 invalidate 하면 안 된다 — 지갑 조회(/v1/users/me/wallet)의 잔액은 서버 DB 캐시값이라
 * 온체인 반영 전의 옛 잔액이 돌아와 방금 쓴 확정값을 덮어쓴다.
 */
function useApplyTxResult() {
  const qc = useQueryClient()
  return (res: WalletTxResponse) => {
    qc.setQueryData<WalletResponse>(WALLET_KEY, (prev) =>
      prev ? { ...prev, tokenBalance: res.tokenBalance } : prev,
    )
  }
}

/**
 * 충전(원→예금토큰). userId 는 accessToken(JWT sub)에서 파생한다.
 * 매 호출마다 새 idempotencyKey 를 발급하고, 성공 시 잔액 캐시를 갱신한다.
 */
export function useChargeWallet() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const applyResult = useApplyTxResult()
  return useMutation<WalletTxResponse, ApiError, WalletTxVars>({
    mutationFn: async ({ amount }) => {
      const userId = getUserIdFromToken(accessToken)
      if (userId == null) {
        throw new ApiError(null, '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
      }
      return walletApi.charge(userId, { amount, idempotencyKey: crypto.randomUUID() })
    },
    onSuccess: applyResult,
  })
}

/**
 * 전환(예금토큰→원). 잔액 부족 시 ApiError(status 3014).
 * userId 파생·idempotencyKey 발급·캐시 갱신은 충전과 동일.
 */
export function useWithdrawWallet() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const applyResult = useApplyTxResult()
  return useMutation<WalletTxResponse, ApiError, WalletTxVars>({
    mutationFn: async ({ amount }) => {
      const userId = getUserIdFromToken(accessToken)
      if (userId == null) {
        throw new ApiError(null, '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
      }
      return walletApi.withdraw(userId, { amount, idempotencyKey: crypto.randomUUID() })
    },
    onSuccess: applyResult,
  })
}
