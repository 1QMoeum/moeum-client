/**
 * 카카오 지도 SDK 전역 타입 — 이 프로젝트에서 실제 사용하는 부분만 최소 선언.
 * (any 금지 정책상, 외부 타입 의존 없이 필요한 API만 직접 declare)
 */
declare global {
  interface Window {
    kakao: typeof kakao
  }

  namespace kakao.maps {
    /** autoload=false 로 로드한 뒤 SDK 초기화를 마치고 콜백 호출 */
    function load(callback: () => void): void

    class LatLng {
      constructor(lat: number, lng: number)
      getLat(): number
      getLng(): number
    }

    class LatLngBounds {
      constructor()
      extend(latlng: LatLng): void
      isEmpty(): boolean
    }

    interface MapOptions {
      center: LatLng
      level: number
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions)
      setBounds(bounds: LatLngBounds): void
      setCenter(latlng: LatLng): void
    }

    interface PolygonOptions {
      path: LatLng[] | LatLng[][]
      strokeWeight?: number
      strokeColor?: string
      strokeOpacity?: number
      fillColor?: string
      fillOpacity?: number
    }

    class Polygon {
      constructor(options: PolygonOptions)
      setMap(map: Map | null): void
    }
  }
}

export {}
