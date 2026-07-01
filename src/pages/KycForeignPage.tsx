import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toErrorMessage } from '@/api/client'
import { useVerifyForeignKyc } from '@/hooks/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import ErrorBanner from '@/components/ui/ErrorBanner'
import LanguageSelector from '@/components/ui/LanguageSelector'

/**
 * 외국인 KYC 진입 화면.
 * 1) 여권 사진 업로드
 * 2) /auth/kyc/foreign/verify (multipart) → 정보 추출 + newUser 판별
 * 3) 정보 확인 → newUser=true: /signup/foreign, false: /kyc-login/foreign
 * 두 다음 페이지 모두 파일을 다시 verify 하므로 state 로 file 전달.
 */
export default function KycForeignPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { mutate: verify, isPending, error, data, reset } = useVerifyForeignKyc()

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    if (!picked) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(picked)
    setPreviewUrl(URL.createObjectURL(picked))
    reset()
  }

  const handleVerify = () => {
    if (!file) return
    verify(file)
  }

  const handleContinue = () => {
    if (!file || !data) return
    const navState = {
      file,
      name: data.name,
      passportCountry: data.passportCountry,
      expiryAt: data.expiryAt,
    }
    navigate(data.newUser ? '/signup/foreign' : '/kyc-login/foreign', { state: navState })
  }

  return (
    <Screen>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LanguageSelector />
      </div>

      <h1 style={{ margin: 0, fontSize: 24 }}>{t('kycForeign.title')}</h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        {t('kycForeign.subtitle')}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handlePick}
        style={{ display: 'none' }}
      />

      {previewUrl ? (
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}
        >
          <img
            src={previewUrl}
            alt="passport preview"
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      ) : (
        <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
          {t('kycForeign.uploadLabel')}
        </Button>
      )}

      {previewUrl && !data && (
        <Button
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          {t('kycForeign.retake')}
        </Button>
      )}

      {error?.status === 2015 ? (
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 16,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17 }}>{t('kycForeign.korRedirect.title')}</h2>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('kycForeign.korRedirect.message')}
          </p>
          <Button variant="solid" onClick={() => navigate('/kyc')}>
            {t('kycForeign.korRedirect.goDomestic')}
          </Button>
        </section>
      ) : error ? (
        <ErrorBanner message={toErrorMessage(error)} />
      ) : null}

      {data ? (
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 16,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17 }}>{t('verifyConfirm.title')}</h2>
          <ConfirmRow label={t('verifyConfirm.name')} value={data.name} />
          <ConfirmRow label={t('verifyConfirm.country')} value={data.passportCountry} />
          <ConfirmRow label={t('verifyConfirm.expiry')} value={data.expiryAt} />
          <Button variant="solid" onClick={handleContinue} disabled={isPending}>
            {t('verifyConfirm.continue')}
          </Button>
        </section>
      ) : (
        <Button
          variant="solid"
          onClick={handleVerify}
          disabled={isPending || !file}
        >
          {isPending ? t('kycForeign.processing') : t('kycForeign.submit')}
        </Button>
      )}
    </Screen>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 15,
      }}
    >
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}