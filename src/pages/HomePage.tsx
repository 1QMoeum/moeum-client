import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import MoeumLogo from '@/components/ui/MoeumLogo'
import Button from '@/components/ui/Button'
import LanguageSelector from '@/components/ui/LanguageSelector'

/**
 * 시작 화면.
 * - 자동 로그인 정보(refresh) 있으면 → 간편 로그인
 * - 없으면 → KYC: 현재 언어가 'ko' = 국내(KG이니시스), 그 외 = 외국인(여권 OCR)
 */
export default function HomePage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const hasRefresh = useAuthStore((s) => !!s.refreshToken)
  const isKorean = (i18n.resolvedLanguage ?? 'ko') === 'ko'
  const ctaPath = hasRefresh ? '/login' : isKorean ? '/kyc' : '/kyc/foreign'

  return (
    <main
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '0 24px 48px',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 상단 — 언어 선택 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: 16,
        }}
      >
        <LanguageSelector />
      </div>

      {/* 중앙 — 로고 + 설명 */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <MoeumLogo height={44} />
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 17,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            maxWidth: 320,
            wordBreak: 'keep-all',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-line',
          }}
        >
          {t('home.tagline')}
        </p>
      </section>

      {/* 하단 CTA */}
      <Button onClick={() => navigate(ctaPath)}>
        {hasRefresh ? t('home.ctaLogin') : t('home.ctaStart')}
      </Button>
    </main>
  )
}