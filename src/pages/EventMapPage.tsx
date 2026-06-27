import EventMap from '@/components/map/EventMap'

/** 이벤트 지도 (/events) — 줌아웃: 법정동 집계, 확대: 개별 이벤트 핀. */
export default function EventMapPage() {
  return (
    <div style={{ height: '100vh' }}>
      <EventMap />
    </div>
  )
}
