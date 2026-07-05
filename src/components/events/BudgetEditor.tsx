import { useState } from 'react'
import { X, Plus, Trash2, Check } from 'lucide-react'
import { useCancelBudget, useCreateBudgets, useUpdateBudget } from '@/hooks/events'
import { ErrorCode } from '@/constants/errorCodes'
import { ApiError } from '@/api/client'
import Button from '@/components/ui/Button'
import type { BudgetItem, BudgetItemInput } from '@/types/event'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

/** ApiError 의 도메인 status → 사용자 메시지. 그 외엔 서버 메시지 그대로. */
function budgetErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case ErrorCode.BUDGET_NOT_OWNER:
        return '총대만 사용 계획을 변경할 수 있어요.'
      case ErrorCode.BUDGET_NOT_PENDING:
        return '이미 집행·취소된 항목은 변경할 수 없어요.'
      case ErrorCode.BUDGET_LOCKED_AFTER_FUNDING:
        return '모금이 시작되어 금액·업체는 변경할 수 없어요.'
      case ErrorCode.EVENT_NOT_ACTIVE:
        return '진행 중인 모금에서만 추가할 수 있어요.'
      default:
        return err.message
    }
  }
  return '잠시 후 다시 시도해 주세요.'
}

/** 빈 신규 항목 한 줄. */
const emptyDraft = (): BudgetItemInput => ({
  title: '',
  amount: 0,
  scheduledDate: '',
  vendorName: '',
  vendorAccount: '',
})

/** 항목 입력값 검증 — 비면 false. */
function isValid(item: BudgetItemInput): boolean {
  return (
    item.title.trim() !== '' &&
    item.amount > 0 &&
    item.scheduledDate !== '' &&
    item.vendorName.trim() !== '' &&
    item.vendorAccount.trim() !== ''
  )
}

interface Props {
  eventId: number
  items: BudgetItem[]
  /** 모금이 시작됐는지(참여자 입금 발생). true면 PENDING 항목도 금액·업체 수정이 잠긴다(취소만 가능). */
  fundingStarted: boolean
  onClose: () => void
}

/**
 * 사용 계획 편집(총대). 기존 PENDING 항목 수정/취소 + 신규 항목 추가.
 * 모든 변경은 서버가 반환한 전체 계획으로 캐시를 갱신한다(훅 onSuccess).
 */
export default function BudgetEditor({ eventId, items, fundingStarted, onClose }: Props) {
  const [drafts, setDrafts] = useState<BudgetItemInput[]>([])
  const createMut = useCreateBudgets(eventId)

  const addDraft = () => setDrafts((d) => [...d, emptyDraft()])
  const patchDraft = (i: number, patch: Partial<BudgetItemInput>) =>
    setDrafts((d) => d.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const removeDraft = (i: number) => setDrafts((d) => d.filter((_, idx) => idx !== i))

  const draftsValid = drafts.length > 0 && drafts.every(isValid)

  const saveDrafts = () => {
    if (!draftsValid) return
    createMut.mutate(
      { items: drafts },
      { onSuccess: () => setDrafts([]) },
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사용 계획 편집"
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
        {/* 헤더 */}
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
            사용 계획 편집
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
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
            }}
          >
            <X size={22} />
          </button>
        </header>

        {/* 본문 (스크롤) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fundingStarted && (
            <p
              style={{
                margin: 0,
                padding: '10px 14px',
                background: '#fff4e6',
                borderRadius: 10,
                fontSize: 12.5,
                color: '#e8590c',
                letterSpacing: '-0.01em',
                lineHeight: 1.5,
              }}
            >
              모금이 시작되어 기존 항목의 금액·업체는 변경할 수 없어요. 항목 취소와 신규 추가만 가능해요.
            </p>
          )}

          {/* 기존 항목 */}
          {items.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionLabel>기존 항목</SectionLabel>
              {items.map((item) => (
                <ExistingItem
                  key={item.budgetId}
                  eventId={eventId}
                  item={item}
                  fundingStarted={fundingStarted}
                />
              ))}
            </section>
          )}

          {/* 신규 항목 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionLabel>새 항목 추가</SectionLabel>

            {drafts.map((draft, i) => (
              <div
                key={i}
                style={{ border: '1px solid #ededf2', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <ItemFields
                  value={draft}
                  onChange={(patch) => patchDraft(i, patch)}
                />
                <button
                  type="button"
                  onClick={() => removeDraft(i)}
                  style={{
                    all: 'unset',
                    alignSelf: 'flex-end',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    color: '#fa5252',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Trash2 size={14} /> 삭제
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addDraft}
              style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '12px 0',
                border: '1.5px dashed #d0d5dd',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: '#6b7684',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Plus size={16} /> 항목 추가
            </button>

            {createMut.isError && (
              <span style={{ fontSize: 12.5, color: '#e03e3e', letterSpacing: '-0.01em' }}>
                {budgetErrorMessage(createMut.error)}
              </span>
            )}

            {drafts.length > 0 && (
              <Button
                variant="solid"
                onClick={saveDrafts}
                disabled={!draftsValid || createMut.isPending}
              >
                {createMut.isPending ? '추가 중…' : `${drafts.length}개 항목 추가하기`}
              </Button>
            )}
          </section>
        </div>

        {/* 푸터 */}
        <div
          style={{
            padding: '12px 20px calc(14px + env(safe-area-inset-bottom))',
            borderTop: '1px solid #f1f3f5',
          }}
        >
          <Button variant="brand" onClick={onClose}>
            완료
          </Button>
        </div>
      </div>
    </div>
  )
}

