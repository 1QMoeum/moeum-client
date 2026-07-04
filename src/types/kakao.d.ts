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
      getSouthWest(): LatLng
      getNorthEast(): LatLng
    }

    interface MapOptions {
      center: LatLng
      level: number
      /** 드래그(팬) 허용 — 기본 true */
      draggable?: boolean
      /** 스크롤 휠 줌 허용 — 기본 true */
      scrollwheel?: boolean
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions)
      setBounds(bounds: LatLngBounds): void
      setCenter(latlng: LatLng): void
      getLevel(): number
      setLevel(level: number): void
      getBounds(): LatLngBounds
      getCenter(): LatLng
      /** 드래그(팬) 허용 여부 토글 */
      setDraggable(draggable: boolean): void
      /** 휠/더블클릭 줌 허용 여부 토글 */
      setZoomable(zoomable: boolean): void
      /** 컨테이너 크기 변경 후 지도 레이아웃 재계산 */
      relayout(): void
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

    interface MarkerOptions {
      position: LatLng
      map?: Map
      title?: string
    }

    class Marker {
      constructor(options: MarkerOptions)
      setMap(map: Map | null): void
      setPosition(latlng: LatLng): void
      getPosition(): LatLng
    }

    interface InfoWindowOptions {
      content: string | HTMLElement
      position?: LatLng
      removable?: boolean
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions)
      open(map: Map, marker?: Marker): void
      close(): void
    }

    interface CustomOverlayOptions {
      position: LatLng
      content: string | HTMLElement
      map?: Map
      xAnchor?: number
      yAnchor?: number
      zIndex?: number
      clickable?: boolean
    }

    class CustomOverlay {
      constructor(options: CustomOverlayOptions)
      setMap(map: Map | null): void
      setPosition(position: LatLng): void
    }

    /** 지도 클릭 등 좌표를 전달하는 마우스 이벤트 */
    interface MouseEvent {
      latLng: LatLng
    }

    namespace event {
      function addListener(target: object, type: 'click', handler: (mouseEvent: MouseEvent) => void): void
      function addListener(target: object, type: string, handler: () => void): void
      function removeListener(target: object, type: string, handler: (mouseEvent: MouseEvent) => void): void
      function removeListener(target: object, type: string, handler: () => void): void
    }

    /** 좌표↔주소/행정구역 변환 (libraries=services). */
    namespace services {
      const Status: {
        readonly OK: 'OK'
        readonly ZERO_RESULT: 'ZERO_RESULT'
        readonly ERROR: 'ERROR'
      }
      type Status = (typeof Status)[keyof typeof Status]

      /** coord2RegionCode 결과 한 줄. region_type 'B'=법정동, 'H'=행정동. */
      interface RegionCode {
        region_type: 'B' | 'H'
        /** 법정동 코드(10자리, region_type 'B') */
        code: string
        address_name: string
        region_1depth_name: string
        region_2depth_name: string
        region_3depth_name: string
        region_4depth_name: string
        x: number
        y: number
      }

      interface Address {
        address_name: string
      }
      interface RoadAddress {
        address_name: string
      }
      interface Coord2AddressResult {
        address: Address | null
        road_address: RoadAddress | null
      }

      /** addressSearch 결과 한 줄. x=경도, y=위도(문자열). */
      interface AddressSearchResult {
        address_name: string
        x: string
        y: string
        road_address: { address_name: string } | null
      }

      class Geocoder {
        /** 좌표(x=경도, y=위도) → 행정구역. */
        coord2RegionCode(
          x: number,
          y: number,
          callback: (result: RegionCode[], status: Status) => void,
        ): void
        /** 좌표(x=경도, y=위도) → 지번/도로명 주소. */
        coord2Address(
          x: number,
          y: number,
          callback: (result: Coord2AddressResult[], status: Status) => void,
        ): void
        /** 주소 문자열 → 좌표(정방향 지오코딩). */
        addressSearch(
          query: string,
          callback: (result: AddressSearchResult[], status: Status) => void,
        ): void
      }

      /** keywordSearch 결과 한 줄(POI). x=경도, y=위도(문자열). */
      interface PlaceSearchResult {
        id: string
        place_name: string
        address_name: string
        road_address_name: string
        category_name: string
        x: string
        y: string
      }

      /** 장소(POI) 키워드 검색 (libraries=services). 상호·역·랜드마크명으로 검색. */
      class Places {
        keywordSearch(
          keyword: string,
          callback: (result: PlaceSearchResult[], status: Status) => void,
        ): void
      }
    }
  }
}

export {}
