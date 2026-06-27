import type { LegalDongGeometry } from '@/types/geo'

export interface LatLng {
  lat: number
  lng: number
}

/**
 * GeoJSON geometry(좌표 [lng, lat]) → 지도 SDK 용 링 배열([{ lat, lng }]).
 *
 * - GeoJSON은 [경도, 위도] 순서지만 카카오/대부분의 지도 SDK는 (위도, 경도) 이므로 swap한다.
 * - Polygon/MultiPolygon을 모두 "링의 배열"로 평탄화한다(외곽선·구멍·섬 각각 하나의 링).
 *   카카오에서는 각 링으로 Polygon을 만들거나, path 배열로 구멍을 표현할 수 있다.
 */
export function toKakaoPaths(geometry: LegalDongGeometry): LatLng[][] {
  const rings: LatLng[][] = []
  const pushRing = (ring: number[][]) => {
    rings.push(ring.map(([lng, lat]) => ({ lat, lng })))
  }

  if (geometry.type === 'Polygon') {
    ;(geometry.coordinates as number[][][]).forEach(pushRing)
  } else {
    ;(geometry.coordinates as number[][][][]).forEach((polygon) => polygon.forEach(pushRing))
  }

  return rings
}
