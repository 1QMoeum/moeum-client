import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/i18n'

/**
 * 언어 선택 드롭다운. HomePage / MainPage 같은 진입점에서 재사용.
 * 선택 시 i18next 가 localStorage 에 자동 저장 → 다음 진입에도 유지.
 */
export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'ko') as LanguageCode

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    void i18n.changeLanguage(e.target.value)
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      aria-label="Language"
      style={{
        appearance: 'none',
        WebkitAppearance: 'none',
        padding: '6px 28px 6px 12px',
        fontSize: 14,
        color: 'var(--color-text-primary)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        cursor: 'pointer',
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b95a1' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  )
}