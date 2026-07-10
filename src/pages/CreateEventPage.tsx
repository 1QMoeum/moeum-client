import { useRef, useState } from 'react'
import { Navigate, useLocation as useRouterLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertCircle, ImagePlus, ChevronDown, Calendar, Check } from 'lucide-react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { ko } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import { useCreateEvent } from '@/hooks/events'
import { useUploadImage } from '@/hooks/files'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { toErrorMessage } from '@/api/client'
import Button from '@/components/ui/Button'
import BottomSheet from '@/components/ui/BottomSheet'
import LocationPicker, { type PickedLocation } from '@/components/map/LocationPicker'
import { EVENT_CATEGORIES, categoryLabel, categoryImage, type CreateEventRequest } from '@/types/event'
import { venueTypeLabel } from '@/types/venue'
import type { AiPlanVenue } from '@/types/venue'

/** 목표 금액 빠른 선택 (만원 단위) */
const BUDGET_PRESETS = [50, 100, 300, 500]

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#6b7684',
  letterSpacing: '-0.01em',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 16px',
  background: '#fff',
  border: '1.5px solid #f0f0f4',
  borderRadius: 14,
  fontSize: 15,
  color: '#191f28',
  letterSpacing: '-0.01em',
  outline: 'none',
}

/** 하단 고정 바 — 피그마의 흰색 라운드 카드 (컨테이너 좌우 패딩 20px 를 상쇄해 풀폭) */
const FOOTER_STYLE: React.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  display: 'flex',
  gap: 12,
  background: '#fff',
  borderRadius: '32px 32px 0 0',
  margin: '0 -20px',
  padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
  boxShadow: '0 0 8px rgba(21,21,21,0.04)',
}

/** 확인/완료 화면의 흰색 카드 (배경 #fafafa 위) */
const CARD_STYLE: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  background: '#fff',
  borderRadius: 12,
  padding: '24px 20px',
  boxShadow: '0 0 8px rgba(21,21,21,0.04)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

/**
 * 위저드 스텝 — 피그마 기준 한 화면 한 질문.
 * 직접(MANUAL): 이름 → 사진 → 설명 → 기간 → 예산 → 장소 → 확인 (01~07)
 * AI: 이름 → 사진 → 설명 → 기간 → 확인 (01~05). 예산·장소는 선택한 플랜에서 온다
 * (서버가 venue 위치 자동복사, 목표 금액은 플랜 예상 비용 사용 — targetAmount 는 서버 필수값).
 */
type StepKey = 'title' | 'photo' | 'describe' | 'period' | 'budget' | 'location' | 'confirm'

const MANUAL_STEPS: StepKey[] = ['title', 'photo', 'describe', 'period', 'budget', 'location', 'confirm']
const AI_STEPS: StepKey[] = ['title', 'photo', 'describe', 'period', 'confirm']

const STEP_TITLES: Record<StepKey, string> = {
  title: '이벤트의 이름을\n입력해주세요',
  photo: '이벤트의 대표 사진을\n업로드해주세요',
  describe: '어떤 이벤트인지\n설명해주세요',
  period: '이벤트의 모금 기간을\n설정해주세요',
  budget: '이벤트의 목표 예산을\n설정해주세요',
  location: '이벤트가 열릴 장소를\n지정해주세요',
  confirm: '이벤트의 최종 기획안을\n확인해주세요',
}

/** 'YYYY-MM-DD' → 'YY.MM.DD' (확인/완료 화면 표기) */
const shortDate = (d: string) => d.slice(2).replace(/-/g, '.')

/** Date → 'YYYY-MM-DD' (로컬 타임존 기준 — toISOString 은 UTC 라 하루 밀릴 수 있음) */
const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * 이벤트(모금) 생성 위저드 — 생성자=총대. 마지막 확인 스텝에서 한 번에 생성한다.
 * AI 플래너에서 넘어온 venue(state.venue)가 있으면 AI 경로(selectedVenueId),
 * 없으면 지도 직접 선택(MANUAL). 기간 4002 · 위치없음 4003 · venue없음 5000 은 status 분기.
 */
