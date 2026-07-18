import { useEffect } from 'react'
import { useKakaoMap } from '@/hooks/useKakaoMap'

/** 위치 미리보기 지도 — 마커 1개, 조작 비활성(스크롤 방해 방지). */
export default function VenuePreviewMap({
  latitude,
  longitude,
  height = 160,
}: {
  latitude: number
  longitude: number
  height?: number
}) {
  const { containerRef, map, error } = useKakaoMap(4)

  useEffect(() => {
    if (!map) return
    const position = new kakao.maps.LatLng(latitude, longitude)
    map.setCenter(position)
    map.setDraggable(false)
    map.setZoomable(false)
    const marker = new kakao.maps.Marker({ position })
    marker.setMap(map)
    return () => marker.setMap(null)
  }, [map, latitude, longitude])

  if (error) return null

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', background: '#f1f3f5' }}
    />
  )
}
