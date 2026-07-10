import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toErrorMessage } from '@/api/client'
import { useKycLoginForeign } from '@/hooks/auth'
import PinScreen from '@/components/auth/PinScreen'
import CtaButton from '@/components/onboarding/CtaButton'

interface NavState {
  passport?: File
  selfie?: File
}

/**
 * 외국인 재인증 로그인 — refresh 잃은 사용자가 여권 + 셀피 + PIN 으로 다시 토큰을 받는 경로.
 * 정상 진입은 KycForeignPage 에서 state 로 파일이 넘어옴 — 이 경우 파일 UI 없이 PIN 만 노출.
 * URL 직접 진입한 fallback 케이스에만 업로드 UI 를 노출한다. 6자리 입력 시 자동 로그인.
 */
export default function KycLoginForeignPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const initial = location.state as NavState | null
  const passportInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const [passport, setPassport] = useState<File | null>(initial?.passport ?? null)
  const [selfie, setSelfie] = useState<File | null>(initial?.selfie ?? null)
  const { mutate: login, isPending, error } = useKycLoginForeign()
  // 위저드에서 정상 진입하면 파일이 이미 있음 — 업로드 UI 는 URL 직접 진입 fallback 케이스에만 노출.
  const needsUpload = !initial?.passport || !initial?.selfie

  const handleComplete = (pin: string) => {
    if (!passport || !selfie) return
    login({ passport, selfie, pin }, { onSuccess: () => navigate('/', { replace: true }) })
  }

  return (
    <PinScreen
      onBack={() => navigate(-1)}
      title={t('kycLoginForeign.title')}
      desc={t('kycLoginForeign.subtitle')}
      errorMessage={error ? toErrorMessage(error) : null}
      pending={isPending}
      pendingLabel={t('kycLoginForeign.submitting')}
      onComplete={handleComplete}
    >
      {needsUpload && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            ref={passportInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setPassport(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
          />
          <input
            ref={selfieInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
          />
          <CtaButton
            variant="secondary"
            label={passport ? `✓ ${passport.name}` : t('kycForeign.uploadLabel')}
            onClick={() => passportInputRef.current?.click()}
            disabled={isPending}
          />
          <CtaButton
            variant="secondary"
            label={selfie ? `✓ ${selfie.name}` : t('kycForeign.uploadSelfie')}
            onClick={() => selfieInputRef.current?.click()}
            disabled={isPending}
          />
        </div>
      )}
    </PinScreen>
  )
}
