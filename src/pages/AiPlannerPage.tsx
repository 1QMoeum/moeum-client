import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft, Pencil } from 'lucide-react'
import { useRecommendVenues, useVenueDetail } from '@/hooks/venues'
import { useKakaoMap } from '@/hooks/useKakaoMap'
import { useAuthStore } from '@/store/auth'
import { toErrorMessage } from '@/api/client'
import Button from '@/components/ui/Button'
import FadeImage from '@/components/ui/FadeImage'
import IllustrationLoading from '@/components/ui/IllustrationLoading'
import { venueImageSrc, venueTypeLabel } from '@/types/venue'
import type { AiPlanVenue, RecommendedVenue } from '@/types/venue'

const EXAMPLE_QUERIES = [
  '성수에서 100만원 이하로 생일카페 열고 싶어요',
  '홍대 근처 전광판 광고 업체 추천해주세요',
  '부산 서면에서 배너 광고 할 수 있는 곳 알려줘',
]

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
/** 원 → "80만원" 표기 (만원 미만은 원 단위 그대로) */
const manwon = (n: number) => (n >= 10_000 ? `${Math.round(n / 10_000).toLocaleString('ko-KR')}만원` : won(n))

/**
 * AI 플래너 — 자연어 조건으로 장소 플랜을 추천받는다. (POST /v1/venues/recommend)
 * 입력 → 추천 플랜 목록 → 플랜 상세(GET /v1/venues/{id}) → "이 플랜으로 시작" 시
 * 생성 위저드(/events/new/manual)에 venue 를 넘겨 AI 경로(selectedVenueId)로 생성한다.
 */
