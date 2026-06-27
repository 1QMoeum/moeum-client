import { useEffect } from 'react'
import { useKakaoMap } from '@/hooks/useKakaoMap'
import { useLegalDongFeature } from '@/hooks/legalDong'
import { toKakaoPaths } from '@/lib/geo'
import ErrorBanner from '@/components/ui/ErrorBanner'

interface LegalDongMapProps {
  /** 서버가 준 법정동코드 10자리 */
  legalDongCode: string
}

/**
 * 카카오 지도 위에 특정 법정동 경계 폴리곤을 그린다.
 * legalDongCode → 시군구 파일 fetch(useLegalDongFeature) → 좌표 변환(toKakaoPaths) → Polygon 렌더 + bounds fit.
 */
export default function LegalDongMap({ legalDongCode }: LegalDongMapProps) {
  const { containerRef, map, error: mapError } = useKakaoMap()
  const { data: feature, isLoading, error: geoError } = useLegalDongFeature(legalDongCode)

  useEffect(() => {
    if (!map || !feature) return

    const bounds = new kakao.maps.LatLngBounds()
    const polygons = toKakaoPaths(feature.geometry).map((ring) => {
      const path = ring.map((p) => {
        const latlng = new kakao.maps.LatLng(p.lat, p.lng)
        bounds.extend(latlng)
        return latlng
      })
      return new kakao.maps.Polygon({
        path,
        strokeWeight: 2,
        strokeColor: '#2563eb',
        strokeOpacity: 0.9,
        fillColor: '#3b82f6',
        fillOpacity: 0.3,
      })
    })

    polygons.forEach((polygon) => polygon.setMap(map))
    if (!bounds.isEmpty()) map.setBounds(bounds)

    return () => polygons.forEach((polygon) => polygon.setMap(null))
  }, [map, feature])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10 }}>
        {mapError && <ErrorBanner message={mapError} />}
        {geoError && <ErrorBanner message={`경계 로드 실패: ${geoError.message}`} />}
        {!mapError && !geoError && map && !isLoading && !feature && (
          <ErrorBanner message={`해당 법정동코드의 경계를 찾지 못했습니다: ${legalDongCode}`} />
        )}
      </div>
    </div>
  )
}
