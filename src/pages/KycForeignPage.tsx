import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toErrorMessage } from '@/api/client'
import { useVerifyForeignFace, useVerifyForeignPassport } from '@/hooks/auth'
import OnboardingLayout from '@/components/onboarding/OnboardingLayout'
import StepHeader from '@/components/onboarding/StepHeader'
import CtaButton from '@/components/onboarding/CtaButton'
import ErrorBanner from '@/components/ui/ErrorBanner'
import LanguageSelector from '@/components/ui/LanguageSelector'

type Step = 1 | 2 | 3

const CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 20,
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 0 8px rgba(21,21,21,0.04)',
}

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
  const stepDescs: Record<Step, string> = {
    1: t('kycForeign.subtitle'),
    2: t('kycForeign.selfieHint'),
    3: t('kycForeign.confirmSubtitle'),
  }

  const korRedirect = passportMutation.error?.status === 2015

  // 스텝별 하단 주 액션 — 검증 전엔 제출, 검증 후엔 다음/계속
  const footer = (() => {
    if (step === 1) {
      if (korRedirect) {
        return <CtaButton label={t('kycForeign.korRedirect.goDomestic')} onClick={() => navigate('/kyc')} />
      }
      if (passportMutation.data) {
        return <CtaButton label={t('kycForeign.next')} onClick={() => setStep(2)} />
      }
      return (
        <CtaButton
          label={passportMutation.isPending ? t('kycForeign.processing') : t('kycForeign.submit')}
          onClick={() => passport && passportMutation.mutate(passport)}
          disabled={passportMutation.isPending || !passport}
        />
      )
    }
    if (step === 2) {
      if (faceMutation.data) {
        return <CtaButton label={t('kycForeign.next')} onClick={() => setStep(3)} />
      }
      return (
        <CtaButton
          label={faceMutation.isPending ? t('kycForeign.processing') : t('kycForeign.submit')}
          onClick={() => passport && selfie && faceMutation.mutate({ passport, selfie })}
          disabled={faceMutation.isPending || !selfie}
        />
      )
    }
    return <CtaButton label={t('verifyConfirm.continue')} onClick={handleContinue} />
  })()

  return (
    <OnboardingLayout
      title={t('kycForeign.topTitle')}
      onBack={() => (step === 1 ? navigate(-1) : setStep((s) => (s - 1) as Step))}
      actions={<LanguageSelector />}
      footer={footer}
    >
      <StepHeader step={`0${step}`} title={stepTitles[step]} desc={stepDescs[step]} />

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
          {passportPreviewUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 8px rgba(21,21,21,0.06)' }}>
                <img src={passportPreviewUrl} alt="passport preview" style={{ width: '100%', display: 'block' }} />
              </div>
              {!passportMutation.data && (
                <RetakeButton
                  label={t('kycForeign.retake')}
                  onClick={() => passportInputRef.current?.click()}
                  disabled={passportMutation.isPending}
                />
              )}
            </div>
          ) : (
            <UploadBox label={t('kycForeign.uploadLabel')} onClick={() => passportInputRef.current?.click()} />
          )}

          {korRedirect ? (
            <section style={CARD_STYLE}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#151519', letterSpacing: '-0.02em' }}>
                {t('kycForeign.korRedirect.title')}
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: '#5c5c72', letterSpacing: '-0.02em', lineHeight: 1.5 }}>
                {t('kycForeign.korRedirect.message')}
              </p>
            </section>
          ) : passportMutation.error ? (
            <ErrorBanner message={toErrorMessage(passportMutation.error)} />
          ) : null}

          {passportMutation.data && (
            <section style={CARD_STYLE}>
              <ConfirmRow label={t('verifyConfirm.name')} value={passportMutation.data.name} />
              <ConfirmRow label={t('verifyConfirm.country')} value={passportMutation.data.passportCountry} />
              <ConfirmRow label={t('verifyConfirm.expiry')} value={passportMutation.data.expiryAt} />
            </section>
          )}
        </>
      )}

      {step === 2 && (
        <>
          {selfiePreviewUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div
                style={{
                  borderRadius: '50%',
                  overflow: 'hidden',
                  width: 200,
                  height: 200,
                  boxShadow: '0 0 8px rgba(21,21,21,0.06)',
                }}
              >
                <img
                  src={selfiePreviewUrl}
                  alt="selfie preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              {!faceMutation.data && (
                <RetakeButton
                  label={t('kycForeign.retake')}
                  onClick={() => selfieInputRef.current?.click()}
                  disabled={faceMutation.isPending}
                />
              )}
            </div>
          ) : (
            <UploadBox label={t('kycForeign.uploadSelfie')} onClick={() => selfieInputRef.current?.click()} />
          )}

          {faceMutation.error && <ErrorBanner message={toErrorMessage(faceMutation.error)} />}

          {faceMutation.data && (
            <section style={CARD_STYLE}>
              <ConfirmRow
                label={t('verifyConfirm.faceSimilarity')}
                value={`${faceMutation.data.similarity.toFixed(1)}%`}
              />
            </section>
          )}
        </>
      )}

      {step === 3 && passportMutation.data && faceMutation.data && passport && selfie && (
        <>
          <div style={{ display: 'flex', gap: 12 }}>
            {passportPreviewUrl && (
              <img
                src={passportPreviewUrl}
                alt="passport"
                style={{ width: '50%', borderRadius: 12, objectFit: 'cover' }}
              />
            )}
            {selfiePreviewUrl && (
              <img
                src={selfiePreviewUrl}
                alt="selfie"
                style={{ width: '50%', borderRadius: 12, objectFit: 'cover' }}
              />
            )}
          </div>

          <section style={CARD_STYLE}>
            <ConfirmRow label={t('verifyConfirm.name')} value={passportMutation.data.name} />
            <ConfirmRow label={t('verifyConfirm.country')} value={passportMutation.data.passportCountry} />
            <ConfirmRow label={t('verifyConfirm.expiry')} value={passportMutation.data.expiryAt} />
            <ConfirmRow
              label={t('verifyConfirm.faceSimilarity')}
              value={`${faceMutation.data.similarity.toFixed(1)}%`}
            />
          </section>
        </>
      )}
    </OnboardingLayout>
  )
}

/** 업로드 유도 박스 — 점선 테두리 흰색 카드. */
function UploadBox({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        width: '100%',
        height: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        border: '1.5px dashed #d8d8e4',
        borderRadius: 12,
        color: '#86869f',
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

/** 다시 찍기 — 절제된 텍스트 버튼. */
function RetakeButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        all: 'unset',
        alignSelf: 'center',
        fontSize: 14,
        color: '#86869f',
        letterSpacing: '-0.02em',
        textDecoration: 'underline',
        textUnderlineOffset: 3,
        cursor: disabled ? 'default' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 16, letterSpacing: '-0.02em' }}>
      <span style={{ color: '#86869f' }}>{label}</span>
      <span style={{ color: '#151519', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
