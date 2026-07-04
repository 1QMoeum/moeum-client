import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import MoeumLogo from '@/components/ui/MoeumLogo'
import Button from '@/components/ui/Button'
import LanguageSelector from '@/components/ui/LanguageSelector'
import InstallPromptModal from '@/components/pwa/InstallPromptModal'
import { useIsStandalone } from '@/hooks/pwa'

const INSTALL_DISMISSED_AT_KEY = 'moeum:pwa-install-dismissed-at'
const INSTALL_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24h

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

  const standalone = useIsStandalone()
  const [showInstall, setShowInstall] = useState(false)

  // 이미 홈화면 설치된 상태(standalone)이거나 24h 내 dismiss 이력이 있으면 노출 안 함.
  useEffect(() => {
    if (standalone) return
    const dismissedAt = Number(localStorage.getItem(INSTALL_DISMISSED_AT_KEY) ?? 0)
    if (Date.now() - dismissedAt < INSTALL_PROMPT_COOLDOWN_MS) return
    const timer = setTimeout(() => setShowInstall(true), 800)
    return () => clearTimeout(timer)
  }, [standalone])

  const handleDismissInstall = () => {
    localStorage.setItem(INSTALL_DISMISSED_AT_KEY, String(Date.now()))
    setShowInstall(false)
  }

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

      <InstallPromptModal open={showInstall} onDismiss={handleDismissInstall} />
    </main>
  )
}