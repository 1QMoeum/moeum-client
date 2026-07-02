import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toErrorMessage } from '@/api/client'
import { useKycLoginForeign } from '@/hooks/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import ErrorBanner from '@/components/ui/ErrorBanner'
import PinInput from '@/components/auth/PinInput'

interface NavState {
  passport?: File
  selfie?: File
}

/**
 * 외국인 재인증 로그인 — refresh 잃은 사용자가 여권 + 셀피 + PIN 으로 다시 토큰을 받는 경로.
 * KycForeignPage 에서 진입(passport/selfie state 포함) 하거나, URL 직접 진입 시 다시 업로드.
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
  const [pin, setPin] = useState('')
  const { mutate: login, isPending, error } = useKycLoginForeign()

  const handlePickPassport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    if (picked) setPassport(picked)
  }
  const handlePickSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    if (picked) setSelfie(picked)
  }

  const handleSubmit = () => {
    if (!passport || !selfie || pin.length !== 6) return
    login({ passport, selfie, pin }, { onSuccess: () => navigate('/', { replace: true }) })
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>{t('kycLoginForeign.title')}</h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        {t('kycLoginForeign.subtitle')}
      </p>

      <input
        ref={passportInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handlePickPassport}
        style={{ display: 'none' }}
      />
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handlePickSelfie}
        style={{ display: 'none' }}
      />

      {!passport ? (
        <Button variant="ghost" onClick={() => passportInputRef.current?.click()} disabled={isPending}>
          {t('kycForeign.uploadLabel')}
        </Button>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          {passport.name}
        </p>
      )}

      {!selfie ? (
        <Button variant="ghost" onClick={() => selfieInputRef.current?.click()} disabled={isPending}>
          {t('kycForeign.uploadSelfie')}
        </Button>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          {selfie.name}
        </p>
      )}

      <PinInput value={pin} onChange={setPin} disabled={isPending} />

      {error && <ErrorBanner message={toErrorMessage(error)} />}

      <Button
        variant="solid"
        onClick={handleSubmit}
        disabled={isPending || !passport || !selfie || pin.length !== 6}
      >
        {isPending ? t('kycLoginForeign.submitting') : t('kycLoginForeign.submit')}
      </Button>
    </Screen>
  )
}