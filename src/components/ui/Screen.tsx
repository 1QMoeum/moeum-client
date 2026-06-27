import type { ReactNode } from 'react'

/** 공통 페이지 래퍼. 모바일 우선, 가운데 정렬. 디자인 나오면 교체. */
export default function Screen({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        minHeight: '100%',
      }}
    >
      {children}
    </main>
  )
}
