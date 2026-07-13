import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HanaScreen from '@/components/hana/HanaScreen'

const SPLASH_DURATION_MS = 1600

/**
 * 하나원큐 인앱 진입 가정의 첫 화면 — 하나원큐 스플래시(로딩).
 * 잠깐 노출 후 하나원큐 홈으로 자동 전환한다.
 */
export default function HanaSplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // 전환 직후 홈 캡처가 바로 보이도록 미리 받아둔다.
    const preload = new Image()
    preload.src = '/hana/home.png'

    const timer = setTimeout(() => {
      navigate('/hana/home', { replace: true })
    }, SPLASH_DURATION_MS)
    return () => clearTimeout(timer)
  }, [navigate])

  return <HanaScreen image="/hana/splash.png" alt="하나원큐 로딩 화면" background="#fcfcfc" ratio={1260 / 2418} />
}
