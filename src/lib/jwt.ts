/**
 * accessToken(JWT) 디코딩 유틸. 서버가 발급한 토큰의 payload 에서 값을 읽는다.
 * 서명 검증은 하지 않는다(서버 책임) — 클라이언트는 식별자만 꺼내 쓴다.
 */

/** base64url payload 를 파싱. 형식이 깨졌으면 null. */
function decodeJwtPayload<T>(token: string): T | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * accessToken 의 sub 클레임에서 userId 를 꺼낸다.
 * 일부 wallet mock API 가 userId 쿼리 파라미터를 요구하므로, 토큰에서 파생해 쓴다.
 * 토큰이 없거나 sub 가 숫자가 아니면 null.
 */
export function getUserIdFromToken(token: string | null): number | null {
  if (!token) return null
  const payload = decodeJwtPayload<{ sub?: string | number }>(token)
  if (payload?.sub == null) return null
  const id = typeof payload.sub === 'number' ? payload.sub : Number(payload.sub)
  return Number.isFinite(id) ? id : null
}
