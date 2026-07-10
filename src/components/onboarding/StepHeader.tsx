interface Props {
  /** 스텝 번호 (예: "01"). 없으면 표시 생략. */
  step?: string
  /** 여러 줄이면 \n 으로 구분 (pre-line 렌더) */
  title: string
  desc?: string
}

/** 온보딩 스텝 헤더 — 번호(01·02·03) + 타이틀 + 설명. */
export default function StepHeader({ step, title, desc }: Props) {
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {step && (
        <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', color: '#5c5c72' }}>
          {step}
        </span>
      )}
      <h2
        style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 600,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#1c1d1f',
          whiteSpace: 'pre-line',
        }}
      >
        {title}
      </h2>
      {desc && (
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: '-0.02em',
            color: '#5c5c72',
            whiteSpace: 'pre-line',
          }}
        >
          {desc}
        </p>
      )}
    </header>
  )
}
