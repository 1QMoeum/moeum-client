import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { walletApi } from '@/api/wallet'
import type { WalletResponse } from '@/types/api'

/**
 * 내 커스터디 지갑 조회. 지갑 미생성(status 3000)은 정상 흐름의 빈 상태이므로
 * 페이지에서 error.status === ErrorCode.WALLET_NOT_FOUND 로 분기한다.
 */
export function useMyWallet(enabled: boolean) {
  return useQuery<WalletResponse, ApiError>({
    queryKey: ['wallet', 'me'],
    enabled,
    staleTime: 30_000,
    retry: false,
    queryFn: () => walletApi.myWallet(),
  })
}
