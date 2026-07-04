import { useEffect, useRef, useState } from 'react'
import { loadKakaoMaps } from '@/lib/kakaoLoader'

/** 서울시청 — 경계 데이터가 붙기 전 초기 중심점 */
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

/**
 * 카카오 SDK를 로드하고 container ref에 지도를 1회 생성한다.
 * 반환한 containerRef를 div에 달면 되고, map이 준비되면 그때부터 오버레이를 올릴 수 있다.
 */
export function useKakaoMap(level = 8) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<kakao.maps.Map | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadKakaoMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return
        const instance = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level,
          draggable: true,
          scrollwheel: true,
        })
        // 일부 SDK 상태/HMR 잔존으로 드래그가 꺼진 경우를 대비해 명시적으로 켠다
        instance.setDraggable(true)
        instance.setZoomable(true)
        setMap(instance)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '지도 로드에 실패했습니다.')
      })
    return () => {
      cancelled = true
    }
  }, [level])

  return { containerRef, map, error }
}