export default function CreateEventPage() {
  const navigate = useNavigate()
  const routerState = useRouterLocation().state as { venue?: AiPlanVenue } | null
  const aiVenue = routerState?.venue ?? null
  const accessToken = useAuthStore((s) => s.accessToken)
  const create = useCreateEvent()
  const upload = useUploadImage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const steps = aiVenue ? AI_STEPS : MANUAL_STEPS
  const [stepIdx, setStepIdx] = useState(0)
  const step = steps[stepIdx]

  const [title, setTitle] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  /** 업로드 완료된 대표사진 fileId — 생성 요청의 representativeFileId 로 전달 */
  const [photoFileId, setPhotoFileId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [manwon, setManwon] = useState('') // 만원 단위 입력
  const [location, setLocation] = useState<PickedLocation | null>(null)
  /** 열려 있는 바텀시트 — 카테고리 선택 / 모금 기간 달력 */
  const [sheet, setSheet] = useState<'category' | 'period' | null>(null)
  /** 생성 완료된 이벤트 id — 완료 화면 표시용 */
  const [doneEventId, setDoneEventId] = useState<number | null>(null)

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  // AI 경로는 플랜 예상 비용을 목표 금액으로 사용한다 (서버 targetAmount 필수)
  const targetAmount = aiVenue ? aiVenue.price : Number(manwon) * 10_000
  const periodInvalid = !!startDate && !!endDate && endDate < startDate

  const stepValid: Record<StepKey, boolean> = {
    title: title.trim().length > 0,
    photo: !upload.isPending && !upload.error, // 대표 사진은 선택 입력
    describe: description.trim().length > 0 && !!category,
    period: !!startDate && !!endDate && !periodInvalid,
    budget: targetAmount > 0,
    location: location !== null,
    confirm: !create.isPending && !upload.isPending,
  }

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    // presigned URL → S3 PUT → 완료 알림. 성공하면 fileId 를 생성 요청에 연결한다.
    setPhotoFileId(null)
    upload.mutate(file, { onSuccess: (fileId) => setPhotoFileId(fileId) })
  }

  const goBack = () => {
    if (stepIdx === 0) navigate(-1)
    else setStepIdx((i) => i - 1)
  }

  const errorText = (() => {
    if (!create.error) return null
    switch (create.error.status) {
      case ErrorCode.EVENT_INVALID_PERIOD:
        return '모금 기간이 올바르지 않아요. 시작일과 종료일을 확인해 주세요.'
      case ErrorCode.EVENT_LOCATION_REQUIRED:
        return '모임 위치를 지도에서 선택해 주세요.'
      case ErrorCode.VENUE_NOT_FOUND:
        return '선택한 장소를 찾을 수 없어요. 위치를 다시 선택해 주세요.'
      default:
        return toErrorMessage(create.error)
    }
  })()

  const submit = () => {
    const base = {
      title: title.trim(),
      description: description.trim(),
      category,
      startDate,
      endDate,
      targetAmount,
      ...(photoFileId != null ? { representativeFileId: photoFileId } : {}),
    }
    let body: CreateEventRequest
    if (aiVenue) {
      // AI 경로 — 서버가 venue 위치를 자동 복사(create_type=AI)
      body = { ...base, selectedVenueId: aiVenue.venueId }
    } else {
      if (!location) return
      body = {
        ...base,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        siDo: location.siDo,
        siGunGu: location.siGunGu,
        legalDong: location.legalDong,
        legalDongCode: location.legalDongCode,
      }
    }
    create.mutate(body, {
      onSuccess: (res) => setDoneEventId(res.eventId),
    })
  }

  const next = () => {
    if (!stepValid[step]) return
    if (step === 'confirm') submit()
    else setStepIdx((i) => i + 1)
  }

  // ===== 완료 화면 — 새로운 이벤트가 만들어졌어요! =====
  if (doneEventId != null) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
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
            <h1 style={{ margin: 0, padding: '8px 4px', fontSize: 18, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em' }}>
              이벤트 생성
            </h1>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 0 0' }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#191f28', letterSpacing: '-0.02em', lineHeight: 1.35 }}>
              새로운 이벤트가 만들어졌어요!
            </h2>
            <span style={{ fontSize: 14, color: '#8b95a1', letterSpacing: '-0.01em' }}>
              설정한 시작일에 맞춰 모금이 자동으로 시작돼요.
            </span>
          </div>

          <div style={{ ...CARD_STYLE, marginTop: 24, alignItems: 'center', gap: 14, padding: '28px 20px' }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em', textAlign: 'center' }}>
              {title.trim()}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: '#f3f0ff',
                  color: '#8B5CF6',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {categoryLabel(category)}
              </span>
              <span style={{ fontSize: 13, color: '#8b95a1' }}>
                {shortDate(startDate)} ~ {shortDate(endDate)}
              </span>
            </div>
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#f1f3f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '8px 0',
              }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="이벤트 대표 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : categoryImage(category) ? (
                <img src={categoryImage(category)} alt="" style={{ width: 96, height: 96, objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 48 }}>🎉</span>
              )}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                color: '#6b7684',
                letterSpacing: '-0.01em',
                lineHeight: 1.55,
                textAlign: 'center',
                whiteSpace: 'pre-line',
              }}
            >
              {description.trim()}
            </p>
          </div>

          <div style={{ flex: 1 }} />

          <div style={FOOTER_STYLE}>
            <Button variant="ghost" onClick={() => navigate('/main', { replace: true })} style={{ borderRadius: 32 }}>
              홈으로
            </Button>
            <Button
              variant="solid"
              onClick={() => navigate(`/events/${doneEventId}`, { replace: true })}
              style={{ borderRadius: 32 }}
            >
              확인하기
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const isConfirm = step === 'confirm'

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
        {/* 상단 바 */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 8 }}>
          <button
            type="button"
            onClick={goBack}
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em' }}>
            이벤트 생성
          </h1>
        </header>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            padding: '20px 0 24px',
            overflowY: 'auto',
          }}
        >
          <StepTitle no={`0${stepIdx + 1}`} title={STEP_TITLES[step]} />

          {step === 'title' && (
            <Field label="이벤트명">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="이벤트 이름을 입력하세요"
                maxLength={60}
                style={INPUT_STYLE}
              />
            </Field>
          )}

          {step === 'photo' && (
            <Field label="대표 사진">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  width: '100%',
                  height: photoPreview ? 'auto' : 108,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#fff',
                  border: '1.5px dashed #d8dbe0',
                  borderRadius: 14,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  color: '#8b95a1',
                  fontSize: 14,
                  letterSpacing: '-0.01em',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="대표 사진 미리보기"
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <>
                    <ImagePlus size={18} strokeWidth={2.2} />
                    사진을 업로드 해주세요
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onPickPhoto}
                style={{ display: 'none' }}
              />
              {upload.isPending && (
                <span style={{ display: 'block', marginTop: 8, fontSize: 13, color: '#8b95a1' }}>
                  사진 업로드 중…
                </span>
              )}
              {upload.error && (
                <span style={{ display: 'block', marginTop: 8, fontSize: 13, color: '#e03e3e' }}>
                  {upload.error.message}
                </span>
              )}
            </Field>
          )}

          {step === 'describe' && (
            <>
              <Field label="이벤트 카테고리">
                <button
                  type="button"
                  onClick={() => setSheet('category')}
                  style={{
                    ...INPUT_STYLE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ color: category ? '#191f28' : '#adb5bd' }}>
                    {category ? categoryLabel(category) : '카테고리를 선택하세요'}
                  </span>
                  <ChevronDown size={18} color="#adb5bd" style={{ flexShrink: 0 }} />
                </button>
              </Field>

              <Field label="이벤트 설명">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="어떤 이벤트인지 소개해 주세요"
                  rows={4}
                  style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 108, lineHeight: 1.5 }}
                />
              </Field>
            </>
          )}

          {step === 'period' && (
            <Field label="모금 기간">
              <div style={{ display: 'flex', gap: 8 }}>
                <DateField placeholder="시작일" value={startDate} onClick={() => setSheet('period')} />
                <DateField placeholder="종료일" value={endDate} onClick={() => setSheet('period')} />
              </div>
              {periodInvalid && (
                <span style={{ fontSize: 12, color: '#e03e3e', letterSpacing: '-0.01em' }}>
                  종료일이 시작일보다 빠를 수 없어요
                </span>
              )}
            </Field>
          )}

          {step === 'budget' && (
            <Field label="목표 금액">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  padding: '14px 16px',
                  background: '#fff',
                  borderRadius: 14,
                  border: '1.5px solid #f0f0f4',
                }}
              >
                <input
                  inputMode="numeric"
                  placeholder="만원 단위로 입력"
                  value={manwon ? Number(manwon).toLocaleString('ko-KR') : ''}
                  onChange={(e) => setManwon(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#191f28',
                    letterSpacing: '-0.01em',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#8b95a1' }}>만원</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {BUDGET_PRESETS.map((v) => (
                  <Chip key={v} label={`${v}만원`} active={manwon === String(v)} onClick={() => setManwon(String(v))} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#adb5bd', letterSpacing: '-0.01em' }}>
                ※ 직접 입력도 가능해요.{targetAmount > 0 ? ` (${targetAmount.toLocaleString('ko-KR')}원)` : ''}
              </span>
            </Field>
          )}

          {step === 'location' && (
            <Field label="모임 위치">
              <LocationPicker value={location} onChange={setLocation} />
            </Field>
          )}

          {isConfirm && (
            <>
              {aiVenue && (
                <div style={{ ...CARD_STYLE, padding: '16px 20px' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#27282c', letterSpacing: '-0.01em' }}>
                    선택 플랜
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: '#f3f0ff',
                          color: '#8B5CF6',
                          fontSize: 12.5,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        AI 플랜
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#191f28',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {aiVenue.title}
                      </span>
                    </div>
                    <SummaryStat label="예상 비용" value={`${Math.round(aiVenue.price / 10_000).toLocaleString('ko-KR')}만원`} />
                    <SummaryStat label="위치" value={`${aiVenue.siDo} ${aiVenue.siGunGu} · ${venueTypeLabel(aiVenue.venueType)}`} />
                  </div>
                </div>
              )}

              <div style={CARD_STYLE}>
                <SummaryRow label="이벤트명" value={title.trim()} />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="이벤트 대표 사진"
                    style={{ width: '100%', borderRadius: 8, display: 'block', objectFit: 'cover' }}
                  />
                )}
                <SummaryRow label="이벤트 카테고리" value={categoryLabel(category)} />
                <SummaryRow label="이벤트 설명" value={description.trim()} />
                <SummaryRow label="모금 기간" value={`${shortDate(startDate)} ~ ${shortDate(endDate)}`} />
                {!aiVenue && (
                  <>
                    <SummaryRow label="목표 예산" value={`${Number(manwon).toLocaleString('ko-KR')}만원`} />
                    <SummaryRow label="이벤트 장소" value={location ? location.address : '모름'} />
                  </>
                )}
              </div>
            </>
          )}

          {isConfirm && errorText && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                background: '#fff5f5',
                borderRadius: 12,
                color: '#e03e3e',
                fontSize: 13,
                letterSpacing: '-0.01em',
              }}
            >
              <AlertCircle size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              {errorText}
            </div>
          )}
        </div>

        {/* 하단 고정 버튼 */}
        <div style={FOOTER_STYLE}>
          {isConfirm && (
            <Button variant="ghost" onClick={() => setStepIdx(0)} disabled={create.isPending} style={{ borderRadius: 32 }}>
              수정하기
            </Button>
          )}
          <Button variant="solid" onClick={next} disabled={!stepValid[step]} style={{ borderRadius: 32 }}>
            {isConfirm ? (create.isPending ? '만드는 중…' : '생성하기') : '다음'}
          </Button>
        </div>

        {sheet === 'category' && (
          <CategorySheet
            value={category}
            onClose={() => setSheet(null)}
            onSelect={(v) => {
              setCategory(v)
              setSheet(null)
            }}
          />
        )}
        {sheet === 'period' && (
          <PeriodSheet
            start={startDate}
            end={endDate}
            onClose={() => setSheet(null)}
            onApply={(s, e) => {
              setStartDate(s)
              setEndDate(e)
              setSheet(null)
            }}
          />
        )}
      </div>
    </main>
  )
}

