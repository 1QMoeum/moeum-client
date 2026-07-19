import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { notificationApi } from '@/api/notification'
import { useAuthStore } from '@/store/auth'
import type { NotificationListResponse, UnreadCountResponse } from '@/types/notification'

const PAGE_SIZE = 20

/**
 * 내 알림 목록 — 최신순 무한스크롤(Slice). hasNext 면 다음 page 를 이어 붙인다.
 * 로그인 전에는 비활성화.
 */
export function useNotifications(enabled = true) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useInfiniteQuery<NotificationListResponse, ApiError>({
    queryKey: ['notifications', 'list'],
    enabled: enabled && !!accessToken,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => notificationApi.list(pageParam as number, PAGE_SIZE),
    getNextPageParam: (last, all) => (last.hasNext ? all.length : undefined),
  })
}

/** 미읽음 알림 수 — 상단 벨 뱃지. 30초 stale 로 과호출 방지. */
export function useUnreadNotificationCount(enabled = true) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery<UnreadCountResponse, ApiError>({
    queryKey: ['notifications', 'unread'],
    enabled: enabled && !!accessToken,
    staleTime: 30_000,
    queryFn: () => notificationApi.unreadCount(),
  })
}

/** 알림 개별 읽음 — 성공 시 목록·뱃지 캐시 무효화 */
export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation<void, ApiError, number>({
    mutationFn: (notificationId) => notificationApi.markRead(notificationId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

/** 알림 전체 읽음 — 성공 시 목록·뱃지 캐시 무효화 */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation<void, ApiError, void>({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
