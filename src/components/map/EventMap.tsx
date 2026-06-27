import { useEffect, useMemo, useState } from 'react'
import { useKakaoMap } from '@/hooks/useKakaoMap'
import { useEventMap, useEventMapWithin } from '@/hooks/events'
import { loadLegalDongFeature } from '@/lib/legalDongGeo'
import { toKakaoPaths } from '@/lib/geo'
import { escapeHtml } from '@/lib/html'
import { MOCK_DISTRICTS, MOCK_VIEWPORT_EVENTS } from '@/mocks/events'
import type { EventMapDistrict, MapBounds, ViewportEvent } from '@/types/event'
import ErrorBanner from '@/components/ui/ErrorBanner'

/** true 면 백엔드 없이 목 데이터로 동작. 실제 API 붙일 땐 false 로. */
const USE_MOCK = true
/** 이 레벨 이상이면 줌아웃(법정동 집계), 미만이면 확대(개별 이벤트 핀) */
const DISTRICT_LEVEL = 7

/** 이벤트 좌표가 viewport bounds 안에 있는지 */
function inBounds(e: ViewportEvent, b: MapBounds | null): boolean {
  if (!b) return true
  return e.latitude >= b.swLat && e.latitude <= b.neLat && e.longitude >= b.swLng && e.longitude <= b.neLng
}

export default function EventMap() {
  const { containerRef, map, error } = useKakaoMap()
  const [level, setLevel] = useState<number | null>(null)
  const [bounds, setBounds] = useState<MapBounds | null>(null)

  // idle 리스너로 현재 줌레벨·bounds 추적 (이동/줌이 멈출 때마다)
  useEffect(() => {
    if (!map) return
    const sync = () => {
      setLevel(map.getLevel())
      const b = map.getBounds()
      const sw = b.getSouthWest()
      const ne = b.getNorthEast()
      setBounds({ swLat: sw.getLat(), swLng: sw.getLng(), neLat: ne.getLat(), neLng: ne.getLng() })
    }
    sync()
    kakao.maps.event.addListener(map, 'idle', sync)
    return () => kakao.maps.event.removeListener(map, 'idle', sync)
  }, [map])

  const zoomedOut = level !== null && level >= DISTRICT_LEVEL

  // 실제 API — USE_MOCK 면 enabled=false 라 호출되지 않는다.
  const realMap = useEventMap(zoomedOut && !USE_MOCK)
  const realWithin = useEventMapWithin(bounds, !zoomedOut && !USE_MOCK)

  const districts: EventMapDistrict[] = useMemo(
    () => (USE_MOCK ? MOCK_DISTRICTS : (realMap.data?.districts ?? [])),
    [realMap.data],
  )
  const events: ViewportEvent[] = useMemo(
    () =>
      USE_MOCK
        ? MOCK_VIEWPORT_EVENTS.filter((e) => inBounds(e, bounds))
        : (realWithin.data?.events ?? []),
    [realWithin.data, bounds],
  )

  // 줌아웃: 법정동 경계 폴리곤 + 대표 핀
  useEffect(() => {
    if (!map || !zoomedOut) return
    let alive = true
    const overlays: Array<{ setMap: (m: kakao.maps.Map | null) => void }> = []

    districts.forEach((d) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(d.representative.latitude, d.representative.longitude),
        map,
        title: d.legalDong,
      })
      overlays.push(marker)
      const info = new kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:12px;line-height:1.5"><b>${escapeHtml(
          d.legalDong,
        )}</b> · ${escapeHtml(d.representative.title)}<br/>모금률 ${d.fundingRate}% · ${d.eventCount}건</div>`,
      })
      kakao.maps.event.addListener(marker, 'click', () => info.open(map, marker))

      loadLegalDongFeature(d.legalDongCode)
        .then((feature) => {
          if (!alive || !feature) return
          toKakaoPaths(feature.geometry).forEach((ring) => {
            const polygon = new kakao.maps.Polygon({
              path: ring.map((p) => new kakao.maps.LatLng(p.lat, p.lng)),
              strokeWeight: 2,
              strokeColor: '#2563eb',
              strokeOpacity: 0.8,
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
            })
            polygon.setMap(map)
            overlays.push(polygon)
          })
        })
        .catch(() => {})
    })

    return () => {
      alive = false
      overlays.forEach((o) => o.setMap(null))
    }
  }, [map, zoomedOut, districts])

  // 확대: viewport 개별 이벤트 핀
  useEffect(() => {
    if (!map || zoomedOut) return
    const markers = events.map((e) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(e.latitude, e.longitude),
        map,
        title: e.title,
      })
      const info = new kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:12px;line-height:1.5"><b>${escapeHtml(
          e.title,
        )}</b><br/>모금률 ${e.fundingRate}%</div>`,
      })
      kakao.maps.event.addListener(marker, 'click', () => info.open(map, marker))
      return marker
    })
    return () => markers.forEach((m) => m.setMap(null))
  }, [map, zoomedOut, events])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {error && (
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
          <ErrorBanner message={error} />
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: '#fff',
          padding: '6px 10px',
          borderRadius: 8,
          fontSize: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,.2)',
        }}
      >
        {zoomedOut ? '🗺 법정동 집계' : '📍 이벤트 핀'} · level {level ?? '–'}
        {USE_MOCK ? ' · MOCK' : ''}
      </div>
    </div>
  )
}
