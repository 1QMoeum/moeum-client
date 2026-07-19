import { apiClient, unwrap } from '@/api/client'
import type { NotificationListResponse, UnreadCountResponse } from '@/types/notification'

/** 인앱 알림함 API — 전부 인증 필요(JWT), userId 는 서버가 토큰에서 파생. */
export const notificationApi = {
  /** 내 알림 목록 — 최신순 Slice 페이징 */
  list: (page: number, size = 20) =>
    unwrap<NotificationListResponse>(
      apiClient.get('/v1/notifications', { params: { page, size } }),
    ),

  /** 미읽음 알림 수 — 뱃지 카운트 */
  unreadCount: () =>
    unwrap<UnreadCountResponse>(apiClient.get('/v1/notifications/unread-count')),

  /** 알림 개별 읽음 */
  markRead: (notificationId: number) =>
    unwrap<void>(apiClient.patch(`/v1/notifications/${notificationId}/read`)),

  /** 알림 전체 읽음 */
  markAllRead: () => unwrap<void>(apiClient.patch('/v1/notifications/read-all')),

  /** 알림 개별 삭제 (hard delete) */
  remove: (notificationId: number) =>
    unwrap<void>(apiClient.delete(`/v1/notifications/${notificationId}`)),

  /** 알림 전체 삭제 (hard delete) */
  removeAll: () => unwrap<void>(apiClient.delete('/v1/notifications')),
}
