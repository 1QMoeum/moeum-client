/** ===== 마이페이지 (GET /v1/users/me/mypage) =====
 *  내 정보·지갑·연동 계좌·이벤트 카운트·최근 참여 이벤트를 한 번에 반환.
 *  지갑 미생성 시 wallet=null, 통장 미연동 시 bankAccount=null. */

import type { EventListItem } from '@/types/event'
import type { WalletResponse } from '@/types/api'

/** 마이페이지 요약 카운트 (참여중·운영중·관심). */
export interface MyPageCounts {
  /** 참여중(ACTIVE) 이벤트 수 */
  participating: number
  /** 내가 총대로 운영중인 이벤트 수 */
  operating: number
  /** 관심(좋아요) 이벤트 수 */
  bookmarked: number
}

/** 마이페이지 연동 계좌 요약 (마이페이지 전용, 최소 필드). */
export interface MyPageBankAccount {
  bankCode: string
  accountNumber: string
  accountHolder: string
}

export interface MyPageResponse {
  /** 내 이름 */
  name: string
  /** 하나은행 본인인증(하나인증서) 여부 */
  hanaCertVerified: boolean
  /** 커스터디 지갑 — 미생성 시 null */
  wallet: WalletResponse | null
  /** 연동 계좌 — 미연동 시 null */
  bankAccount: MyPageBankAccount | null
  /** 참여/운영/관심 카운트 */
  counts: MyPageCounts
  /** 최근 참여 이벤트 카드 목록 */
  recentParticipatingEvents: EventListItem[]
}
