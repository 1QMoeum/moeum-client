import { apiClient, unwrap } from '@/api/client'

/**
 * FCM 토큰을 서버에 등록. 서버는 사용자당 최신 토큰만 유지.
 */
export const fcmApi = {
  updateToken: (token: string) =>
    unwrap<void>(apiClient.put('/v1/users/me/fcm-token', { token })),
}
