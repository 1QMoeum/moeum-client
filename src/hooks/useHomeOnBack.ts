import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * 최상위 탭 화면(지도·캘린더·탐색)에서 기기/브라우저 뒤로가기를 홈(/main)으로 고정한다.
 *
 * 진입 시 히스토리 항목을 하나 쌓아두고, 뒤로가기(popstate)가 오면 홈으로 보낸다.
 * 상세 등 하위 화면으로 이동하면 리스너가 해제되므로, 그 화면에서의 뒤로가기는
 * 정상적으로 이 base 화면으로 복귀하고, base 화면에서 다시 뒤로가면 홈으로 간다.
 */
export function useHomeOnBack() {
  const navigate = useNavigate()
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const onPop = () => navigate('/main')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [navigate])
}
