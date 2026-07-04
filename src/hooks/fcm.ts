import { useCallback, useEffect, useRef } from 'react'
import { fcmApi } from '@/api/fcm'
import {
  fcmTokenIfAlreadyGranted,
  getNotificationPermissionStatus,
  requestPermissionAndFcmToken,
  subscribeForegroundFcm,
  type NotificationPermissionStatus,
} from '@/lib/firebase'
import { useAuthStore } from '@/store/auth'

/**
 * 로그인 사용자에 대해 알림 권한이 이미 granted 인 경우에만 FCM 토큰을 획득해 서버에 등록.
 *
 * <p>업계 표준(permission priming) 준수: 사용자 개입 없이 브라우저 권한 프롬프트를 띄우지 않는다.
 * default 상태의 사용자는 `EnableNotificationModal` 에서 명시적으로 허용해야 등록된다.
 *
 * <p>흐름: accessToken 존재 → permission=granted 확인 → Firebase 토큰 획득 →
 * PUT /v1/users/me/fcm-token 저장. 세션당 1회.
 */
export function useAutoRegisterFcmToken() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const registered = useRef<string | null>(null)

  useEffect(() => {
    if (!accessToken || registered.current === accessToken) return
    let cancelled = false
    void (async () => {
      try {
        const token = await fcmTokenIfAlreadyGranted()
        if (cancelled || !token) return
        await fcmApi.updateToken(token)
        registered.current = accessToken
        if (import.meta.env.DEV) console.info('[FCM] 자동 등록 완료')
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[FCM] 자동 등록 실패:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken])
}

/**
 * priming 모달의 "허용하기" 버튼 등에서 호출.
 * 브라우저 권한 프롬프트를 띄우고 granted 시 토큰을 서버에 등록한다.
 *
 * @returns granted 되어 등록 성공 시 true.
 */
export function useEnableNotifications() {
  return useCallback(async (): Promise<boolean> => {
    try {
      const token = await requestPermissionAndFcmToken()
      if (!token) return false
      await fcmApi.updateToken(token)
      if (import.meta.env.DEV) console.info('[FCM] 명시 등록 완료')
      return true
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[FCM] 명시 등록 실패:', e)
      return false
    }
  }, [])
}

export function useNotificationPermissionStatus() {
  return useCallback(
    async (): Promise<NotificationPermissionStatus> => getNotificationPermissionStatus(),
    [],
  )
}

/**
 * 탭이 활성 상태일 때 도착하는 FCM 메시지를 브라우저 Notification 으로 노출한다.
 * SW 의 onBackgroundMessage 와 대칭. accessToken 이 있을 때만 구독.
 */
export function useForegroundFcmNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!accessToken) return
    let unsub: (() => void) | null = null
    let cancelled = false
    void (async () => {
      const off = await subscribeForegroundFcm((payload) => {
        const data = payload.data ?? {}
        const title = data.title ?? payload.notification?.title ?? '모음'
        const body = data.body ?? payload.notification?.body ?? ''
        void navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/moeum-favicon.svg',
            data,
          })
        })
      })
      if (cancelled) off()
      else unsub = off
    })()
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [accessToken])
}
