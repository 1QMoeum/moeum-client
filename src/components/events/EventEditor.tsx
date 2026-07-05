import { useEffect, useRef, useState } from 'react'
import { X, ImagePlus } from 'lucide-react'
import { useUpdateEvent } from '@/hooks/events'
import { useUploadImage } from '@/hooks/files'
import { ErrorCode } from '@/constants/errorCodes'
import { ApiError } from '@/api/client'
import Button from '@/components/ui/Button'
import type { EventDetailResponse } from '@/types/event'

const VIOLET = '#665bf7'
const MAX_IMAGES = 10

/** "HH:mm:ss" | null → "HH:mm" (input[type=time] 용). */
const toHm = (t: string | null) => (t ? t.slice(0, 5) : '')

/** ApiError 도메인 status → 사용자 메시지. */
function updateErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case ErrorCode.BUDGET_NOT_OWNER:
        return '총대만 이벤트를 수정할 수 있어요.'
      case ErrorCode.EVENT_NOT_ACTIVE:
        return '진행 중인 모금만 수정할 수 있어요.'
      case ErrorCode.EVENT_INVALID_PERIOD:
        return '종료일은 시작일 이후여야 해요.'
      default:
        return err.message
    }
  }
  return '잠시 후 다시 시도해 주세요.'
}

/** 소개 첨부 이미지 — 기존(fileId 보유) 또는 새로 고른 파일. */
type Img =
  | { kind: 'existing'; fileId: number; url: string }
  | { kind: 'new'; file: File; previewUrl: string }

const imgSrc = (img: Img) => (img.kind === 'existing' ? img.url : img.previewUrl)

/** 상세의 introImages(seq순) → Img[] (기존 이미지 유지 편집용). */
function initImages(event: EventDetailResponse): Img[] {
  return [...(event.introImages ?? [])]
    .sort((a, b) => a.seq - b.seq)
    .map((x) => ({ kind: 'existing', fileId: x.fileId, url: x.url }))
}

interface Props {
  event: EventDetailResponse
  onClose: () => void
}

/**
 * 이벤트 수정(총대) — 소개 본문(글) · 소개 사진(갤러리) · 기간 · 진행시간.
 * 저장 시 새 사진은 /v1/files 로 업로드해 fileId 를 얻고, 기존 사진은 fileId 를 그대로 실어
 * 순서대로 introImageFileIds 를 만들어 보낸다(이미지 목록 완전 교체).
 */
