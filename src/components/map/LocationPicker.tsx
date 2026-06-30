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

  const runSearch = () => {
    const q = query.trim()
    if (!q) return
    setSearchError(null)
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.addressSearch(q, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || result.length === 0) {
        setSearchError('검색 결과가 없어요. 다른 주소로 시도해 주세요.')
        return
      }
      const top = result[0]
      placeRef.current(Number(top.y), Number(top.x), true)
    })
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
        <Search size={18} strokeWidth={2.2} color="#adb5bd" style={{ flexShrink: 0 }} />
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
            fontSize: 14.5,
            color: '#191f28',
            letterSpacing: '-0.01em',
          }}
        />
        <button
          type="button"
          onClick={runSearch}
          style={{
            all: 'unset',
            fontSize: 13,
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
        <span style={{ fontSize: 12, color: '#e03e3e', letterSpacing: '-0.01em' }}>{searchError}</span>
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
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
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
              fontSize: 13,
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
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: '-0.01em',
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
            <span style={{ fontSize: 13.5, color: '#e03e3e', letterSpacing: '-0.01em' }}>{geoError}</span>
          ) : resolving ? (
            <span style={{ fontSize: 13.5, color: '#8b95a1', letterSpacing: '-0.01em' }}>
              주소 확인 중…
            </span>
          ) : value ? (
            <>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em' }}>
                {value.address}
              </span>
              <span style={{ fontSize: 12.5, color: '#8b95a1', letterSpacing: '-0.01em' }}>
                {value.siDo} {value.siGunGu} {value.legalDong}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13.5, color: '#adb5bd', letterSpacing: '-0.01em' }}>
              선택된 위치가 없어요
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
