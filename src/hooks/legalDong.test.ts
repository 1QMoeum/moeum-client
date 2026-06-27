import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { toKakaoPaths } from '@/lib/geo'
import type { LegalDongFeatureCollection } from '@/types/geo'

// 종로구(11110) 실제 변환 결과로 데이터 무결성 + 좌표 swap 을 검증한다.
const FILE = 'public/geo/legaldong/11110.json'

describe('법정동 경계 데이터 (실데이터 / 종로구)', () => {
  it('시군구 파일이 존재한다', () => {
    expect(existsSync(FILE)).toBe(true)
  })

  const fc = JSON.parse(readFileSync(FILE, 'utf-8')) as LegalDongFeatureCollection

  it('FeatureCollection 이고 feature 가 여러 개다', () => {
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features.length).toBeGreaterThan(10)
  })

  it('신영동(1111018600)이 있고 코드가 10자리다', () => {
    const f = fc.features.find((x) => x.properties.code === '1111018600')
    expect(f).toBeDefined()
    expect(f?.properties.name).toBe('신영동')
    expect(f?.properties.code).toHaveLength(10)
  })

  it('모든 feature 코드가 시군구코드 11110 으로 시작한다', () => {
    expect(fc.features.every((f) => f.properties.code.startsWith('11110'))).toBe(true)
  })

  it('좌표가 WGS84 한국 범위 안에 있다 (swap·좌표계 변환 검증)', () => {
    const f = fc.features.find((x) => x.properties.code === '1111018600')
    expect(f).toBeDefined()
    const points = toKakaoPaths(f!.geometry).flat()
    expect(points.length).toBeGreaterThan(0)
    for (const p of points) {
      expect(p.lat).toBeGreaterThan(33)
      expect(p.lat).toBeLessThan(43)
      expect(p.lng).toBeGreaterThan(124)
      expect(p.lng).toBeLessThan(132)
    }
  })
})
