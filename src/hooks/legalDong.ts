import { useQuery } from '@tanstack/react-query'
import type { LegalDongFeature, LegalDongFeatureCollection } from '@/types/geo'

/** 시군구 단위 법정동 경계 파일을 가져온다. (public/geo/legaldong/{sig}.json) */
async function fetchSigCollection(sig: string): Promise<LegalDongFeatureCollection> {
  const res = await fetch(`/geo/legaldong/${sig}.json`)
  if (!res.ok) {
    throw new Error(`법정동 경계 로드 실패: ${sig} (${res.status})`)
  }
  return res.json()
}

/**
 * 서버가 준 legalDongCode(10자리)로 해당 법정동 경계 feature를 조회한다.
 *
 * - fetch 단위는 "시군구 파일 1개"(= code 앞 5자리). 한 동만 그릴 때 전국 파일을 받지 않는다.
 * - 같은 시군구 안의 다른 동은 캐시된 파일에서 바로 찾으므로 추가 요청이 없다.
 * - 경계 데이터는 거의 바뀌지 않으므로 staleTime/gcTime 을 무한으로 둔다.
 */
export function useLegalDongFeature(legalDongCode: string | null | undefined) {
  const sig = legalDongCode ? legalDongCode.slice(0, 5) : null

  return useQuery({
    queryKey: ['legalDong', sig],
    enabled: !!sig,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: () => fetchSigCollection(sig as string),
    select: (collection): LegalDongFeature | null =>
      collection.features.find((f) => f.properties.code === legalDongCode) ?? null,
  })
}
