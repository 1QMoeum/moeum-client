import { useState, type FormEvent } from 'react'
import LegalDongMap from '@/components/map/LegalDongMap'

/**
 * 법정동 경계 렌더 데모/테스트 페이지 (/map).
 * 법정동코드 10자리를 입력하면 해당 동 경계를 지도에 그린다.
 */
export default function MapDemoPage() {
  const [input, setInput] = useState('1111018600') // 종로구 신영동
  const [code, setCode] = useState(input)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setCode(input.trim())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid #e5e7eb' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="법정동코드 10자리 (예: 1111018600)"
          aria-label="법정동코드"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          그리기
        </button>
      </form>

      <div style={{ flex: 1, minHeight: 0 }}>
        <LegalDongMap legalDongCode={code} />
      </div>
    </div>
  )
}
