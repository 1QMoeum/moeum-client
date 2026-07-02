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
  CAFE: { emoji: '☕', color: '#b45309' },
  SUBWAY: { emoji: '🚇', color: '#2563eb' },
  DIGITAL_SIGNAGE: { emoji: '📺', color: '#7c3aed' },
  BUS: { emoji: '🚌', color: '#0d9488' },
  BANNER: { emoji: '🎌', color: '#dc2626' },
  ONLINE: { emoji: '💻', color: '#0ea5e9' },
}

const DEFAULT_META: CategoryMeta = { emoji: '📍', color: '#3b82f6' }

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
  /** 대표 이미지 (없으면 카테고리 이모지) */
  imageUrl?: string
  emoji: string
  /** 상단 회색 줄 — 동네 이름 등 */
  region: string
  title: string
  /** 하단 강조 줄 — "82% 달성" 등 */
  subtitle: string
  onClick: () => void
}

/** 깃발 클릭 시 핀 위에 뜨는 말풍선 카드. CustomOverlay content 로 사용. */
export function createInfoBubbleElement({
  imageUrl,
  emoji,
  region,
  title,
  subtitle,
  onClick,
}: InfoBubbleOptions): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'position:relative;cursor:pointer;'

  const body = document.createElement('div')
  body.style.cssText = [
    'display:flex',
    'align-items:center',
    'gap:10px',
    'background:rgba(255,255,255,.96)',
    'border-radius:14px',
    'padding:9px 14px 9px 9px',
    'box-shadow:0 4px 16px rgba(0,0,0,.18)',
    'max-width:230px',
  ].join(';')

  const thumb = document.createElement('div')
  thumb.style.cssText =
    'width:46px;height:46px;border-radius:10px;background:#f1f3f5;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;'
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
    el.style.cssText = `white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${css}`
    col.appendChild(el)
  }
  if (region) line(region, 'font-size:11px;color:#8b95a1;font-weight:400;')
  line(title, 'font-size:13.5px;color:#191f28;font-weight:600;')
  line(subtitle, 'font-size:12px;color:#6b7684;font-weight:500;')

  const tail = document.createElement('div')
  tail.style.cssText = [
    'position:absolute',
    'left:50%',
    'top:100%',
    'transform:translateX(-50%)',
    'width:0',
    'height:0',
    'border-left:7px solid transparent',
    'border-right:7px solid transparent',
    'border-top:8px solid rgba(255,255,255,.96)',
  ].join(';')

  body.appendChild(thumb)
  body.appendChild(col)
  wrap.appendChild(body)
  wrap.appendChild(tail)
  wrap.addEventListener('click', onClick)
  return wrap
}
