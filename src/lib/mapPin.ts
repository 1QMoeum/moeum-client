/**
 * 카카오 CustomOverlay 용 커스텀 핀(pill) 생성 유틸.
 *
 * 지도 SDK 오버레이는 HTMLElement 를 직접 넘겨야 해서 이 파일에 한해 DOM 생성을 사용한다.
 * (앱 UI 의 직접 DOM 조작이 아니라, 지도 레이어에 한정된 불가피한 사용)
 */

export interface CategoryMeta {
  emoji: string
  color: string
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  BIRTHDAY_CAFE: { emoji: '☕', color: '#b45309' },
  AD: { emoji: '📺', color: '#7c3aed' },
  GIFT: { emoji: '🎁', color: '#e64980' },
  COFFEE_TRUCK: { emoji: '🚚', color: '#0d9488' },
  GOODS: { emoji: '🛍️', color: '#2563eb' },
  DONATION: { emoji: '💗', color: '#f03e3e' },
  WREATH: { emoji: '💐', color: '#12b886' },
}

const DEFAULT_META: CategoryMeta = { emoji: '📍', color: '#665bf7' }

/** 카테고리 → 이모지·색상 (알 수 없는 값은 기본 핀) */
export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? DEFAULT_META
}

interface PinOptions {
  /** 핀에 표시할 텍스트 (textContent 로 넣어 XSS 안전) */
  label: string
  color: string
  /** 대표 핀(줌아웃)은 강조 크기, 개별 핀은 작게 */
  emphasized?: boolean
  onClick: () => void
}

/** pill 모양 핀 요소 생성 — body(라벨) + 아래쪽 꼬리. CustomOverlay content 로 사용. */
export function createPinElement({ label, color, emphasized = false, onClick }: PinOptions): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'position:relative;cursor:pointer;'

  const body = document.createElement('div')
  body.textContent = label
  body.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    `padding:${emphasized ? '6px 11px' : '4px 9px'}`,
    `background:${color}`,
    'color:#fff',
    'border-radius:999px',
    `font-size:${emphasized ? '13px' : '12px'}`,
    'font-weight:600',
    'white-space:nowrap',
    'border:1.5px solid #fff',
    'box-shadow:0 2px 6px rgba(0,0,0,.25)',
  ].join(';')

  const tail = document.createElement('div')
  tail.style.cssText = [
    'position:absolute',
    'left:50%',
    'top:100%',
    'transform:translateX(-50%)',
    'width:0',
    'height:0',
    'border-left:5px solid transparent',
    'border-right:5px solid transparent',
    `border-top:6px solid ${color}`,
  ].join(';')

  wrap.appendChild(body)
  wrap.appendChild(tail)
  wrap.addEventListener('click', onClick)
  return wrap
}

interface FlagOptions {
  color: string
  /** 선택된 깃발은 살짝 크게 */
  selected?: boolean
  onClick: () => void
}

/**
 * 깃발 모양 핀 요소 생성 — 깃대 + 물결 깃발. CustomOverlay content 로 사용.
 * 깃대 하단이 좌표에 오도록 xAnchor 0.2 / yAnchor 1 로 올린다.
 */
export function createFlagElement({ color, selected = false, onClick }: FlagOptions): HTMLElement {
  const wrap = document.createElement('div')
  const size = selected ? 40 : 30
  wrap.style.cssText = [
    'cursor:pointer',
    `width:${size}px`,
    `height:${(size * 34) / 28}px`,
    'filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))',
    'transition:width .15s,height .15s',
  ].join(';')
  // 고정 템플릿 SVG (color 는 내부 상수 팔레트 값이라 안전)
  wrap.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 3.2c4.6-1.9 8.1 1.7 12.6 1.7 2 0 3.4-.3 5.4-1v10.9c-2 .7-3.4 1-5.4 1-4.5 0-8-3.6-12.6-1.7V3.2Z" fill="${color}"/>
      <rect x="4.7" y="1.4" width="2.3" height="31.2" rx="1.15" fill="#33404f"/>
    </svg>`
  wrap.addEventListener('click', onClick)
  return wrap
}

interface InfoBubbleOptions {
  /** 대표/아티스트 이미지 (없으면 이모지) */
  imageUrl?: string
  emoji: string
  /** 상단 회색 줄 — 동네 이름 등 */
  region: string
  title: string
  /** 하단 회색 줄 — "1,128명 참여" · "82% 달성" 등 */
  subtitle: string
  /** 주면 우측 화살표 노출 + 클릭 시 상세 이동. 없으면 화살표 숨김·비클릭 */
  onClick?: () => void
}

/**
 * 깃발 선택 시 핀 근처에 뜨는 팝업 카드 (Figma "지도 - 깃발 클릭 시").
 * 원형 아바타 + 지역/제목/서브 3줄 + 우측 화살표. CustomOverlay content 로 사용.
 */
export function createInfoBubbleElement({
  imageUrl,
  emoji,
  region,
  title,
  subtitle,
  onClick,
}: InfoBubbleOptions): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = [
    'display:flex',
    'align-items:center',
    'gap:14px',
    'background:#fff',
    'border-radius:24px',
    'padding:12px 18px 12px 12px',
    'box-shadow:0 6px 24px rgba(0,0,0,.16)',
    'max-width:270px',
    onClick ? 'cursor:pointer' : 'cursor:default',
  ].join(';')

  const thumb = document.createElement('div')
  thumb.style.cssText =
    'width:56px;height:56px;border-radius:50%;background:#f1f3f5;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;'
  if (imageUrl) {
    const img = document.createElement('img')
    img.src = imageUrl
    img.alt = title
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;'
    thumb.appendChild(img)
  } else {
    thumb.textContent = emoji
  }

  const col = document.createElement('div')
  col.style.cssText = 'display:flex;flex-direction:column;gap:1px;min-width:0;'
  const line = (text: string, css: string) => {
    const el = document.createElement('div')
    el.textContent = text
    el.style.cssText = `white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.5;${css}`
    col.appendChild(el)
  }
  if (region) line(region, 'font-size:14px;color:#5c5c72;font-weight:500;letter-spacing:-.02em;')
  line(title, 'font-size:16px;color:#0c0d0d;font-weight:600;letter-spacing:-.02em;')
  line(subtitle, 'font-size:14px;color:#5c5c72;font-weight:500;letter-spacing:-.02em;')

  wrap.appendChild(thumb)
  wrap.appendChild(col)

  if (onClick) {
    const caret = document.createElement('div')
    caret.style.cssText = 'flex-shrink:0;display:flex;color:#86869f;'
    caret.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    wrap.appendChild(caret)
    wrap.addEventListener('click', onClick)
  }
  return wrap
}
