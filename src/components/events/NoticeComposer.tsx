import { useEffect, useRef, useState } from 'react'
import { X, ImagePlus } from 'lucide-react'
import { useCreatePost, useUpdatePost } from '@/hooks/events'
import { useUploadImage } from '@/hooks/files'
import { ErrorCode } from '@/constants/errorCodes'
import { ApiError } from '@/api/client'
import Button from '@/components/ui/Button'
import type { EventPost } from '@/types/event'

const VIOLET = '#665bf7'
const MAX_IMAGES = 4

/** ApiError 도메인 status → 사용자 메시지. */
function postErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === ErrorCode.BUDGET_NOT_OWNER) return '총대만 공지를 작성할 수 있어요.'
    return err.message
  }
  return '잠시 후 다시 시도해 주세요.'
}

/** 첨부 이미지 한 장 — 기존(fileId 보유) 또는 새로 고른 파일. */
type Img =
  | { kind: 'existing'; fileId: number; url: string }
  | { kind: 'new'; file: File; previewUrl: string }

const imgSrc = (img: Img) => (img.kind === 'existing' ? img.url : img.previewUrl)

/** 수정 대상 공지의 기존 이미지 → Img[] (fileId 있는 것만 유지 편집 가능). */
function existingImages(post?: EventPost): Img[] {
  if (!post) return []
  const ids = post.imageFileIds ?? []
  return post.imageUrls
    .map((url, i) => ({ url, fileId: ids[i] }))
    .filter((x): x is { url: string; fileId: number } => typeof x.fileId === 'number')
    .map((x) => ({ kind: 'existing', fileId: x.fileId, url: x.url }))
}

interface Props {
  eventId: number
  /** 있으면 수정 모드, 없으면 작성 모드. */
  post?: EventPost
  onClose: () => void
}

/**
 * 공지 작성·수정(총대). 제목·내용 + 이미지 다중 첨부.
 * 제출 시 새 이미지는 /v1/files 로 업로드해 fileId 를 얻고, 기존 이미지는 fileId 를 그대로 실어
 * 순서대로 fileIds 를 만들어 보낸다(수정은 이미지 목록 완전 교체).
 */
export default function NoticeComposer({ eventId, post, onClose }: Props) {
  const editing = post !== undefined
  const [title, setTitle] = useState(post?.title ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [images, setImages] = useState<Img[]>(() => existingImages(post))
  const [pickError, setPickError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const createMut = useCreatePost(eventId)
  const updateMut = useUpdatePost(eventId)
  const uploadMut = useUploadImage()
  const submitting = createMut.isPending || updateMut.isPending || uploadMut.isPending

  // 새로 고른 이미지의 objectURL 정리
  useEffect(
    () => () => {
      images.forEach((img) => {
        if (img.kind === 'new') URL.revokeObjectURL(img.previewUrl)
      })
    },
    [images],
  )

  const valid = title.trim() !== '' && content.trim() !== ''

  const onPick = (files: FileList | null) => {
    if (!files) return
    setPickError(null)
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      setPickError(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.`)
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

  const submit = async () => {
    if (!valid || submitting) return
    try {
      const fileIds = await Promise.all(
        images.map((img) => (img.kind === 'existing' ? Promise.resolve(img.fileId) : uploadMut.mutateAsync(img.file))),
      )
      const body = { title: title.trim(), content: content.trim(), fileIds }
      if (editing) updateMut.mutate({ postId: post.postId, body }, { onSuccess: onClose })
      else createMut.mutate(body, { onSuccess: onClose })
    } catch {
      /* uploadMut.error 로 아래에 표시 */
    }
  }

  const activeMut = editing ? updateMut : createMut
  const errorMsg = activeMut.isError
    ? postErrorMessage(activeMut.error)
    : uploadMut.isError
      ? postErrorMessage(uploadMut.error)
      : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? '공지 수정' : '공지 작성'}
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
            {editing ? '공지 수정' : '공지 작성'}
          </h2>
          <button type="button" onClick={onClose} aria-label="닫기" style={closeBtnStyle}>
            <X size={22} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={fieldLabelStyle}>제목</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 카페 계약 완료되었습니다!"
              maxLength={60}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={fieldLabelStyle}>내용</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="참여자에게 전할 소식을 적어주세요."
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 108, lineHeight: 1.6 }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={fieldLabelStyle}>사진 첨부 (선택)</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <div key={imgSrc(img)} style={{ position: 'relative', width: 76, height: 76 }}>
                  <img
                    src={imgSrc(img)}
                    alt=""
                    style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 12, display: 'block' }}
                  />
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
            {pickError && <span style={{ fontSize: 12.5, color: '#e03e3e', letterSpacing: '-0.01em' }}>{pickError}</span>}
          </div>

          {errorMsg && <span style={{ fontSize: 12.5, color: '#e03e3e', letterSpacing: '-0.01em' }}>{errorMsg}</span>}
        </div>

        <div style={{ padding: '12px 20px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid #f1f3f5' }}>
          <Button
            variant="solid"
            onClick={() => void submit()}
            disabled={!valid || submitting}
            style={{ background: valid && !submitting ? VIOLET : undefined, borderRadius: 24 }}
          >
            {submitting ? '올리는 중…' : editing ? '공지 수정하기' : '공지 올리기'}
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
