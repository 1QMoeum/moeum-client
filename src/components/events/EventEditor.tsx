import { useState } from 'react'
import { X } from 'lucide-react'
import { useUpdateEvent } from '@/hooks/events'
import { ErrorCode } from '@/constants/errorCodes'
import { ApiError } from '@/api/client'
import Button from '@/components/ui/Button'
import type { EventDetailResponse } from '@/types/event'

const VIOLET = '#665bf7'

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

interface Props {
  event: EventDetailResponse
  onClose: () => void
}

/**
 * 이벤트 수정(총대) — 소개·기간·진행시간. PATCH 후 상세 캐시가 갱신된다.
 * 진행시간은 선택이며 시작/종료를 함께 비우거나 함께 채워야 한다.
 */
export default function EventEditor({ event, onClose }: Props) {
  const [description, setDescription] = useState(event.description ?? '')
  const [startDate, setStartDate] = useState(event.startDate)
  const [endDate, setEndDate] = useState(event.endDate)
  const [startTime, setStartTime] = useState(toHm(event.operatingStartTime))
  const [endTime, setEndTime] = useState(toHm(event.operatingEndTime))

  const updateMut = useUpdateEvent(event.eventId)

  const periodValid = startDate !== '' && endDate !== '' && endDate >= startDate
  const timePaired = (startTime === '') === (endTime === '') // 둘 다 비거나 둘 다 채움
  const valid = periodValid && timePaired

  const save = () => {
    if (!valid || updateMut.isPending) return
    updateMut.mutate(
      {
        description: description.trim() || undefined,
        startDate,
        endDate,
        operatingStartTime: startTime || undefined,
        operatingEndTime: endTime || undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이벤트 수정"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '92vh',
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px 12px',
            borderBottom: '1px solid #f1f3f5',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#191f28', letterSpacing: '-0.02em' }}>
            이벤트 수정
          </h2>
          <button type="button" onClick={onClose} aria-label="닫기" style={closeBtnStyle}>
            <X size={22} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={fieldLabelStyle}>소개</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이벤트를 소개하는 내용을 적어주세요."
              rows={4}
              maxLength={5000}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 92, lineHeight: 1.6 }}
            />
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabelStyle}>시작일</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabelStyle}>종료일</span>
              <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </label>
          </div>
          {!periodValid && startDate !== '' && endDate !== '' && (
            <span style={{ fontSize: 12.5, color: '#e03e3e', letterSpacing: '-0.01em', marginTop: -8 }}>
              종료일은 시작일 이후여야 해요.
            </span>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabelStyle}>진행 시작 (선택)</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabelStyle}>진행 종료 (선택)</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
            </label>
          </div>
          {!timePaired && (
            <span style={{ fontSize: 12.5, color: '#e03e3e', letterSpacing: '-0.01em', marginTop: -8 }}>
              진행 시작·종료 시간을 함께 입력해 주세요.
            </span>
          )}

          {updateMut.isError && (
            <span style={{ fontSize: 12.5, color: '#e03e3e', letterSpacing: '-0.01em' }}>
              {updateErrorMessage(updateMut.error)}
            </span>
          )}
        </div>

        <div style={{ padding: '12px 20px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid #f1f3f5' }}>
          <Button
            variant="solid"
            onClick={save}
            disabled={!valid || updateMut.isPending}
            style={{ background: valid && !updateMut.isPending ? VIOLET : undefined, borderRadius: 24 }}
          >
            {updateMut.isPending ? '저장 중…' : '수정 완료'}
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

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: '#6b7684',
  letterSpacing: '-0.01em',
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
