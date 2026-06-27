/** 법정동 경계 GeoJSON 타입. public/geo/legaldong/{시군구코드}.json 의 구조. */

/** GeoJSON 좌표 순서는 [경도(lng), 위도(lat)] 임에 주의. */
export interface LegalDongGeometry {
  type: 'Polygon' | 'MultiPolygon'
  /** Polygon: number[ring][point][lng,lat] / MultiPolygon: number[poly][ring][point][lng,lat] */
  coordinates: number[][][] | number[][][][]
}

export interface LegalDongProperties {
  /** 법정동코드 10자리 (서버 legalDongCode 와 매칭되는 키) */
  code: string
  /** 법정동 이름 (예: 신영동, 박산리) */
  name: string
  /** 시군구코드 5자리 (= code 앞 5자리, 파일명) */
  sig: string
}

export interface LegalDongFeature {
  type: 'Feature'
  properties: LegalDongProperties
  geometry: LegalDongGeometry
}

export interface LegalDongFeatureCollection {
  type: 'FeatureCollection'
  features: LegalDongFeature[]
}