export default function EventEditor({ event, onClose }: Props) {
  const [description, setDescription] = useState(event.description ?? '')
  const [images, setImages] = useState<Img[]>(() => initImages(event))
  // 시작일·종료일은 생성 후 변경 불가 — 원래 값을 그대로 유지해 전송한다.
  const startDate = event.startDate
  const endDate = event.endDate
  // 진행(이벤트) 날짜 범위 — 생성 시엔 없고 여기서 처음 입력·수정한다.
  const [eventStartDate, setEventStartDate] = useState(event.eventStartDate ?? '')
  const [eventEndDate, setEventEndDate] = useState(event.eventEndDate ?? '')
  const [startTime, setStartTime] = useState(toHm(event.operatingStartTime))
  const [endTime, setEndTime] = useState(toHm(event.operatingEndTime))
  const [pickError, setPickError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const updateMut = useUpdateEvent(event.eventId)
  const uploadMut = useUploadImage()
  const submitting = updateMut.isPending || uploadMut.isPending

  useEffect(
    () => () => {
      images.forEach((img) => {
        if (img.kind === 'new') URL.revokeObjectURL(img.previewUrl)
      })
    },
    [images],
  )

  const periodValid = startDate !== '' && endDate !== '' && endDate >= startDate
  const timePaired = (startTime === '') === (endTime === '')
  // 진행 날짜는 선택 — 둘 다 비었거나(미입력) 둘 다 채워 종료 ≥ 시작이어야 유효.
  const eventDatePaired = (eventStartDate === '') === (eventEndDate === '')
  const eventDateOrdered = !eventStartDate || !eventEndDate || eventEndDate >= eventStartDate
  const eventDateValid = eventDatePaired && eventDateOrdered
  const valid = periodValid && timePaired && eventDateValid

  const onPick = (files: FileList | null) => {
    if (!files) return
    setPickError(null)
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      setPickError(`사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.`)
      return
    }
    const next: Img[] = Array.from(files)
      .slice(0, room)
      .map((file) => ({ kind: 'new', file, previewUrl: URL.createObjectURL(file) }))
    setImages((prev) => [...prev, ...next])
  }

  const removeImage = (i: number) =>
    setImages((prev) => {
      const target = prev[i]
      if (target.kind === 'new') URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, idx) => idx !== i)
    })

  const save = async () => {
    if (!valid || submitting) return
    try {
      const introImageFileIds = await Promise.all(
        images.map((img) => (img.kind === 'existing' ? Promise.resolve(img.fileId) : uploadMut.mutateAsync(img.file))),
      )
      updateMut.mutate(
        {
          description: description.trim() || undefined,
          introImageFileIds,
          startDate,
          endDate,
          eventStartDate: eventStartDate || undefined,
          eventEndDate: eventEndDate || undefined,
          operatingStartTime: startTime || undefined,
          operatingEndTime: endTime || undefined,
        },
        { onSuccess: onClose },
      )
    } catch {
      /* uploadMut.error 로 표시 */
    }
  }

  const errorMsg = updateMut.isError
    ? updateErrorMessage(updateMut.error)
    : uploadMut.isError
      ? updateErrorMessage(uploadMut.error)
      : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이벤트 수정"
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '92vh', background: '#fff', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}
      >
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 12px', borderBottom: '1px solid #f1f3f5' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#191f28', letterSpacing: '-0.02em' }}>이벤트 수정</h2>
          <button type="button" onClick={onClose} aria-label="닫기" style={closeBtnStyle}>
            <X size={22} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 소개 본문 */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={fieldLabelStyle}>이벤트 소개</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이벤트를 소개하는 내용을 적어주세요."
              rows={5}
              maxLength={5000}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 108, lineHeight: 1.6 }}
            />
          </label>

          {/* 소개 사진 (갤러리) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={fieldLabelStyle}>소개 사진 (선택)</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <div key={imgSrc(img)} style={{ position: 'relative', width: 76, height: 76 }}>
                  <img src={imgSrc(img)} alt="" style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="사진 삭제"
                    style={{
                      all: 'unset',
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(21,21,25,0.82)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="사진 추가"
                  style={{
                    all: 'unset',
                    width: 76,
                    height: 76,
                    borderRadius: 12,
                    border: '1.5px dashed #d0d5dd',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    color: '#8b95a1',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <ImagePlus size={20} />
                  <span style={{ fontSize: 11 }}>
                    {images.length}/{MAX_IMAGES}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => {
                onPick(e.target.files)
                e.target.value = ''
              }}
              style={{ display: 'none' }}
            />
            {pickError && <span style={errTextStyle}>{pickError}</span>}
          </div>

          {/* 진행 날짜 (범위) */}
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={dateFieldStyle}>
              <span style={fieldLabelStyle}>진행 시작일 (선택)</span>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                style={nativeInputStyle}
              />
            </label>
            <label style={dateFieldStyle}>
              <span style={fieldLabelStyle}>진행 종료일 (선택)</span>
              <input
                type="date"
                value={eventEndDate}
                min={eventStartDate || undefined}
                onChange={(e) => setEventEndDate(e.target.value)}
                style={nativeInputStyle}
              />
            </label>
          </div>
          {!eventDatePaired && <span style={errTextStyle}>진행 시작일·종료일을 함께 입력해 주세요.</span>}
          {eventDatePaired && !eventDateOrdered && (
            <span style={errTextStyle}>진행 종료일은 시작일 이후여야 해요.</span>
          )}

          {/* 진행 시간 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={dateFieldStyle}>
              <span style={fieldLabelStyle}>진행 시작 (선택)</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={nativeInputStyle} />
            </label>
            <label style={dateFieldStyle}>
              <span style={fieldLabelStyle}>진행 종료 (선택)</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={nativeInputStyle} />
            </label>
          </div>
          {!timePaired && <span style={errTextStyle}>진행 시작·종료 시간을 함께 입력해 주세요.</span>}

          {errorMsg && <span style={errTextStyle}>{errorMsg}</span>}
        </div>

        <div style={{ padding: '12px 20px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid #f1f3f5' }}>
          <Button variant="solid" onClick={() => void save()} disabled={!valid || submitting} style={{ background: valid && !submitting ? VIOLET : undefined, borderRadius: 24 }}>
            {submitting ? '저장 중…' : '수정 완료'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  border: '1px solid #e5e8eb',
  borderRadius: 12,
  fontSize: 14.5,
  color: '#191f28',
  outline: 'none',
  letterSpacing: '-0.01em',
  background: '#fff',
  fontFamily: 'inherit',
}

/** date/time 필드 wrapper — 플렉스 자식이 네이티브 컨트롤의 큰 고유폭 때문에
 *  줄어들지 못해 오른쪽으로 삐져나가는 문제를 막으려면 minWidth:0 이 필수. */
const dateFieldStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

/** iOS 네이티브 date/time 컨트롤 정규화(가운데 정렬·과도한 고유폭 제거). */
const nativeInputStyle: React.CSSProperties = {
  ...inputStyle,
  minWidth: 0,
  WebkitAppearance: 'none',
  appearance: 'none',
  textAlign: 'left',
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: '#6b7684',
  letterSpacing: '-0.01em',
}

const errTextStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: '#e03e3e',
  letterSpacing: '-0.01em',
  marginTop: -8,
}

const closeBtnStyle: React.CSSProperties = {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 10,
  cursor: 'pointer',
  color: '#8b95a1',
  WebkitTapHighlightColor: 'transparent',
}
