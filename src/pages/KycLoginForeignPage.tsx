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
  file?: File
}

/**
 * 외국인 재인증 로그인 — refresh 잃은 사용자가 여권 + PIN 으로 다시 토큰을 받는 경로.
 * KycForeignPage 에서 진입(file state 포함) 하거나, URL 직접 진입 시 다시 업로드.
 */
export default function KycLoginForeignPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const initialFile = (location.state as NavState | null)?.file ?? null
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(initialFile)
  const [pin, setPin] = useState('')
  const { mutate: login, isPending, error } = useKycLoginForeign()

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    if (picked) setFile(picked)
  }

  const handleSubmit = () => {
    if (!file || pin.length !== 6) return
    login({ file, pin }, { onSuccess: () => navigate('/', { replace: true }) })
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>{t('kycLoginForeign.title')}</h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        {t('kycLoginForeign.subtitle')}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handlePick}
        style={{ display: 'none' }}
      />

      {!file && (
        <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
          {t('kycForeign.uploadLabel')}
        </Button>
      )}
      {file && (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          {file.name}
        </p>
      )}

      <PinInput value={pin} onChange={setPin} disabled={isPending} />

      {error && <ErrorBanner message={toErrorMessage(error)} />}

      <Button
        variant="solid"
        onClick={handleSubmit}
        disabled={isPending || !file || pin.length !== 6}
      >
        {isPending ? t('kycLoginForeign.submitting') : t('kycLoginForeign.submit')}
      </Button>
    </Screen>
  )
}