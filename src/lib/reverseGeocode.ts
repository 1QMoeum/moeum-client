import { loadKakaoMaps } from '@/lib/kakaoLoader'

/** 좌표를 역지오코딩한 결과 — 이벤트 생성(MANUAL) 위치 필드와 1:1 대응. */
export interface ReverseGeocoded {
  address: string
  siDo: string
  siGunGu: string
  legalDong: string
  legalDongCode: string
}

/**
 * 위/경도를 법정동 행정구역 + 주소로 변환한다. (Kakao services Geocoder)
 * - 행정구역은 법정동(region_type 'B')을 우선 사용해 legalDongCode(10자리)를 얻는다.
 * - 주소는 도로명 > 지번 > 행정구역명 순으로 채운다.
 * 결과가 없으면 reject.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocoded> {
  await loadKakaoMaps()
  const geocoder = new kakao.maps.services.Geocoder()

  const region = await new Promise<kakao.maps.services.RegionCode>((resolve, reject) => {
    geocoder.coord2RegionCode(lng, lat, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || result.length === 0) {
        reject(new Error('선택한 위치의 행정구역을 찾을 수 없어요.'))
        return
      }
      resolve(result.find((r) => r.region_type === 'B') ?? result[0])
    })
  })

  const address = await new Promise<string>((resolve) => {
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status !== kakao.maps.services.Status.OK || result.length === 0) {
        resolve(region.address_name)
        return
      }
      const top = result[0]
      resolve(top.road_address?.address_name ?? top.address?.address_name ?? region.address_name)
    })
  })

  return {
    address,
    siDo: region.region_1depth_name,
    siGunGu: region.region_2depth_name,
    legalDong: region.region_3depth_name,
    legalDongCode: region.code,
  }
}
