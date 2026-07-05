import { useNavigate } from 'react-router-dom'
import EventMap from '@/components/map/EventMap'
import BottomNav from '@/components/ui/BottomNav'
import { useHomeOnBack } from '@/hooks/useHomeOnBack'

/** 이벤트 지도 (/events) — 줌아웃: 법정동 집계(깃발+영역), 확대: 개별 이벤트 핀 + TOP 10 바텀시트. */
export default function EventMapPage() {
  const navigate = useNavigate()
  useHomeOnBack()
  return (
    <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto', height: '100dvh' }}>
      <EventMap />
      <BottomNav onCreate={() => navigate('/events/new')} />
    </div>
  )
}
