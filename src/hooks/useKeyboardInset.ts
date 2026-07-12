import { useEffect, useState } from 'react'

/**
 * 모바일 가상 키보드가 화면을 덮고 있는 높이(px).
 *
 * iOS 사파리는 키보드가 열려도 레이아웃 뷰포트를 줄이지 않고 위에 덮기 때문에,
 * 하단 고정(sticky bottom) 요소가 키보드 뒤에 가려진다. visualViewport 로 덮인
 * 높이를 계산해 bottom 오프셋으로 쓰면 입력창이 키보드 바로 위에 붙는다.
 * 안드로이드 크롬은 viewport 메타의 interactive-widget=resizes-content 로
 * 레이아웃 자체가 줄어들어 이 값이 0 이 된다.
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}
