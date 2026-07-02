import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toErrorMessage } from '@/api/client'
import { useVerifyForeignFace, useVerifyForeignPassport } from '@/hooks/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import ErrorBanner from '@/components/ui/ErrorBanner'
import LanguageSelector from '@/components/ui/LanguageSelector'

type Step = 1 | 2 | 3

/**
 * 외국인 KYC 진입 화면 — 3-스텝 wizard, 서버 API 도 2단계로 분리.
 *  Step 1  여권 업로드 → verify-passport 호출 → 이름·국적·만료 표시 → [다음]
 *  Step 2  셀피 업로드 → verify-face 호출 → 유사도 표시 → [다음]
 *  Step 3  최종 요약 → [계속] → 가입 / 재인증 로그인
 *
 * KOR 여권은 Step 1 응답 2015 에서 감지 → 유도 화면 (셀피 촬영 전에 걸림).
 * 다음 페이지에는 파일 두 개 + Step 1 정보를 state 로 전달 (서버는 재검증).
 */
export default function KycForeignPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const passportInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>(1)
  const [passport, setPassport] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [passportPreviewUrl, setPassportPreviewUrl] = useState<string | null>(null)
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null)

  const passportMutation = useVerifyForeignPassport()
  const faceMutation = useVerifyForeignFace()

  const handlePickPassport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    if (!picked) return
    if (passportPreviewUrl) URL.revokeObjectURL(passportPreviewUrl)
    setPassport(picked)
    setPassportPreviewUrl(URL.createObjectURL(picked))
    passportMutation.reset()
    // 여권이 바뀌면 이전 셀피와의 매칭 결과는 무효 — 함께 초기화해서 stale 유사도로 Step 3 진입 방지.
    faceMutation.reset()
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl)
    setSelfie(null)
    setSelfiePreviewUrl(null)
  }

  const handlePickSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    if (!picked) return
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl)
    setSelfie(picked)
    setSelfiePreviewUrl(URL.createObjectURL(picked))
    faceMutation.reset()
  }

  const handleVerifyPassport = () => {
    if (!passport) return
    passportMutation.mutate(passport)
  }

  const handleVerifyFace = () => {
    if (!passport || !selfie) return
    faceMutation.mutate({ passport, selfie })
  }

  const handleContinue = () => {
    if (!passport || !selfie || !passportMutation.data) return
    navigate(passportMutation.data.newUser ? '/signup/foreign' : '/kyc-login/foreign', {
      state: {
        passport,
        selfie,
        name: passportMutation.data.name,
        passportCountry: passportMutation.data.passportCountry,
        expiryAt: passportMutation.data.expiryAt,
      },
    })
  }

  const stepTitles: Record<Step, string> = {
    1: t('kycForeign.step1Title'),
    2: t('kycForeign.step2Title'),
    3: t('kycForeign.step3Title'),
  }

  return (
    <Screen>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LanguageSelector />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              width: n === step ? 32 : 12,
              height: 8,
              borderRadius: 4,
              background: n <= step ? 'var(--color-primary)' : 'var(--color-border)',
              transition: 'width 0.2s',
            }}
          />
        ))}
      </div>

      <h1 style={{ margin: 0, fontSize: 24 }}>{stepTitles[step]}</h1>

      <input
        ref={passportInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handlePickPassport}
        style={{ display: 'none' }}
      />
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handlePickSelfie}
        style={{ display: 'none' }}
      />

      {step === 1 && (
        <>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('kycForeign.subtitle')}
          </p>

          {passportPreviewUrl ? (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <img src={passportPreviewUrl} alt="passport preview" style={{ width: '100%', display: 'block' }} />
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => passportInputRef.current?.click()}
              disabled={passportMutation.isPending}
            >
              {t('kycForeign.uploadLabel')}
            </Button>
          )}
          {passportPreviewUrl && !passportMutation.data && (
            <Button
              variant="ghost"
              onClick={() => passportInputRef.current?.click()}
              disabled={passportMutation.isPending}
            >
              {t('kycForeign.retake')}
            </Button>
          )}

          {passportMutation.error?.status === 2015 ? (
            <section style={panelStyle}>
              <h2 style={{ margin: 0, fontSize: 17 }}>{t('kycForeign.korRedirect.title')}</h2>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                {t('kycForeign.korRedirect.message')}
              </p>
              <Button variant="solid" onClick={() => navigate('/kyc')}>
                {t('kycForeign.korRedirect.goDomestic')}
              </Button>
            </section>
          ) : passportMutation.error ? (
            <ErrorBanner message={toErrorMessage(passportMutation.error)} />
          ) : null}

          {passportMutation.data ? (
            <section style={panelStyle}>
              <h2 style={{ margin: 0, fontSize: 17 }}>{t('verifyConfirm.title')}</h2>
              <ConfirmRow label={t('verifyConfirm.name')} value={passportMutation.data.name} />
              <ConfirmRow label={t('verifyConfirm.country')} value={passportMutation.data.passportCountry} />
              <ConfirmRow label={t('verifyConfirm.expiry')} value={passportMutation.data.expiryAt} />
              <Button variant="solid" onClick={() => setStep(2)}>
                {t('kycForeign.next')}
              </Button>
            </section>
          ) : (
            <Button
              variant="solid"
              onClick={handleVerifyPassport}
              disabled={passportMutation.isPending || !passport}
            >
              {passportMutation.isPending ? t('kycForeign.processing') : t('kycForeign.submit')}
            </Button>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('kycForeign.selfieHint')}
          </p>

          {selfiePreviewUrl ? (
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                maxWidth: 240,
                alignSelf: 'center',
              }}
            >
              <img src={selfiePreviewUrl} alt="selfie preview" style={{ width: '100%', display: 'block' }} />
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => selfieInputRef.current?.click()}
              disabled={faceMutation.isPending}
            >
              {t('kycForeign.uploadSelfie')}
            </Button>
          )}
          {selfiePreviewUrl && !faceMutation.data && (
            <Button
              variant="ghost"
              onClick={() => selfieInputRef.current?.click()}
              disabled={faceMutation.isPending}
            >
              {t('kycForeign.retake')}
            </Button>
          )}

          {faceMutation.error && <ErrorBanner message={toErrorMessage(faceMutation.error)} />}

          {faceMutation.data ? (
            <section style={panelStyle}>
              <h2 style={{ margin: 0, fontSize: 17 }}>{t('verifyConfirm.title')}</h2>
              <ConfirmRow
                label={t('verifyConfirm.faceSimilarity')}
                value={`${faceMutation.data.similarity.toFixed(1)}%`}
              />
              <Button variant="solid" onClick={() => setStep(3)}>
                {t('kycForeign.next')}
              </Button>
            </section>
          ) : (
            <Button
              variant="solid"
              onClick={handleVerifyFace}
              disabled={faceMutation.isPending || !selfie}
            >
              {faceMutation.isPending ? t('kycForeign.processing') : t('kycForeign.submit')}
            </Button>
          )}

          <Button variant="ghost" onClick={() => setStep(1)} disabled={faceMutation.isPending}>
            {t('common.back')}
          </Button>
        </>
      )}

      {step === 3 && passportMutation.data && faceMutation.data && passport && selfie && (
        <>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('kycForeign.confirmSubtitle')}
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            {passportPreviewUrl && (
              <img
                src={passportPreviewUrl}
                alt="passport"
                style={{ width: '50%', borderRadius: 8, border: '1px solid var(--color-border)' }}
              />
            )}
            {selfiePreviewUrl && (
              <img
                src={selfiePreviewUrl}
                alt="selfie"
                style={{ width: '50%', borderRadius: 8, border: '1px solid var(--color-border)' }}
              />
            )}
          </div>

          <section style={panelStyle}>
            <ConfirmRow label={t('verifyConfirm.name')} value={passportMutation.data.name} />
            <ConfirmRow label={t('verifyConfirm.country')} value={passportMutation.data.passportCountry} />
            <ConfirmRow label={t('verifyConfirm.expiry')} value={passportMutation.data.expiryAt} />
            <ConfirmRow
              label={t('verifyConfirm.faceSimilarity')}
              value={`${faceMutation.data.similarity.toFixed(1)}%`}
            />
            <Button variant="solid" onClick={handleContinue}>
              {t('verifyConfirm.continue')}
            </Button>
          </section>

          <Button variant="ghost" onClick={() => setStep(2)}>
            {t('common.back')}
          </Button>
        </>
      )}
    </Screen>
  )
}

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 16,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
