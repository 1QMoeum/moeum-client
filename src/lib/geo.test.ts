import { describe, it, expect } from 'vitest'
import { toKakaoPaths } from '@/lib/geo'
import type { LegalDongGeometry } from '@/types/geo'

describe('toKakaoPaths', () => {
  it('Polygon: [lng,lat] → {lat,lng} 으로 swap 하며 순서를 보존한다', () => {
    const geom: LegalDongGeometry = {
      type: 'Polygon',
      coordinates: [
        [
          [127, 37],
          [128, 38],
          [127.5, 37.5],
        ],
      ],
    }
    const rings = toKakaoPaths(geom)
    expect(rings).toHaveLength(1)
    expect(rings[0]).toEqual([
      { lat: 37, lng: 127 },
      { lat: 38, lng: 128 },
      { lat: 37.5, lng: 127.5 },
    ])
  })

  it('Polygon: 외곽선 + 구멍(여러 ring)을 각각의 링으로 평탄화한다', () => {
    const geom: LegalDongGeometry = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 1],
        ],
        [
          [0.2, 0.2],
          [0.3, 0.3],
        ],
      ],
    }
    expect(toKakaoPaths(geom)).toHaveLength(2)
  })

  it('MultiPolygon: 모든 폴리곤의 모든 링을 평탄화한다', () => {
    const geom: LegalDongGeometry = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [127, 37],
            [128, 38],
          ],
        ],
        [
          [
            [126, 36],
            [125, 35],
          ],
          [
            [126.1, 36.1],
            [126.2, 36.2],
          ],
        ],
      ],
    }
    const rings = toKakaoPaths(geom)
    expect(rings).toHaveLength(3)
    expect(rings[0][0]).toEqual({ lat: 37, lng: 127 })
  })
})