function StepTitle({ no, title }: { no: string; title: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#adb5bd', letterSpacing: '0.02em' }}>{no}</span>
      <h2
        style={{
          margin: 0,
          fontSize: 21,
          fontWeight: 800,
          color: '#191f28',
          letterSpacing: '-0.02em',
          lineHeight: 1.35,
          whiteSpace: 'pre-line',
        }}
      >
        {title}
      </h2>
    </div>
  )
}

/**
 * 날짜 필드 — 피그마의 "시작일/종료일 + 달력 아이콘" 박스.
 * 탭하면 모금 기간 달력 바텀시트(PeriodSheet)를 연다.
 */
function DateField({ placeholder, value, onClick }: { placeholder: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '16px',
        background: '#fff',
        border: '1.5px solid #f0f0f4',
        borderRadius: 14,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: value ? 600 : 400,
          color: value ? '#191f28' : '#8b95a1',
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value ? shortDate(value) : placeholder}
      </span>
      <Calendar size={20} color="#b0b8c1" strokeWidth={2} style={{ flexShrink: 0 }} />
    </button>
  )
}

/** 카테고리 선택 바텀시트 — 아이콘 + 라벨 리스트, 선택 항목은 보라 테두리 + 체크. */
function CategorySheet({
  value,
  onClose,
  onSelect,
}: {
  value: string
  onClose: () => void
  onSelect: (value: string) => void
}) {
  return (
    <BottomSheet open title="이벤트 카테고리" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '56vh', overflowY: 'auto' }}>
        {EVENT_CATEGORIES.map((c) => {
          const selected = c.value === value
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onSelect(c.value)}
              style={{
                all: 'unset',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                borderRadius: 12,
                cursor: 'pointer',
                background: '#ffffff',
                border: `1px solid ${selected ? '#665bf7' : '#f2f2f6'}`,
                boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <img src={c.img} alt="" width={32} height={32} style={{ objectFit: 'contain', flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#151519',
                  letterSpacing: '-0.02em',
                }}
              >
                {c.label}
              </span>
              {selected && <Check size={20} color="#665bf7" strokeWidth={2.4} style={{ flexShrink: 0 }} />}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}

/** 달력 커스텀 변수 — react-day-picker 기본 스타일 위에 브랜드 보라 적용. */
const DAYPICKER_VARS = {
  '--rdp-accent-color': '#665bf7',
  '--rdp-accent-background-color': '#efedff',
  '--rdp-range_start-color': '#fff',
  '--rdp-range_end-color': '#fff',
  '--rdp-today-color': '#665bf7',
} as React.CSSProperties

/** 모금 기간 선택 바텀시트 — 달력에서 시작일~종료일 범위를 고른다. */
function PeriodSheet({
  start,
  end,
  onClose,
  onApply,
}: {
  start: string
  end: string
  onClose: () => void
  onApply: (start: string, end: string) => void
}) {
  const [range, setRange] = useState<DateRange | undefined>(() =>
    start ? { from: new Date(start), to: end ? new Date(end) : undefined } : undefined,
  )
  const complete = !!range?.from && !!range?.to

  return (
    <BottomSheet open title="모금 기간" onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          locale={ko}
          defaultMonth={range?.from}
          fixedWeeks
          style={DAYPICKER_VARS}
        />
      </div>
      <span style={{ fontSize: 13.5, color: '#5c5c72', textAlign: 'center', letterSpacing: '-0.01em', minHeight: 20 }}>
        {range?.from
          ? complete && range.to
            ? `${shortDate(toYmd(range.from))} ~ ${shortDate(toYmd(range.to))}`
            : '종료일을 선택해주세요'
          : '시작일을 선택해주세요'}
      </span>
      <Button
        variant="solid"
        disabled={!complete}
        onClick={() => range?.from && range.to && onApply(toYmd(range.from), toYmd(range.to))}
        style={{ borderRadius: 32 }}
      >
        선택 완료
      </Button>
    </BottomSheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={LABEL_STYLE}>{label}</span>
      {children}
    </div>
  )
}

/** 확인 카드 — 라벨 위, 값 아래 (피그마 기획안 확인) */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: '#27282c', letterSpacing: '-0.01em' }}>{label}</span>
      <span style={{ fontSize: 15, color: '#6a717d', letterSpacing: '-0.01em', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
        {value}
      </span>
    </div>
  )
}

/** 선택 플랜 카드 — 라벨·값 가로 배치 */
function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 13.5, letterSpacing: '-0.01em' }}>
      <span style={{ color: '#8b95a1', flexShrink: 0, width: 56 }}>{label}</span>
      <span style={{ color: '#4e5968', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        color: active ? '#8B5CF6' : '#6b7684',
        background: active ? '#f3f0ff' : '#f5f5f7',
        border: `1.5px solid ${active ? '#d9cffb' : 'transparent'}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}
