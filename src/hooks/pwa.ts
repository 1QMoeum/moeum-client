import { useCallback, useEffect, useState } from 'react'

/**
 * Chrome/Edge 등의 beforeinstallprompt 이벤트 페이로드.
 * 표준 타입 정의가 없어 로컬로 선언.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt: () => Promise<void>
}

/** 홈화면 설치된 상태(display-mode: standalone) 여부. iOS 는 navigator.standalone 로도 판정. */
export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = useState<boolean>(() => detectStandalone())
  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const handler = () => setStandalone(detectStandalone())
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])
  return standalone
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone
  return Boolean(displayModeStandalone || iosStandalone)
}

export type Platform = 'ios' | 'android' | 'other'

export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

/**
 * Android Chrome 등의 beforeinstallprompt 를 캡처해 우리 UI 시점에 호출할 수 있도록 저장.
 * iOS Safari 는 이 이벤트가 없어 항상 null → 안내 UI 로 유도해야 함.
 */
export function useBeforeInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler as EventListener)
    const installedHandler = () => setDeferred(null)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable'
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    return outcome
  }, [deferred])

  return { canPrompt: deferred !== null, promptInstall }
}
