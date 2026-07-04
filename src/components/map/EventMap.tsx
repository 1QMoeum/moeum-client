import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, LocateFixed, Minus, Plus, Search, SlidersHorizontal } from 'lucide-react'
import {
  useEventDetail,
  useEventHistory,
  useEventList,
  useEventMap,
  useEventMapWithin,
} from '@/hooks/events'
import { useKakaoMap } from '@/hooks/useKakaoMap'
import { toKakaoPaths } from '@/lib/geo'
import { loadLegalDongFeature } from '@/lib/legalDongGeo'
import { categoryMeta, createFlagElement, createInfoBubbleElement } from '@/lib/mapPin'
import { reverseGeocode } from '@/lib/reverseGeocode'
import { EVENT_CATEGORIES, categoryImage } from '@/types/event'
import type {
  EventHistoryDistrict,
  EventMapDistrict,
  MapBounds,
  ViewportEvent,
} from '@/types/event'
import ErrorBanner from '@/components/ui/ErrorBanner'
import MapBottomSheet from '@/components/map/MapBottomSheet'
import { mapTokens, pillStyle } from '@/components/map/mapStyle'

/** 이 레벨 이상이면 줌아웃(법정동 집계), 미만이면 확대(개별 이벤트 핀) */
const DISTRICT_LEVEL = 7
/** 히스토리 영역 색 (아티스트 아바타 핀과 함께) */
const HISTORY_COLOR = '#8b5cf6'
/** 바텀시트 접힘 시 화면 하단부터 보이는 높이 (MapBottomSheet PEEK 와 동일) */
const SHEET_PEEK = 290
/** 컨트롤(현위치 버튼) 하단과 접힌 시트 윗변 사이 간격 */
const CONTROL_SHEET_GAP = 25

type MapMode = 'ongoing' | 'history'

const MODE_TABS: Array<{ key: MapMode; label: string }> = [
  { key: 'ongoing', label: '진행 중' },
  { key: 'history', label: '히스토리' },
]

type Selected =
  | { kind: 'district'; data: EventMapDistrict }
  | { kind: 'event'; data: ViewportEvent }
  | { kind: 'history'; data: EventHistoryDistrict; position: { lat: number; lng: number } }
  | null

/** 폴리곤 링의 무게중심(평균점) — 히스토리 아바타 핀 위치용 */
function ringCentroid(ring: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
  const sum = ring.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 })
  return { lat: sum.lat / ring.length, lng: sum.lng / ring.length }
}

/**
 * 이벤트 지도 화면.
 * - 진행 중: 줌아웃이면 법정동 집계(깃발+영역), 확대면 개별 이벤트 깃발 (GET /v1/events/map, /map/within)
 * - 히스토리: 종료 이벤트 법정동 집계 — 최다 아티스트 깃발+영역 (GET /v1/events/map/history)
 * - 하단: 주변(뷰포트)·전국 트렌드(진행중 목록 모금률순) TOP 10 바텀시트
 */
