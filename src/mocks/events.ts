import type { EventMapDistrict, ViewportEvent } from '@/types/event'

/**
 * 백엔드 없이 지도 동작을 확인하기 위한 목 데이터.
 * 좌표는 종로구 실제 법정동 5곳의 중심점이라 경계 폴리곤 위에 핀이 얹힌다.
 */

function evt(
  eventId: number,
  title: string,
  category: string,
  fundingRate: number,
  latitude: number,
  longitude: number,
  legalDongCode: string,
): ViewportEvent {
  const targetAmount = 10_000_000
  return {
    eventId,
    title,
    category,
    fundingRate,
    currentAmount: Math.round((targetAmount * fundingRate) / 100),
    targetAmount,
    latitude,
    longitude,
    legalDongCode,
  }
}

/** 줌아웃 — 법정동별 집계(대표 이벤트) */
export const MOCK_DISTRICTS: EventMapDistrict[] = [
  {
    siDo: '서울특별시',
    siGunGu: '종로구',
    legalDong: '신영동',
    legalDongCode: '1111018600',
    fundingRate: 82,
    eventCount: 5,
    representative: evt(1, '신영동 골목 카페 살리기', 'CAFE', 82, 37.602912, 126.961599, '1111018600'),
  },
  {
    siDo: '서울특별시',
    siGunGu: '종로구',
    legalDong: '청운동',
    legalDongCode: '1111010100',
    fundingRate: 64,
    eventCount: 3,
    representative: evt(2, '청운동 동네책방 북콘서트', 'CULTURE', 64, 37.588661, 126.96801, '1111010100'),
  },
  {
    siDo: '서울특별시',
    siGunGu: '종로구',
    legalDong: '신교동',
    legalDongCode: '1111010200',
    fundingRate: 45,
    eventCount: 2,
    representative: evt(3, '신교동 수제버거 팝업', 'RESTAURANT', 45, 37.584392, 126.967893, '1111010200'),
  },
  {
    siDo: '서울특별시',
    siGunGu: '종로구',
    legalDong: '창신동',
    legalDongCode: '1111017400',
    fundingRate: 91,
    eventCount: 7,
    representative: evt(4, '창신동 봉제거리 플리마켓', 'SHOP', 91, 37.575963, 127.013384, '1111017400'),
  },
  {
    siDo: '서울특별시',
    siGunGu: '종로구',
    legalDong: '관철동',
    legalDongCode: '1111013500',
    fundingRate: 73,
    eventCount: 4,
    representative: evt(5, '관철동 야시장 라이브', 'CULTURE', 73, 37.568881, 126.985661, '1111013500'),
  },
]

/** 확대 — viewport 개별 이벤트 (위 동 주변에 흩뿌려, 줌인 시 여러 핀) */
export const MOCK_VIEWPORT_EVENTS: ViewportEvent[] = [
  evt(11, '신영동 골목 카페 살리기', 'CAFE', 82, 37.602912, 126.961599, '1111018600'),
  evt(12, '백사실 계곡 플로깅', 'CULTURE', 38, 37.6041, 126.9601, '1111018600'),
  evt(13, '청운동 동네책방 북콘서트', 'CULTURE', 64, 37.588661, 126.96801, '1111010100'),
  evt(14, '경복궁 옆 베이커리', 'CAFE', 55, 37.5897, 126.9692, '1111010100'),
  evt(15, '신교동 수제버거 팝업', 'RESTAURANT', 45, 37.584392, 126.967893, '1111010200'),
  evt(16, '창신동 봉제거리 플리마켓', 'SHOP', 91, 37.575963, 127.013384, '1111017400'),
  evt(17, '동대문 새벽시장 투어', 'SHOP', 77, 37.5748, 127.0119, '1111017400'),
  evt(18, '관철동 야시장 라이브', 'CULTURE', 73, 37.568881, 126.985661, '1111013500'),
  evt(19, '종각 직장인 점심 모임', 'RESTAURANT', 29, 37.5701, 126.9842, '1111013500'),
]