/** 기존 항목 한 줄 — PENDING && 모금 전이면 수정 가능, PENDING이면 취소 가능. */
function ExistingItem({
  eventId,
  item,
  fundingStarted,
}: {
  eventId: number
  item: BudgetItem
  fundingStarted: boolean
}) {
  const editable = item.status === 'PENDING' && !fundingStarted
  const cancellable = item.status === 'PENDING'

  const [editing, setEditing] = useState(false)
  // vendorAccount 는 조회 응답에 없으므로 수정 시 다시 입력받는다.
  const [form, setForm] = useState<BudgetItemInput>({
    title: item.title,
    amount: item.amount,
    scheduledDate: item.scheduledDate,
    vendorName: item.vendorName,
    vendorAccount: '',
  })

  const updateMut = useUpdateBudget(eventId)
  const cancelMut = useCancelBudget(eventId)

  const save = () => {
    if (!isValid(form)) return
    updateMut.mutate(
      { budgetId: item.budgetId, body: form },
      { onSuccess: () => setEditing(false) },
    )
  }

  if (editing) {
    return (
      <div style={{ border: '1px solid #8B5CF6', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ItemFields value={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
        {updateMut.isError && (
          <span style={{ fontSize: 12.5, color: '#e03e3e', letterSpacing: '-0.01em' }}>
            {budgetErrorMessage(updateMut.error)}
          </span>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setEditing(false)}
            style={ghostBtnStyle}
          >
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isValid(form) || updateMut.isPending}
            style={{
              ...ghostBtnStyle,
              color: '#fff',
              background: isValid(form) ? '#8B5CF6' : '#c4b5fd',
              border: 'none',
              cursor: isValid(form) && !updateMut.isPending ? 'pointer' : 'not-allowed',
            }}
          >
            <Check size={15} /> {updateMut.isPending ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    )
  }

  const dimmed = item.status === 'CANCELLED'

  return (
    <div style={{ border: '1px solid #ededf2', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: dimmed ? '#adb5bd' : '#191f28',
            letterSpacing: '-0.01em',
            textDecoration: dimmed ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em', marginTop: 2 }}>
          {won(item.amount)} · {item.scheduledDate.replaceAll('-', '.')}
        </div>
      </div>

      {cancelMut.isError ? (
        <span style={{ fontSize: 11.5, color: '#e03e3e', maxWidth: 120, textAlign: 'right' }}>
          {budgetErrorMessage(cancelMut.error)}
        </span>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {editable && (
            <button type="button" onClick={() => setEditing(true)} style={smallBtnStyle}>
              수정
            </button>
          )}
          {cancellable && (
            <button
              type="button"
              onClick={() => cancelMut.mutate(item.budgetId)}
              disabled={cancelMut.isPending}
              style={{ ...smallBtnStyle, color: '#fa5252' }}
            >
              {cancelMut.isPending ? '취소 중…' : '취소'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** 항목 입력 필드 묶음 (제목·금액·집행예정일·업체·계좌). */
function ItemFields({
  value,
  onChange,
}: {
  value: BudgetItemInput
  onChange: (patch: Partial<BudgetItemInput>) => void
}) {
  return (
    <>
      <Field label="항목명">
        <input
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="예) 생일 카페 대관비"
          style={inputStyle}
        />
      </Field>
      <Field label="예상 금액(원)">
        <input
          value={value.amount === 0 ? '' : value.amount.toLocaleString('ko-KR')}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '')
            onChange({ amount: digits === '' ? 0 : Number(digits) })
          }}
          inputMode="numeric"
          placeholder="0"
          style={{ ...inputStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
        />
      </Field>
      <Field label="집행 예정일">
        <input
          type="date"
          value={value.scheduledDate}
          onChange={(e) => onChange({ scheduledDate: e.target.value })}
          style={dateInputStyle}
        />
      </Field>
      <Field label="업체명">
        <input
          value={value.vendorName}
          onChange={(e) => onChange({ vendorName: e.target.value })}
          placeholder="예) ○○카페"
          style={inputStyle}
        />
      </Field>
      <Field label="업체 입금 계좌">
        <input
          value={value.vendorAccount}
          onChange={(e) => onChange({ vendorAccount: e.target.value })}
          placeholder="예) 하나 123-456789-01234"
          style={inputStyle}
        />
      </Field>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7684', letterSpacing: '-0.01em' }}>{label}</span>
      {children}
    </label>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 13, fontWeight: 700, color: '#8b95a1', letterSpacing: '-0.01em' }}>{children}</span>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 12px',
  border: '1px solid #e5e8eb',
  borderRadius: 10,
  fontSize: 14.5,
  color: '#191f28',
  outline: 'none',
  letterSpacing: '-0.01em',
  background: '#fff',
}

/**
 * date 인풋 전용 — iOS Safari 에서 텍스트 인풋 스타일을 그대로 쓰면 높이·정렬이 깨지므로
 * appearance 를 초기화하고 높이를 다른 필드와 맞춘다. (탭하면 네이티브 날짜 피커는 그대로 뜸)
 */
const dateInputStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 44,
  minWidth: 0,
  appearance: 'none',
  WebkitAppearance: 'none',
  textAlign: 'left',
}

const smallBtnStyle: React.CSSProperties = {
  all: 'unset',
  padding: '7px 12px',
  borderRadius: 8,
  border: '1px solid #e5e8eb',
  fontSize: 13,
  fontWeight: 600,
  color: '#4b5563',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
}

const ghostBtnStyle: React.CSSProperties = {
  all: 'unset',
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: '11px 0',
  borderRadius: 10,
  border: '1px solid #e5e8eb',
  fontSize: 14,
  fontWeight: 600,
  color: '#4b5563',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
}