export default function EventMap() {
  const navigate = useNavigate()
  const { containerRef, map, error: mapError } = useKakaoMap()

  const [mode, setMode] = useState<MapMode>('ongoing')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [showCategoryRow, setShowCategoryRow] = useState(false)
  const [level, setLevel] = useState<number | null>(null)
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [areaLabel, setAreaLabel] = useState('내 주변')
  const [selected, setSelected] = useState<Selected>(null)
  /** 바텀시트 카드로 고른 이벤트 — 상세 좌표가 오면 지도 이동 + 선택으로 전환 */
  const [focusEventId, setFocusEventId] = useState<number | null>(null)

  const zoomedOut = level === null || level >= DISTRICT_LEVEL
  // 진행중/히스토리 둘 중 하나만 표시.
  const showOngoing = mode === 'ongoing'
  const showHistory = mode === 'history'

  // idle 마다 줌레벨·bounds 동기화 + 중심좌표 역지오코딩(📍 주변 탭 라벨)
  useEffect(() => {
    if (!map) return
    const sync = () => {
      setLevel(map.getLevel())
      const b = map.getBounds()
      const sw = b.getSouthWest()
      const ne = b.getNorthEast()
      setBounds({ swLat: sw.getLat(), swLng: sw.getLng(), neLat: ne.getLat(), neLng: ne.getLng() })
      const c = map.getCenter()
      reverseGeocode(c.getLat(), c.getLng())
        .then((r) => setAreaLabel(`${r.siGunGu} ${r.legalDong}`))
        .catch(() => {})
    }
    const clear = () => setSelected(null)
    sync()
    kakao.maps.event.addListener(map, 'idle', sync)
    kakao.maps.event.addListener(map, 'click', clear)
    return () => {
      kakao.maps.event.removeListener(map, 'idle', sync)
      kakao.maps.event.removeListener(map, 'click', clear)
    }
  }, [map])

  // 필터가 바뀌면 선택 해제 (해당 핀이 사라지므로). 줌 전환은 유지 — 말풍선은 좌표에 남는다.
  useEffect(() => setSelected(null), [mode])

  const mapQ = useEventMap(showOngoing && zoomedOut)
  const withinQ = useEventMapWithin(bounds, true) // 핀(확대) + 주변 TOP10 공용
  const historyQ = useEventHistory(showHistory)
  const trendQ = useEventList({ status: 'ONGOING', size: 50 })

  // 검색어·카테고리 클라이언트 필터 (백엔드 검색 API 없음 — 제목/동네/아티스트명 매칭)
  const q = query.trim().toLowerCase()
  const districts = useMemo(() => {
    return (mapQ.data?.districts ?? []).filter(
      (d) =>
        (category === null || d.representative.category === category) &&
        (q === '' ||
          d.representative.title.toLowerCase().includes(q) ||
          d.legalDong.toLowerCase().includes(q)),
    )
  }, [mapQ.data, q, category])

  const events = useMemo(() => {
    return (withinQ.data?.events ?? []).filter(
      (e) =>
        (category === null || e.category === category) &&
        (q === '' || e.title.toLowerCase().includes(q)),
    )
  }, [withinQ.data, q, category])

  const historyDistricts = useMemo(() => {
    return (historyQ.data?.districts ?? []).filter(
      (d) =>
        q === '' || d.artist.name.toLowerCase().includes(q) || d.legalDong.toLowerCase().includes(q),
    )
  }, [historyQ.data, q])

  const trending = useMemo(() => {
    const list = (trendQ.data?.content ?? []).filter(
      (e) =>
        (category === null || e.category === category) &&
        (q === '' || e.title.toLowerCase().includes(q)),
    )
    return [...list].sort((a, b) => b.fundingRate - a.fundingRate)
  }, [trendQ.data, q, category])

  // 선택된 이벤트의 상세(대표 이미지·주소·좌표) — 말풍선/하단 카드 + 바텀시트 포커스 이동에 사용
  const selectedEventId =
    selected?.kind === 'event'
      ? selected.data.eventId
      : selected?.kind === 'district'
        ? selected.data.representative.eventId
        : null
  const detail = useEventDetail(focusEventId ?? selectedEventId).data ?? null

  // 바텀시트 카드 선택 → 상세 좌표 도착 시 지도 이동 + 해당 이벤트 선택 (깃발 클릭과 동일 상태)
  useEffect(() => {
    if (!map || focusEventId === null || !detail || detail.eventId !== focusEventId) return
    map.setCenter(new kakao.maps.LatLng(detail.latitude, detail.longitude))
    if (map.getLevel() >= DISTRICT_LEVEL) map.setLevel(5)
    setSelected({
      kind: 'event',
      data: {
        eventId: detail.eventId,
        title: detail.title,
        category: detail.category,
        fundingRate: detail.fundingRate,
        currentAmount: detail.currentAmount,
        targetAmount: detail.targetAmount,
        latitude: detail.latitude,
        longitude: detail.longitude,
        legalDongCode: '',
      },
    })
    setFocusEventId(null)
  }, [map, focusEventId, detail])

  // [진행 중 · 줌아웃] 법정동 영역 + 대표 깃발
  useEffect(() => {
    if (!map || !showOngoing || !zoomedOut) return
    let alive = true
    const overlays: Array<{ setMap: (m: kakao.maps.Map | null) => void }> = []

    districts.forEach((d) => {
      const meta = categoryMeta(d.representative.category)
      const flag = createFlagElement({
        color: meta.color,
        selected: selected?.kind === 'district' && selected.data.legalDongCode === d.legalDongCode,
        onClick: () => setSelected({ kind: 'district', data: d }),
      })
      overlays.push(
        new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(d.representative.latitude, d.representative.longitude),
          content: flag,
          xAnchor: 0.2,
          yAnchor: 1,
          clickable: true,
          map,
        }),
      )

      // 코드 없이 생성된 이벤트(수기 시드 등)는 경계 없이 깃발만 표시
      if (!d.legalDongCode) return
      loadLegalDongFeature(d.legalDongCode)
        .then((feature) => {
          if (!alive || !feature) return
          toKakaoPaths(feature.geometry).forEach((ring) => {
            const polygon = new kakao.maps.Polygon({
              path: ring.map((p) => new kakao.maps.LatLng(p.lat, p.lng)),
              strokeWeight: 2,
              strokeColor: meta.color,
              strokeOpacity: 0.9,
              fillColor: meta.color,
              fillOpacity: 0.18,
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
  }, [map, showOngoing, zoomedOut, districts, selected])

  // [진행 중 · 확대] viewport 개별 이벤트 깃발
  useEffect(() => {
    if (!map || !showOngoing || zoomedOut) return
    const overlays = events.map((e) => {
      const meta = categoryMeta(e.category)
      const flag = createFlagElement({
        color: meta.color,
        selected: selected?.kind === 'event' && selected.data.eventId === e.eventId,
        onClick: () => setSelected({ kind: 'event', data: e }),
      })
      return new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(e.latitude, e.longitude),
        content: flag,
        xAnchor: 0.2,
        yAnchor: 1,
        clickable: true,
        map,
      })
    })
    return () => overlays.forEach((o) => o.setMap(null))
  }, [map, showOngoing, zoomedOut, events, selected])

  // [히스토리] 종료 이벤트 법정동 영역 + 깃발 (좌표가 없어 경계 무게중심 사용)
  useEffect(() => {
    if (!map || !showHistory) return
    let alive = true
    const overlays: Array<{ setMap: (m: kakao.maps.Map | null) => void }> = []

    historyDistricts.forEach((d) => {
      if (!d.legalDongCode) return
      loadLegalDongFeature(d.legalDongCode)
        .then((feature) => {
          if (!alive || !feature) return
          const rings = toKakaoPaths(feature.geometry)
          rings.forEach((ring) => {
            const polygon = new kakao.maps.Polygon({
              path: ring.map((p) => new kakao.maps.LatLng(p.lat, p.lng)),
              strokeWeight: 2,
              strokeColor: HISTORY_COLOR,
              strokeOpacity: 0.8,
              fillColor: HISTORY_COLOR,
              fillOpacity: 0.14,
            })
            polygon.setMap(map)
            overlays.push(polygon)
          })
          const outer = rings.reduce((a, b) => (b.length > a.length ? b : a), rings[0] ?? [])
          if (outer.length === 0) return
          const center = ringCentroid(outer)
          const flag = createFlagElement({
            color: HISTORY_COLOR,
            selected: selected?.kind === 'history' && selected.data.legalDongCode === d.legalDongCode,
            onClick: () => setSelected({ kind: 'history', data: d, position: center }),
          })
          overlays.push(
            new kakao.maps.CustomOverlay({
              position: new kakao.maps.LatLng(center.lat, center.lng),
              content: flag,
              xAnchor: 0.2,
              yAnchor: 1,
              clickable: true,
              map,
            }),
          )
        })
        .catch(() => {})
    })

    return () => {
      alive = false
      overlays.forEach((o) => o.setMap(null))
    }
  }, [map, showHistory, historyDistricts, selected])

  // 깃발 선택 시 핀 근처 팝업 카드 (원형 아바타 + 지역/제목/서브 + 화살표)
  useEffect(() => {
    if (!map || !selected) return
    let content: HTMLElement
    let position: kakao.maps.LatLng

    if (selected.kind === 'history') {
      const d = selected.data
      content = createInfoBubbleElement({
        imageUrl: d.artist.imageUrl || undefined,
        emoji: '🎤',
        region: `${d.siGunGu} ${d.legalDong}`,
        title: d.artist.name,
        subtitle: `이벤트 ${d.projectCount}개 · ${d.participantCount.toLocaleString('ko-KR')}명 참여`,
      })
      position = new kakao.maps.LatLng(selected.position.lat, selected.position.lng)
    } else {
      const data = selected.kind === 'event' ? selected.data : selected.data.representative
      const rate = selected.kind === 'event' ? selected.data.fundingRate : selected.data.fundingRate
      const meta = categoryMeta(data.category)
      const region =
        selected.kind === 'district'
          ? `${selected.data.siGunGu} ${selected.data.legalDong}`
          : detail
            ? `${detail.siGunGu} ${detail.legalDong}`
            : ''
      content = createInfoBubbleElement({
        imageUrl: detail?.representativeImageUrl || categoryImage(data.category),
        emoji: meta.emoji,
        region,
        title: data.title,
        subtitle: `${rate}% 달성`,
        onClick: () => navigate(`/events/${data.eventId}`),
      })
      position = new kakao.maps.LatLng(data.latitude, data.longitude)
    }

    const overlay = new kakao.maps.CustomOverlay({
      position,
      content,
      xAnchor: 0.5,
      yAnchor: 1.5,
      zIndex: 30,
      clickable: true,
      map,
    })
    return () => overlay.setMap(null)
  }, [map, selected, detail, navigate])

  const zoom = (delta: number) => {
    if (map) map.setLevel(map.getLevel() + delta)
  }

  const locate = () => {
    if (!map || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition((pos) => {
      map.setCenter(new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude))
      map.setLevel(5)
    })
  }

  const apiError = mapQ.error ?? withinQ.error ?? historyQ.error ?? trendQ.error

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />

      {/* 상단 — 헤더 · 검색 · 필터 칩 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '8px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
          zIndex: 5, // 카카오 지도 내부 레이어(양수 z-index) 위로
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 2, pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로"
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              cursor: 'pointer',
              color: '#191f28',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={25} />
          </button>
          <h1 style={{ margin: 0, fontSize: 17.5, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em' }}>
            지도
          </h1>
        </header>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            background: '#fff',
            borderRadius: 999,
            boxShadow: '0 2px 10px rgba(0,0,0,.1)',
            pointerEvents: 'auto',
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이벤트명, 아티스트, 키워드 검색"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14.5,
              color: '#191f28',
              letterSpacing: '-0.01em',
            }}
          />
          <Search size={19} strokeWidth={2.2} color="#adb5bd" style={{ flexShrink: 0 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
          {MODE_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setMode(t.key)}
              aria-pressed={mode === t.key}
              style={pillStyle(mode === t.key)}
            >
              {t.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => setShowCategoryRow((v) => !v)}
            aria-label="카테고리 필터"
            aria-expanded={showCategoryRow}
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: mapTokens.radiusCard,
              background: category !== null ? mapTokens.violet : mapTokens.white,
              color: category !== null ? mapTokens.white : mapTokens.gray600,
              boxShadow: mapTokens.chipShadow,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <SlidersHorizontal size={18} strokeWidth={2.2} />
          </button>
        </div>

        {showCategoryRow && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              pointerEvents: 'auto',
            }}
          >
            <CategoryChip label="전체" active={category === null} onClick={() => setCategory(null)} />
            {EVENT_CATEGORIES.map((c) => (
              <CategoryChip
                key={c.value}
                label={c.label}
                img={c.img}
                active={category === c.value}
                onClick={() => setCategory(c.value)}
              />
            ))}
          </div>
        )}

        {mapError && (
          <div style={{ pointerEvents: 'auto' }}>
            <ErrorBanner message={mapError} />
          </div>
        )}
        {!mapError && apiError && (
          <div style={{ pointerEvents: 'auto' }}>
            <ErrorBanner message={apiError.message} />
          </div>
        )}
      </div>

      {/* 우측 — 확대/축소 pill + 현위치 (Figma 글래스 컨트롤, 간격 16) */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: `calc(${SHEET_PEEK + CONTROL_SHEET_GAP}px + env(safe-area-inset-bottom))`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          zIndex: 5,
        }}
      >
        <div
          style={{
            ...glassControl,
            height: 89,
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '12px 0',
          }}
        >
          <GlassIconButton label="확대" onClick={() => zoom(-1)}>
            <Plus size={20} strokeWidth={2.4} />
          </GlassIconButton>
          <GlassIconButton label="축소" onClick={() => zoom(1)}>
            <Minus size={20} strokeWidth={2.4} />
          </GlassIconButton>
        </div>
        <div style={{ ...glassControl, width: 48, height: 48 }}>
          <GlassIconButton label="현재 위치로" onClick={locate}>
            <LocateFixed size={20} strokeWidth={2.2} />
          </GlassIconButton>
        </div>
      </div>

      {/* 하단 — TOP 10 바텀시트 (깃발 선택 요약은 지도 위 팝업으로 표시) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0, // 시트가 네비 뒤까지 내려가 지도가 비치지 않는다
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <MapBottomSheet
          areaLabel={areaLabel}
          nearby={events}
          trending={trending}
          pending={withinQ.isPending && trendQ.isPending}
          onSelectEvent={setFocusEventId}
        />
      </div>
    </div>
  )
}

function CategoryChip({
  label,
  img,
  active,
  onClick,
}: {
  label: string
  img?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        all: 'unset',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: img ? '6px 13px 6px 8px' : '7px 13px',
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        color: active ? mapTokens.white : mapTokens.gray600,
        background: active ? mapTokens.violet : mapTokens.white,
        boxShadow: mapTokens.chipShadow,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {img && <img src={img} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />}
      {label}
    </button>
  )
}

/** 지도 우측 컨트롤 글래스 컨테이너 공통 스타일 (Figma glass — rgba white .25 + blur 12) */
const glassControl: React.CSSProperties & { WebkitBackdropFilter?: string } = {
  width: 48,
  borderRadius: 24,
  background: 'rgba(255,255,255,0.25)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

/** 글래스 컨테이너 안의 투명 아이콘 버튼 (탭 타깃) */
function GlassIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        all: 'unset',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 32,
        cursor: 'pointer',
        color: '#33404f',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}
