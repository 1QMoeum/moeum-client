import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SplashScreen from '@/components/ui/SplashScreen'

/** Hana → Moeum 전환 시 노출 시간(ms). 로고·스피너를 한 번 보고 넘어갈 정도. */
const ENTRY_SPLASH_MS = 1200

/**
 * 하나원큐 홈 → 모음 진입 전환 스플래시.
 * 하나 홈에서 "moeum 모음" 카드 클릭 시 잠깐 노출되어 브랜드 전환 감을 만들고,
 * 실제 모음 시작(`/start`) 으로 리다이렉트한다.
 *
 * <p>AuthBootstrap 의 SplashScreen 은 인증 복원 중에만 뜨고, `/hana/*` 는 `isHanaFlow` 로 스킵되며
 * 최소 노출 타이머(700ms)도 앱 시작 시점에 소진되어 홈 → 시작 흐름에선 스플래시가 안 보인다.
 * 이 페이지는 그 사이를 명시적으로 채워 브랜드 전환을 시각화한다.
 */
export default function MoeumEntrySplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/start', { replace: true })
    }, ENTRY_SPLASH_MS)
    return () => clearTimeout(timer)
  }, [navigate])

  return <SplashScreen />
}
