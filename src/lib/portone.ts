import PortOne from '@portone/browser-sdk/v2'

const storeId = import.meta.env.VITE_PORTONE_STORE_ID
const channelKey = import.meta.env.VITE_PORTONE_CHANNEL_KEY

/**
 * KG이니시스 통합인증(V2) 본인인증을 트리거하고 검증 완료된 identityVerificationId 를 반환한다.
 *
 * <p>실패/취소 시 throw — 호출부가 catch.
 */
export async function requestKgInicisIdentityVerification(): Promise<string> {
  if (!storeId || !channelKey) {
    throw new Error('포트원 환경변수(VITE_PORTONE_STORE_ID, VITE_PORTONE_CHANNEL_KEY)가 비어있습니다.')
  }

  const identityVerificationId = `identity-verification-${crypto.randomUUID()}`

  const result = await PortOne.requestIdentityVerification({
    storeId,
    channelKey,
    identityVerificationId,
  })

  if (result?.code !== undefined) {
    // 사용자 취소·실패 등. PortOne 이 code/message 반환.
    throw new Error(result.message ?? '본인인증이 취소되었습니다.')
  }

  return identityVerificationId
}