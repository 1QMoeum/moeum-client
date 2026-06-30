import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertCircle, ImagePlus, ChevronDown } from 'lucide-react'
import { useCreateEvent } from '@/hooks/events'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { toErrorMessage } from '@/api/client'
import Button from '@/components/ui/Button'
import LocationPicker, { type PickedLocation } from '@/components/map/LocationPicker'
import { EVENT_CATEGORIES, type CreateEventRequest } from '@/types/event'

/** 목표 금액 빠른 선택 (만원 단위) */
const BUDGET_PRESETS = [50, 100, 300]

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
  background: '#f9fafb',
  border: '1.5px solid #f2f4f6',
  borderRadius: 14,
  fontSize: 15,
  color: '#191f28',
  letterSpacing: '-0.01em',
  outline: 'none',
}

type Step = 1 | 2 | 3

/**
 * 이벤트(모금) 생성 위저드 — 생성자=총대.
 * 01 기본정보 → 02 예산 → 03 장소(MANUAL: 지도 직접입력). 마지막에 한 번에 생성한다.
 * 기간 4002 · 위치없음 4003 · venue없음 5000 은 status 로 분기해 안내.
 */
export default function CreateEventPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const create = useCreateEvent()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)

  // 01 기본정보
  const [title, setTitle] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 02 예산
  const [budgetName, setBudgetName] = useState('') // 사용계획(BUDGET) 후속 단계용 — 생성 요청엔 미포함
  const [manwon, setManwon] = useState('') // 만원 단위 입력

  // 03 장소
  const [location, setLocation] = useState<PickedLocation | null>(null)

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  const targetAmount = Number(manwon) * 10_000
  const periodInvalid = !!startDate && !!endDate && endDate < startDate

  const step1Valid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !!category &&
    !!startDate &&
    !!endDate &&
    !periodInvalid
  const step2Valid = targetAmount > 0
  const step3Valid = location !== null

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPhotoPreview(URL.createObjectURL(file))
    // 대표사진 업로드 API(representativeFileId 발급)는 아직 없어 미리보기만 한다.
  }

  const goBack = () => {
    if (step === 1) navigate(-1)
    else setStep((s) => (s - 1) as Step)
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
    if (!location) return
    const body: CreateEventRequest = {
      title: title.trim(),
      description: description.trim(),
      category,
      startDate,
      endDate,
      targetAmount,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      siDo: location.siDo,
      siGunGu: location.siGunGu,
      legalDong: location.legalDong,
      legalDongCode: location.legalDongCode,
    }
    create.mutate(body, {
      onSuccess: (res) => navigate(`/events/${res.eventId}`, { replace: true }),
    })
  }

  const next = () => {
    if (step === 1 && step1Valid) setStep(2)
    else if (step === 2 && step2Valid) setStep(3)
    else if (step === 3 && step3Valid) submit()
  }

  const nextDisabled =
    (step === 1 && !step1Valid) ||
    (step === 2 && !step2Valid) ||
    (step === 3 && (!step3Valid || create.isPending))

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

        {/* 진행 표시 */}
        <div style={{ display: 'flex', gap: 6, padding: '16px 4px 4px' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background: n <= step ? '#8B5CF6' : '#ededf2',
                transition: 'background 0.2s ease',
              }}
            />
          ))}
        </div>

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
          <StepTitle
            no={`0${step}`}
            title={
              step === 1
                ? '이벤트의 기본 정보를\n입력해주세요'
                : step === 2
                  ? '이벤트의 목표 예산을\n설정해주세요'
                  : '이벤트가 열릴 장소를\n지정해주세요'
            }
          />

          {step === 1 && (
            <>
              <Field label="이벤트명">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="이벤트 이름을 입력하세요"
                  maxLength={60}
                  style={INPUT_STYLE}
                />
              </Field>

              <Field label="대표 사진">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    width: '100%',
                    height: photoPreview ? 'auto' : 96,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: '#f9fafb',
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
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
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
                  accept="image/*"
                  onChange={onPickPhoto}
                  style={{ display: 'none' }}
                />
              </Field>

              <Field label="이벤트 설명">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="어떤 이벤트인지 소개해 주세요"
                  rows={4}
                  style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 96, lineHeight: 1.5 }}
                />
              </Field>

              <Field label="이벤트 카테고리">
                <div style={{ position: 'relative' }}>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      ...INPUT_STYLE,
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      paddingRight: 40,
                      color: category ? '#191f28' : '#adb5bd',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="" disabled>
                      카테고리를 선택하세요
                    </option>
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    color="#adb5bd"
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                </div>
              </Field>

              <Field label="모금 기간">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ ...INPUT_STYLE, flex: 1 }}
                  />
                  <span style={{ color: '#adb5bd', fontSize: 14 }}>~</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ ...INPUT_STYLE, flex: 1 }}
                  />
                </div>
                {periodInvalid && (
                  <span style={{ fontSize: 12, color: '#e03e3e', letterSpacing: '-0.01em' }}>
                    종료일이 시작일보다 빠를 수 없어요
                  </span>
                )}
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="예산명">
                <input
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="예) 카페 대관 + 굿즈 제작"
                  maxLength={40}
                  style={INPUT_STYLE}
                />
              </Field>

              <Field label="목표 금액">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    padding: '14px 16px',
                    background: '#f9fafb',
                    borderRadius: 14,
                    border: '1.5px solid #f2f4f6',
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
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#8b95a1' }}>만원</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {BUDGET_PRESETS.map((v) => (
                    <Chip key={v} label={`${v}만원`} active={manwon === String(v)} onClick={() => setManwon(String(v))} />
                  ))}
                  <Chip label="모름" active={false} onClick={() => setManwon('')} />
                </div>
                <span style={{ fontSize: 12, color: '#adb5bd', letterSpacing: '-0.01em' }}>
                  ※ 직접 입력도 가능해요.{targetAmount > 0 ? ` (${targetAmount.toLocaleString('ko-KR')}원)` : ''}
                </span>
              </Field>
            </>
          )}

          {step === 3 && (
            <Field label="모임 위치">
              <LocationPicker value={location} onChange={setLocation} />
            </Field>
          )}

          {step === 3 && errorText && (
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
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: '#fff',
            padding: '12px 0 calc(20px + env(safe-area-inset-bottom))',
          }}
        >
          <Button variant="solid" onClick={next} disabled={nextDisabled}>
            {step === 3 ? (create.isPending ? '만드는 중…' : '완료') : '다음'}
          </Button>
        </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={LABEL_STYLE}>{label}</span>
      {children}
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
