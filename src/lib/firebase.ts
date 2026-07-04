import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
} from 'firebase/messaging'

/**
 * Firebase 웹 SDK 초기화 + FCM 토큰/권한 유틸.
 * env 값이 없거나 브라우저가 미지원이면 초기화 스킵 → 관련 훅이 no-op.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported'

let appInstance: FirebaseApp | null = null
let messagingInstance: Messaging | null = null
let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null

function getApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) return null
  if (!appInstance) {
    appInstance = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    })
  }
  return appInstance
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null
  if (!(await isSupported())) return null
  const app = getApp()
  if (!app) return null
  if (!messagingInstance) messagingInstance = getMessaging(app)
  return messagingInstance
}

async function ensureSwRegistered(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .catch(() => null)
  }
  return swRegistrationPromise
}

export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as NotificationPermissionStatus
}

/** 권한이 이미 granted 인 경우에만 토큰 획득. default/denied 는 null. */
export async function fcmTokenIfAlreadyGranted(): Promise<string | null> {
  if (getNotificationPermissionStatus() !== 'granted') return null
  return getFcmToken()
}

/** 브라우저 권한 프롬프트 노출 → granted 시 토큰 획득. */
export async function requestPermissionAndFcmToken(): Promise<string | null> {
  if (typeof Notification === 'undefined') return null
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null
  return getFcmToken()
}

async function getFcmToken(): Promise<string | null> {
  const messaging = await getMessagingInstance()
  if (!messaging || !VAPID_KEY) return null
  const registration = await ensureSwRegistered()
  return getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration ?? undefined,
  })
}

/** 포어그라운드 메시지 구독. 구독 해제 함수 반환. */
export async function subscribeForegroundFcm(
  callback: (payload: MessagePayload) => void,
): Promise<() => void> {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}
