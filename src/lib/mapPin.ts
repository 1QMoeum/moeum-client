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
  RESTAURANT: { emoji: '🍽️', color: '#dc2626' },
  SHOP: { emoji: '🛍️', color: '#7c3aed' },
  CULTURE: { emoji: '🎭', color: '#2563eb' },
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
