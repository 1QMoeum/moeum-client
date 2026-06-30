/**
 * 카카오 지도 SDK 동적 로더. 스크립트를 1회만 주입하고, 여러 번 호출돼도 같은 Promise를 공유한다.
 * autoload=false 로 받은 뒤 kakao.maps.load 로 초기화가 끝나면 resolve.
 */
let loadPromise: Promise<void> | null = null

export function loadKakaoMaps(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const appKey = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!appKey) {
      reject(new Error('VITE_KAKAO_MAP_KEY 가 비어있습니다. (.env.local 에 카카오 JavaScript 키 설정)'))
      return
    }

    // 이미 로드된 경우(HMR 등)
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve())
      return
    }

    const script = document.createElement('script')
    // libraries=services: 좌표→행정구역/주소 역지오코딩(Geocoder) 사용 (이벤트 생성 위치 직접입력)
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`
    script.async = true
    script.onload = () => window.kakao.maps.load(() => resolve())
    script.onerror = () => reject(new Error('카카오 지도 SDK 스크립트 로드 실패'))
    document.head.appendChild(script)
  })

  return loadPromise
}