export default function AiPlannerPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const recommend = useRecommendVenues()

  const [query, setQuery] = useState('')
  const [view, setView] = useState<'input' | 'results'>('input')
  const [detail, setDetail] = useState<{ venue: RecommendedVenue; badge: string } | null>(null)
  /** 로딩 중 뒤로가기로 취소했으면 늦게 도착한 응답이 결과 화면으로 전환하지 않도록 막는다 */
  const cancelledRef = useRef(false)

  const results = useMemo(() => recommend.data?.results ?? [], [recommend.data])

  /** 배지 — 1순위 BEST, 나머지 중 최저가 가성비 추천. */
  const badges = useMemo(() => {
    const map = new Map<number, string>()
    if (results.length === 0) return map
    map.set(results[0].venueId, 'BEST')
    const rest = results.slice(1)
    if (rest.length > 0) {
      const cheapest = rest.reduce((a, b) => (b.price < a.price ? b : a))
      map.set(cheapest.venueId, '가성비 추천')
    }
    return map
  }, [results])

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  const startWithVenue = (v: RecommendedVenue) => {
    const venue: AiPlanVenue = {
      venueId: v.venueId,
      title: v.title,
      venueType: v.venueType,
      siDo: v.siDo,
      siGunGu: v.siGunGu,
      price: v.price,
      imageUrl: v.imageUrl,
    }
    navigate('/events/new/manual', { state: { venue } })
  }

  const submit = () => {
    const q = query.trim()
    if (q === '' || recommend.isPending) return
    cancelledRef.current = false
    recommend.mutate(q, {
      onSuccess: () => {
        if (!cancelledRef.current) setView('results')
      },
    })
  }

  if (detail) {
    return (
      <PlanDetail
        venue={detail.venue}
        badge={detail.badge}
        onBack={() => setDetail(null)}
        onStart={() => startWithVenue(detail.venue)}
      />
    )
  }

  // 플랜 생성 중 — 전용 로딩 화면 (피그마 02). 뒤로가기는 요청 취소 후 입력 화면으로.
  if (recommend.isPending) {
    return (
      <IllustrationLoading
        topTitle="AI 플래너"
        title={'맞춤형 플랜을\n생성하는 중이에요!'}
        desc="조금만 기다려주세요."
        onBack={() => {
          cancelledRef.current = true
          recommend.reset()
        }}
      />
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '8px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 8 }}>
          <button
            type="button"
            onClick={() => (view === 'results' ? setView('input') : navigate(-1))}
            aria-label="뒤로"
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 12,
              cursor: 'pointer',
              color: '#191f28',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={26} />
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#191f28', letterSpacing: '-0.02em' }}>
            AI 플래너
          </h1>
        </header>

        {view === 'input' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '28px 4px 0' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#191f28',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.35,
                }}
              >
                어떤 이벤트를
                <br />
                준비하고 있나요?
              </h2>
              <span style={{ fontSize: 14, color: '#6b7684', letterSpacing: '-0.01em' }}>
                원하는 조건을 아래에 입력해주세요.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '28px 0 0' }}>
              <span style={{ fontSize: 13, color: '#8b95a1' }}>예시</span>
              {EXAMPLE_QUERIES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setQuery(ex)}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    alignSelf: 'flex-start',
                    padding: '11px 16px',
                    borderRadius: 999,
                    background: '#f5f5f7',
                    fontSize: 13.5,
                    color: '#4e5968',
                    letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="새로운 대화를 시도해보세요"
              rows={4}
              maxLength={200}
              style={{
                boxSizing: 'border-box',
                width: '100%',
                padding: '16px',
                border: '1.5px solid #ececf0',
                borderRadius: 16,
                fontSize: 16, // 16px 미만이면 iOS 사파리가 포커스 시 화면을 확대한다
                color: '#191f28',
                letterSpacing: '-0.01em',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />

            {recommend.error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 12,
                  padding: '12px 14px',
                  background: '#fff5f5',
                  borderRadius: 12,
                  color: '#e03e3e',
                  fontSize: 13,
                }}
              >
                <AlertCircle size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                {toErrorMessage(recommend.error)}
              </div>
            )}

            <div
              style={{
                position: 'sticky',
                bottom: 0,
                background: '#fff',
                padding: '12px 0 calc(20px + env(safe-area-inset-bottom))',
              }}
            >
              <Button variant="solid" onClick={submit} disabled={query.trim() === '' || recommend.isPending}>
                {recommend.isPending ? 'AI가 플랜을 찾는 중…' : 'AI 플랜 추천 받기'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 입력한 조건 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginTop: 20,
                padding: '16px 18px',
                background: '#f5f5f7',
                borderRadius: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#8b95a1' }}>입력한 조건</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em', lineHeight: 1.45 }}>
                  “{query.trim()}”
                </span>
              </div>
              <button
                type="button"
                onClick={() => setView('input')}
                aria-label="조건 수정"
                style={{ all: 'unset', display: 'flex', padding: 4, cursor: 'pointer', color: '#8b95a1', WebkitTapHighlightColor: 'transparent' }}
              >
                <Pencil size={16} strokeWidth={2} />
              </button>
            </div>

            <span style={{ fontSize: 14.5, fontWeight: 600, color: '#191f28', margin: '24px 0 12px' }}>
              AI 추천 플랜
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 0 32px' }}>
              {results.length === 0 && (
                <span style={{ fontSize: 13.5, color: '#8b95a1', textAlign: 'center', padding: '32px 0' }}>
                  조건에 맞는 플랜이 없어요. 조건을 바꿔 다시 시도해보세요.
                </span>
              )}
              {results.map((v, i) => {
                const badge = badges.get(v.venueId) ?? 'AI 추천'
                return (
                  <PlanCard
                    key={v.venueId}
                    venue={v}
                    rank={i + 1}
                    badge={badge}
                    onDetail={() => setDetail({ venue: v, badge })}
                    onStart={() => startWithVenue(v)}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function PlanBadge({ label }: { label: string }) {
  const best = label === 'BEST'
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        padding: '3px 10px',
        borderRadius: 999,
        border: `1px solid ${best ? '#191f28' : '#d9cffb'}`,
        background: best ? '#191f28' : '#f3f0ff',
        color: best ? '#fff' : '#7c6ff0',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  )
}

function PlanCard({
  venue,
  rank,
  badge,
  onDetail,
  onStart,
}: {
  venue: RecommendedVenue
  rank: number
  badge: string
  onDetail: () => void
  onStart: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: 14,
        border: '1px solid #ededf2',
        borderRadius: 16,
        background: '#fff',
      }}
    >
      {/* 썸네일 + 배지 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <PlanBadge label={badge} />
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 12,
            background: '#f1f3f5',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          {venueImageSrc(venue.imageUrl) ? (
            <FadeImage src={venueImageSrc(venue.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            '📍'
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: '#191f28',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          플랜 {rank} | {venue.title}
        </span>
        <span style={{ fontSize: 12.5, color: '#8b95a1' }}>{venueTypeLabel(venue.venueType)} 구성</span>
        <span style={{ fontSize: 12.5, color: '#6b7684', marginTop: 2 }}>
          <span style={{ color: '#8b95a1' }}>예상 비용</span>{' '}
          <b style={{ fontWeight: 600, color: '#191f28' }}>{manwon(venue.price)}</b>
          {venue.deposit != null && ` (보증금 ${manwon(venue.deposit)})`}
        </span>
        <span style={{ fontSize: 12.5, color: '#6b7684' }}>
          <span style={{ color: '#8b95a1' }}>위치</span> {venue.siDo} {venue.siGunGu}
        </span>

        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onDetail}
            style={{
              all: 'unset',
              padding: '8px 13px',
              borderRadius: 999,
              border: '1px solid #ececf0',
              fontSize: 12.5,
              fontWeight: 500,
              color: '#4e5968',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            상세 보기
          </button>
          <button
            type="button"
            onClick={onStart}
            style={{
              all: 'unset',
              padding: '8px 13px',
              borderRadius: 999,
              background: '#5b6270',
              fontSize: 12.5,
              fontWeight: 500,
              color: '#fff',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            이 플랜으로 시작
          </button>
        </div>
      </div>
    </div>
  )
}

/** 플랜(장소) 상세 — GET /v1/venues/{id} 로 소개·가격·주소를 보여준다. */
function PlanDetail({
  venue,
  badge,
  onBack,
  onStart,
}: {
  venue: RecommendedVenue
  badge: string
  onBack: () => void
  onStart: () => void
}) {
  const { data: detail, isPending } = useVenueDetail(venue.venueId)

  return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* 상단 이미지 */}
        <div style={{ position: 'relative', height: 240, background: '#e9ecef', overflow: 'hidden' }}>
          {venueImageSrc(venue.imageUrl) && (
            <FadeImage
              src={venueImageSrc(venue.imageUrl)}
              alt={venue.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <button
            type="button"
            onClick={onBack}
            aria-label="뒤로"
            style={{
              all: 'unset',
              position: 'absolute',
              top: 12,
              left: 12,
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#191f28',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PlanBadge label={badge} />
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em' }}>
              {venue.title}
            </h2>
            <span style={{ fontSize: 13.5, color: '#6b7684' }}>
              {venueTypeLabel(venue.venueType)} · {venue.siDo} {venue.siGunGu}
            </span>
          </div>

          {/* 핵심 정보 */}
          <div
            style={{
              display: 'flex',
              background: '#fff',
              border: '1px solid #ededf2',
              borderRadius: 16,
              padding: '16px 8px',
            }}
          >
            <DetailStat label="예상 비용" value={manwon(venue.price)} />
            <StatDivider />
            <DetailStat label="보증금" value={venue.deposit != null ? manwon(venue.deposit) : '없음'} />
            <StatDivider />
            <DetailStat label="위치" value={venue.siGunGu} />
          </div>

          {/* 장소 소개 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>장소 소개</span>
            {isPending ? (
              <div style={{ height: 64, borderRadius: 12, background: '#f1f3f5' }} />
            ) : (
              <p style={{ margin: 0, fontSize: 13.5, color: '#4e5968', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {detail?.description || '소개 정보가 없어요.'}
              </p>
            )}
            {detail?.rentalStartTime && detail.rentalEndTime && (
              <span style={{ fontSize: 12.5, color: '#8b95a1' }}>
                🕐 대관 {detail.rentalStartTime.slice(0, 5)} ~ {detail.rentalEndTime.slice(0, 5)}
              </span>
            )}
          </div>

          {/* 위치 — 지도 + 장소명 + 주소 */}
          {detail && detail.latitude != null && detail.longitude != null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>위치</span>
              <VenueMap latitude={detail.latitude} longitude={detail.longitude} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#191f28' }}>{venue.title}</span>
                {detail.address && (
                  <span style={{ fontSize: 12.5, color: '#8b95a1' }}>{detail.address}</span>
                )}
              </div>
            </div>
          )}

          {/* 추천 이유 */}
          {venue.reason && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '16px 18px',
                background: '#f5f5f7',
                borderRadius: 16,
              }}
            >
              <span style={{ fontSize: 12.5, color: '#8b95a1' }}>추천 이유</span>
              <p style={{ margin: 0, fontSize: 13.5, color: '#4e5968', lineHeight: 1.6 }}>{venue.reason}</p>
            </div>
          )}
        </div>

        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: '#fff',
            padding: '16px 20px calc(20px + env(safe-area-inset-bottom))',
          }}
        >
          <Button variant="solid" onClick={onStart}>
            이 플랜으로 이벤트 만들기
          </Button>
        </div>
      </div>
    </main>
  )
}

/** 플랜 상세의 위치 미리보기 지도 — 마커 1개, 조작 비활성(스크롤 방해 방지). */
function VenueMap({ latitude, longitude }: { latitude: number; longitude: number }) {
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
      style={{ width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', background: '#f1f3f5' }}
    />
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 12, color: '#8b95a1' }}>{label}</span>
      <span
        style={{
          fontSize: 14.5,
          fontWeight: 600,
          color: '#191f28',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function StatDivider() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: '#ededf2', margin: '2px 0' }} />
}
