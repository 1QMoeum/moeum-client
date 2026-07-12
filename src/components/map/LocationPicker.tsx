import { useEffect, useRef, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { useKakaoMap } from '@/hooks/useKakaoMap'
import { reverseGeocode } from '@/lib/reverseGeocode'

/** 지도에서 고른 위치 — 이벤트 생성(MANUAL) 요청 위치 필드와 동일. */
export interface PickedLocation {
  latitude: number
  longitude: number
  address: string
  siDo: string
  siGunGu: string
  legalDong: string
  legalDongCode: string
}

/** 검색 결과 한 줄 — POI 또는 주소 지오코딩 결과를 정규화 */
interface SearchResult {
  name: string
  address: string
  lat: number
  lng: number
}

interface Props {
  value: PickedLocation | null
  onChange: (loc: PickedLocation) => void
}

/**
 * 주소 검색 + 지도 탭으로 위치를 고른다(MANUAL 경로).
 * 고른 좌표를 역지오코딩해 행정구역/주소를 채우고 onChange 로 부모에 전달한다.
 */
export default function LocationPicker({ value, onChange }: Props) {
  const { containerRef, map, error } = useKakaoMap(4)
  const markerRef = useRef<kakao.maps.Marker | null>(null)
  const [resolving, setResolving] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])

  // onChange 는 부모 렌더마다 새 참조일 수 있어 ref 로 고정 (지도 리스너 재등록 방지)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // 좌표를 찍고 역지오코딩 → onChange. map 준비 후 재사용하려고 ref 로 보관.
  const placeRef = useRef<(lat: number, lng: number, recenter?: boolean) => void>(() => {})

  useEffect(() => {
    if (!map) return

    const place = (lat: number, lng: number, recenter = false) => {
      const pos = new kakao.maps.LatLng(lat, lng)
      if (markerRef.current) {
        markerRef.current.setPosition(pos)
      } else {
        markerRef.current = new kakao.maps.Marker({ position: pos, map })
      }
      if (recenter) map.setCenter(pos)
      setResolving(true)
      setGeoError(null)
      reverseGeocode(lat, lng)
        .then((region) => onChangeRef.current({ latitude: lat, longitude: lng, ...region }))
        .catch((e: unknown) =>
          setGeoError(e instanceof Error ? e.message : '주소를 불러오지 못했어요.'),
        )
        .finally(() => setResolving(false))
    }
    placeRef.current = place

    const handleClick = (mouseEvent: kakao.maps.MouseEvent) => {
      place(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng())
    }
    kakao.maps.event.addListener(map, 'click', handleClick)
    return () => kakao.maps.event.removeListener(map, 'click', handleClick)
  }, [map])

  /** 상호·역·랜드마크(POI) 우선 검색, 없으면 주소로 재시도 → 결과 목록 표시. */
  const runSearch = () => {
    const q = query.trim()
    if (!q) return
    setSearchError(null)
    setResults([])

    const places = new kakao.maps.services.Places()
    places.keywordSearch(q, (poi, status) => {
      if (status === kakao.maps.services.Status.OK && poi.length > 0) {
        setResults(
          poi.slice(0, 7).map((p) => ({
            name: p.place_name,
            address: p.road_address_name || p.address_name,
            lat: Number(p.y),
            lng: Number(p.x),
          })),
        )
        return
      }
      // POI 결과가 없으면 주소 지오코딩으로 재시도
      const geocoder = new kakao.maps.services.Geocoder()
      geocoder.addressSearch(q, (addr, addrStatus) => {
        if (addrStatus === kakao.maps.services.Status.OK && addr.length > 0) {
          setResults(
            addr.slice(0, 7).map((r) => ({
              name: r.road_address?.address_name || r.address_name,
              address: r.address_name,
              lat: Number(r.y),
              lng: Number(r.x),
            })),
          )
          return
        }
        setSearchError('검색 결과가 없어요. 다른 이름이나 주소로 시도해 주세요.')
      })
    })
  }

  /** 검색 결과 선택 → 지도 이동 + 마커 + 역지오코딩 */
  const selectResult = (r: SearchResult) => {
    setResults([])
    setSearchError(null)
    setQuery(r.name)
    placeRef.current(r.lat, r.lng, true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* 주소 검색 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 14px',
          background: '#f9fafb',
          border: '1.5px solid #f2f4f6',
          borderRadius: 14,
        }}
      >
        <Search size={18} strokeWidth={2.2} color="#86869f" style={{ flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              runSearch()
            }
          }}
          placeholder="주소 검색"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 16, // 16px 미만이면 iOS 사파리가 포커스 시 화면을 확대한다
            color: '#1c1d1f',
            letterSpacing: '-0.02em',
          }}
        />
        <button
          type="button"
          onClick={runSearch}
          style={{
            all: 'unset',
            fontSize: 14,
            fontWeight: 700,
            color: '#8B5CF6',
            cursor: 'pointer',
            padding: '2px 4px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          검색
        </button>
      </div>
      {searchError && (
        <span style={{ fontSize: 14, color: '#e03e3e', letterSpacing: '-0.02em' }}>{searchError}</span>
      )}

      {results.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #f2f4f6',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {results.map((r, i) => (
            <button
              key={`${r.lat},${r.lng},${i}`}
              type="button"
              onClick={() => selectResult(r)}
              style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: '11px 14px',
                cursor: 'pointer',
                borderTop: i === 0 ? 'none' : '1px solid #f2f4f6',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1c1d1f', letterSpacing: '-0.02em' }}>
                {r.name}
              </span>
              <span style={{ fontSize: 14, color: '#86869f', letterSpacing: '-0.02em' }}>{r.address}</span>
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 240,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />
        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              textAlign: 'center',
              fontSize: 14,
              color: '#e03e3e',
              background: '#fff5f5',
            }}
          >
            {error}
          </div>
        )}
        {!value && !error && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              right: 10,
              padding: '8px 12px',
              background: 'rgba(17,24,39,0.78)',
              color: '#fff',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              pointerEvents: 'none',
            }}
          >
            지도를 눌러 모임 장소를 선택하세요
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '12px 14px',
          background: 'var(--color-muted)',
          borderRadius: 12,
          minHeight: 44,
        }}
      >
        <MapPin size={18} strokeWidth={2.2} color="#8B5CF6" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {geoError ? (
            <span style={{ fontSize: 14, color: '#e03e3e', letterSpacing: '-0.02em' }}>{geoError}</span>
          ) : resolving ? (
            <span style={{ fontSize: 14, color: '#86869f', letterSpacing: '-0.02em' }}>
              주소 확인 중…
            </span>
          ) : value ? (
            <>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1c1d1f', letterSpacing: '-0.02em' }}>
                {value.address}
              </span>
              <span style={{ fontSize: 14, color: '#86869f', letterSpacing: '-0.02em' }}>
                {value.siDo} {value.siGunGu} {value.legalDong}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 14, color: '#86869f', letterSpacing: '-0.02em' }}>
              선택된 위치가 없어요
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
