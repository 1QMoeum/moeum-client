import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft, Pencil } from 'lucide-react'
import { useRecommendVenues, useVenueDetail } from '@/hooks/venues'
import { useKakaoMap } from '@/hooks/useKakaoMap'
import { useKeyboardInset } from '@/hooks/useKeyboardInset'
import { useAuthStore } from '@/store/auth'
import { toErrorMessage } from '@/api/client'
import Button from '@/components/ui/Button'
import FadeImage from '@/components/ui/FadeImage'
import IllustrationLoading from '@/components/ui/IllustrationLoading'
import { venueImageSrc, venueThumbSrc, venueTypeLabel } from '@/types/venue'
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
  const userName = useAuthStore((s) => s.userName)
  const recommend = useRecommendVenues()
  const keyboardInset = useKeyboardInset()

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
        title={
          userName
            ? `${userName}님을 위한\n맞춤형 플랜을 생성하는 중이에요!`
            : '맞춤형 플랜을\n생성하는 중이에요!'
        }
        desc="조금만 기다려주세요."
        onBack={() => {
          cancelledRef.current = true
          recommend.reset()
        }}
      />
    )
  }

  return (
    // 피그마(1404:27321·27353)처럼 옅은 회색 바탕 위에 흰 시트/카드가 뜬다
    <main style={{ minHeight: '100dvh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
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
              color: '#1c1d1f',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={26} />
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1c1d1f', letterSpacing: '-0.02em' }}>
            AI 플래너
          </h1>
        </header>

        {view === 'input' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '28px 0 0' }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#5c5c72', letterSpacing: '-0.02em' }}>01</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#1c1d1f',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.5,
                }}
              >
                어떤 이벤트를
                <br />
                준비하고 있나요?
              </h2>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#5c5c72', letterSpacing: '-0.02em' }}>
                원하는 조건을 아래에 입력해주세요.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '28px 0 0' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#73787e', letterSpacing: '-0.02em' }}>예시</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                {EXAMPLE_QUERIES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setQuery(ex)}
                    style={{
                      all: 'unset',
                      boxSizing: 'border-box',
                      padding: '8px 16px',
                      borderRadius: '0 50px 50px 12px',
                      background: '#e3e1ff',
                      fontSize: 14,
                      color: '#2f2f3b',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.5,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }} />

            {/* 하단 입력 시트 — 키보드가 열리면 keyboardInset 만큼 올라가 키보드 위에 붙는다 */}
            <div
              style={{
                position: 'sticky',
                bottom: keyboardInset,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                background: '#fff',
                borderRadius: '32px 32px 0 0',
                margin: '0 -20px',
                padding: keyboardInset > 0 ? '20px 20px 16px' : '20px 20px calc(20px + env(safe-area-inset-bottom))',
                boxShadow: '0 0 16px rgba(21,21,21,0.04)',
              }}
            >
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="새로운 대화를 시도해보세요"
                rows={2}
                maxLength={200}
                style={{
                  boxSizing: 'border-box',
                  width: '100%',
                  minHeight: 72,
                  padding: '16px 20px',
                  border: 'none',
                  background: '#fff',
                  boxShadow: '0 0 16px rgba(21,21,21,0.08)',
                  borderRadius: 12,
                  fontSize: 16, // 16px 미만이면 iOS 사파리가 포커스 시 화면을 확대한다
                  fontWeight: 500,
                  color: '#151519',
                  letterSpacing: '-0.02em',
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
                    padding: '12px 16px',
                    background: '#fff5f5',
                    borderRadius: 12,
                    color: '#e03e3e',
                    fontSize: 14,
                  }}
                >
                  <AlertCircle size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                  {toErrorMessage(recommend.error)}
                </div>
              )}

              <Button variant="primary" onClick={submit} disabled={query.trim() === '' || recommend.isPending} style={{ borderRadius: 32 }}>
                {recommend.isPending ? 'AI가 플랜을 찾는 중…' : 'AI 플랜 추천 받기'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 입력한 조건 — 라벨 + 수정 아이콘 행, 아래 보라 말풍선 (피그마 1404:27354) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: '#222229', letterSpacing: '-0.02em' }}>
                  입력한 조건
                </span>
                <button
                  type="button"
                  onClick={() => setView('input')}
                  aria-label="조건 수정"
                  style={{ all: 'unset', display: 'flex', padding: 4, margin: -4, cursor: 'pointer', color: '#222229', WebkitTapHighlightColor: 'transparent' }}
                >
                  <Pencil size={20} strokeWidth={2} />
                </button>
              </div>
              <span
                style={{
                  alignSelf: 'flex-start',
                  boxSizing: 'border-box',
                  maxWidth: '100%',
                  padding: '8px 24px',
                  background: '#e3e1ff',
                  borderRadius: '0 50px 50px 12px',
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#2f2f3b',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.5,
                }}
              >
                {query.trim()}
              </span>
            </div>

            <span style={{ fontSize: 16, fontWeight: 600, color: '#1c1d1f', margin: '24px 0 12px' }}>
              AI 추천 플랜
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 0 32px' }}>
              {results.length === 0 && (
                <span style={{ fontSize: 14, color: '#86869f', textAlign: 'center', padding: '32px 0' }}>
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

/**
 * 플랜 순위 배지 — overlay 면 썸네일 위에 겹치는 반투명 글래스 필 (피그마 button_status),
 * 아니면 흰 배경 위에서 보이도록 보라 칩으로 표시(플랜 상세).
 * 순위 기준은 프런트 규칙: 1순위 BEST, 나머지 중 최저가 '가성비 추천', 그 외 'AI 추천'.
 */
function PlanBadge({ label, overlay = false }: { label: string; overlay?: boolean }) {
  return (
    <span
      style={{
        ...(overlay
          ? {
              position: 'absolute' as const,
              top: 8,
              left: 8,
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }
          : {
              alignSelf: 'flex-start' as const,
              background: '#e3e1ff',
            }),
        padding: '4px 12px',
        borderRadius: 24,
        fontSize: 14,
        fontWeight: 500,
        color: '#665bf7',
        letterSpacing: '-0.02em',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
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
        alignItems: 'center',
        gap: 16,
        padding: 20,
        borderRadius: 12,
        background: '#fff',
        boxShadow: '0 0 16px rgba(21,21,21,0.04)',
      }}
    >
      {/* 썸네일 — 배지가 이미지 위에 겹친다 */}
      <div
        style={{
          position: 'relative',
          width: 106,
          height: 106,
          borderRadius: 8,
          background: '#f1f3f5',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
        }}
      >
        {venueImageSrc(venue.imageUrl) ? (
          <FadeImage
            src={venueThumbSrc(venue.imageUrl, 240)}
            fallbackSrc={venueImageSrc(venue.imageUrl)}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          '📍'
        )}
        <PlanBadge label={badge} overlay />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              flexShrink: 0,
              padding: '0 8px',
              borderRadius: 4,
              background: '#e3e1ff',
              fontSize: 14,
              fontWeight: 500,
              color: '#665bf7',
              letterSpacing: '-0.02em',
              lineHeight: 1.5,
            }}
          >
            플랜 {rank}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#0c0d0d',
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {venue.title}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 14, letterSpacing: '-0.02em', lineHeight: 1.5 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ width: 60, flexShrink: 0, color: '#86869f' }}>예상 비용</span>
            <span style={{ fontWeight: 500, color: '#2f2f3b' }}>
              {manwon(venue.price)}
              {venue.deposit != null && ` (보증금 ${manwon(venue.deposit)})`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ width: 60, flexShrink: 0, color: '#86869f' }}>위치</span>
            <span style={{ fontWeight: 500, color: '#2f2f3b' }}>
              {venue.siDo} {venue.siGunGu}
            </span>
          </div>
        </div>

        {/* 글자 확대 설정 기기에서 버튼 안 텍스트가 꺾이지 않도록 nowrap, 좁으면 버튼 단위로 줄바꿈 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onDetail}
            style={{
              all: 'unset',
              boxSizing: 'border-box',
              padding: '4px 12px',
              borderRadius: 24,
              background: '#fff',
              boxShadow: '0 0 8px rgba(21,21,21,0.08)',
              fontSize: 14,
              fontWeight: 500,
              color: '#5c5c72',
              letterSpacing: '-0.02em',
              lineHeight: 1.5,
              whiteSpace: 'nowrap',
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
              boxSizing: 'border-box',
              padding: '4px 12px',
              borderRadius: 24,
              background: '#665bf7',
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.5,
              whiteSpace: 'nowrap',
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
    <main style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
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
              src={venueThumbSrc(venue.imageUrl, 960)}
              fallbackSrc={venueImageSrc(venue.imageUrl)}
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
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1c1d1f',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PlanBadge label={badge} />
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1c1d1f', letterSpacing: '-0.02em', lineHeight: 1.5 }}>
              {venue.title}
            </h2>
            <span style={{ fontSize: 14, color: '#5c5c72' }}>
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

          {/* 추천 이유 */}
          {venue.reason && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '12px 20px',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 0 8px rgba(21, 21, 21, 0.04)',
              }}
            >
              <span style={{ fontSize: 14, color: '#86869f', letterSpacing: '-0.02em' }}>추천 이유</span>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#5c5c72', lineHeight: 1.5, letterSpacing: '-0.02em' }}>
                {venue.reason}
              </p>
            </div>
          )}

          {/* 장소 소개 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1c1d1f' }}>장소 소개</span>
            {isPending ? (
              <div style={{ height: 64, borderRadius: 12, background: '#f1f3f5' }} />
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: '#5c5c72', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {detail?.description || '소개 정보가 없어요.'}
              </p>
            )}
            {detail?.rentalStartTime && detail.rentalEndTime && (
              <span style={{ fontSize: 14, color: '#86869f' }}>
                🕐 대관 {detail.rentalStartTime.slice(0, 5)} ~ {detail.rentalEndTime.slice(0, 5)}
              </span>
            )}
          </div>

          {/* 위치 — 지도 + 장소명 + 주소 */}
          {detail && detail.latitude != null && detail.longitude != null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1c1d1f' }}>위치</span>
              <VenueMap latitude={detail.latitude} longitude={detail.longitude} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1c1d1f' }}>{venue.title}</span>
                {detail.address && (
                  <span style={{ fontSize: 14, color: '#86869f' }}>{detail.address}</span>
                )}
              </div>
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
          <Button variant="primary" onClick={onStart} style={{ borderRadius: 32 }}>
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span style={{ fontSize: 14, color: '#86869f' }}>{label}</span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#1c1d1f',
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
  return <div style={{ width: 1, alignSelf: 'stretch', background: '#ededf2', margin: '4px 0' }} />
}
