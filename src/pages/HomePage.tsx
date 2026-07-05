import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore, type UserType } from '@/store/auth'
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
 * - 없으면 → 언어(로케일) 로 사용자 유형을 결정하고 CTA 하나만 노출. 한국어 = 국내 KYC,
 *   그 외 = 외국인 여권 KYC. 언어 선택기(우측 상단)가 곧 유형 전환 수단이다.
 *   CTA 클릭 시 store 에 userType 을 저장해 이후 계좌 연동 라우팅·잔액 조회 provider 분기에 재사용.
 */
export default function HomePage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const hasRefresh = useAuthStore((s) => !!s.refreshToken)
  const setUserType = useAuthStore((s) => s.setUserType)

  const isKorean = (i18n.resolvedLanguage ?? 'ko') === 'ko'
  const inferredType: UserType = isKorean ? 'DOMESTIC' : 'FOREIGN'

  const startKyc = () => {
    setUserType(inferredType)
    navigate(inferredType === 'DOMESTIC' ? '/kyc' : '/kyc/foreign')
  }

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

      {/* 하단 CTA — 언어별 1개만 노출 (한국어 = 국내, 그 외 = 여권) */}
      {hasRefresh ? (
        <Button onClick={() => navigate('/login')}>{t('home.ctaLogin')}</Button>
      ) : (
        <Button onClick={startKyc}>
          {isKorean ? t('home.ctaDomestic') : t('home.ctaForeign')}
        </Button>
      )}

      <InstallPromptModal open={showInstall} onDismiss={handleDismissInstall} />
    </main>
  )
}