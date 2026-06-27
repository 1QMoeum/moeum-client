import { useEffect, useMemo, useState } from 'react'
import { useKakaoMap } from '@/hooks/useKakaoMap'
import { useEventMap, useEventMapWithin } from '@/hooks/events'
import { loadLegalDongFeature } from '@/lib/legalDongGeo'
import { toKakaoPaths } from '@/lib/geo'
import { categoryMeta, createPinElement } from '@/lib/mapPin'
import { MOCK_DISTRICTS, MOCK_VIEWPORT_EVENTS } from '@/mocks/events'
import type { EventMapDistrict, MapBounds, ViewportEvent } from '@/types/event'
import ErrorBanner from '@/components/ui/ErrorBanner'

/** true 면 백엔드 없이 목 데이터로 동작. 실제 API 붙일 땐 false 로. */
const USE_MOCK = true
/** 이 레벨 이상이면 줌아웃(법정동 집계), 미만이면 확대(개별 이벤트 핀) */
const DISTRICT_LEVEL = 7

type Selected =
  | { kind: 'district'; data: EventMapDistrict }
  | { kind: 'event'; data: ViewportEvent }
  | null

/** 이벤트 좌표가 viewport bounds 안에 있는지 */
function inBounds(e: ViewportEvent, b: MapBounds | null): boolean {
  if (!b) return true
  return e.latitude >= b.swLat && e.latitude <= b.neLat && e.longitude >= b.swLng && e.longitude <= b.neLng
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

export default function EventMap() {
  const { containerRef, map, error } = useKakaoMap()
  const [level, setLevel] = useState<number | null>(null)
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [selected, setSelected] = useState<Selected>(null)

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

  // 줌 모드가 바뀌면 상세 선택 해제 (반대편 핀은 사라지므로)
  useEffect(() => setSelected(null), [zoomedOut])

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

  // 줌아웃: 법정동 경계 폴리곤 + 대표 핀(pill)
  useEffect(() => {
    if (!map || !zoomedOut) return
    let alive = true
    const overlays: Array<{ setMap: (m: kakao.maps.Map | null) => void }> = []

    districts.forEach((d) => {
      const meta = categoryMeta(d.representative.category)
      const pin = createPinElement({
        label: `${meta.emoji} ${d.legalDong} ${d.fundingRate}%`,
        color: meta.color,
        emphasized: true,
        onClick: () => setSelected({ kind: 'district', data: d }),
      })
      overlays.push(
        new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(d.representative.latitude, d.representative.longitude),
          content: pin,
          xAnchor: 0.5,
          yAnchor: 1,
          clickable: true,
          map,
        }),
      )

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

  // 확대: viewport 개별 이벤트 핀(pill)
  useEffect(() => {
    if (!map || zoomedOut) return
    const overlays = events.map((e) => {
      const meta = categoryMeta(e.category)
      const pin = createPinElement({
        label: `${meta.emoji} ${e.fundingRate}%`,
        color: meta.color,
        onClick: () => setSelected({ kind: 'event', data: e }),
      })
      return new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(e.latitude, e.longitude),
        content: pin,
        xAnchor: 0.5,
        yAnchor: 1,
        clickable: true,
        map,
      })
    })
    return () => overlays.forEach((o) => o.setMap(null))
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

      {selected && <DetailCard selected={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

/** 핀 클릭 시 뜨는 상세 카드 (React UI — 지도 위 오버레이) */
function DetailCard({ selected, onClose }: { selected: NonNullable<Selected>; onClose: () => void }) {
  const isDistrict = selected.kind === 'district'
  const title = isDistrict ? selected.data.representative.title : selected.data.title
  const category = isDistrict ? selected.data.representative.category : selected.data.category
  const fundingRate = selected.data.fundingRate
  const current = isDistrict ? selected.data.representative.currentAmount : selected.data.currentAmount
  const target = isDistrict ? selected.data.representative.targetAmount : selected.data.targetAmount
  const meta = categoryMeta(category)

  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,.2)',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        style={{
          position: 'absolute',
          top: 10,
          right: 12,
          border: 'none',
          background: 'none',
          fontSize: 18,
          cursor: 'pointer',
          color: '#9ca3af',
        }}
      >
        ✕
      </button>

      <div style={{ fontSize: 12, color: meta.color, fontWeight: 700 }}>
        {meta.emoji} {category}
        {isDistrict && ` · ${selected.data.siGunGu} ${selected.data.legalDong} · ${selected.data.eventCount}건`}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 10px' }}>{title}</div>

      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(fundingRate, 100)}%`, height: '100%', background: meta.color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13 }}>
        <span style={{ fontWeight: 700 }}>모금률 {fundingRate}%</span>
        <span style={{ color: '#6b7280' }}>
          {won(current)} / {won(target)}
        </span>
      </div>
    </div>
  )
}
