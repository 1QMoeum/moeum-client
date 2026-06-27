import type { LegalDongFeature, LegalDongFeatureCollection } from '@/types/geo'

/**
 * 법정동 경계 GeoJSON 로더 (시군구 단위 메모리 캐시).
 * React Query 훅(단건)과 지도의 다건 렌더(여러 법정동 동시) 양쪽에서 공유한다.
 */
const sigCache = new Map<string, Promise<LegalDongFeatureCollection>>()

/** 시군구(코드 앞 5자리) 경계 파일을 로드. 같은 시군구는 1회만 fetch. 실패 시 캐시에서 제거해 재시도 허용. */
export function loadSigCollection(sig: string): Promise<LegalDongFeatureCollection> {
  let promise = sigCache.get(sig)
  if (!promise) {
    promise = fetch(`/geo/legaldong/${sig}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`법정동 경계 로드 실패: ${sig} (${res.status})`)
        return res.json() as Promise<LegalDongFeatureCollection>
      })
      .catch((err) => {
        sigCache.delete(sig)
        throw err
      })
    sigCache.set(sig, promise)
  }
  return promise
}

/** 법정동코드(10자리) → 경계 feature. 못 찾으면 null. */
export async function loadLegalDongFeature(code: string): Promise<LegalDongFeature | null> {
  const collection = await loadSigCollection(code.slice(0, 5))
  return collection.features.find((f) => f.properties.code === code) ?? null
}
