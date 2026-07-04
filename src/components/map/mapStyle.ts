import type { CSSProperties } from 'react'

/**
 * 지도 화면 공통 디자인 규격.
 * Figma "금사빠_moeum" 변수(color/violet/500 등)를 그대로 옮겨 지도 UI 전반의
 * 칩·토글·카드·팝업 색과 그림자를 한 곳에서 통일한다. 값이 바뀌면 여기만 고친다.
 */
export const mapTokens = {
  /** 활성 액센트 — color/violet/500 */
  violet: '#665bf7',
  violetPress: '#5a50e0',
  gray900: '#151519',
  gray800: '#222229',
  gray700: '#2f2f3b',
  gray600: '#5c5c72',
  gray500: '#86869f',
  gray100: '#f6f6fa',
  white: '#ffffff',
  black: '#0c0d0d',
  /** 상단 칩·토글 pill 그림자 (Figma shadow/0 계열을 지도 위 대비에 맞춰 소폭 강화) */
  chipShadow: '0 2px 8px rgba(21,21,21,0.08)',
  /** 하단 시트 그림자 */
  sheetShadow: '0 -4px 24px rgba(0,0,0,0.10)',
  /** 지도 위 팝업 카드 그림자 */
  popupShadow: '0 6px 24px rgba(0,0,0,0.16)',
  radiusPill: 999,
  radiusCard: 24,
} as const

/** 상단 상태 칩(전체/진행중/히스토리)·시트 토글 공통 pill 스타일 */
export function pillStyle(active: boolean): CSSProperties {
  return {
    all: 'unset',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '9px 16px',
    borderRadius: mapTokens.radiusPill,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    cursor: 'pointer',
    color: active ? mapTokens.white : mapTokens.gray600,
    background: active ? mapTokens.violet : mapTokens.white,
    boxShadow: mapTokens.chipShadow,
    WebkitTapHighlightColor: 'transparent',
  }
}
