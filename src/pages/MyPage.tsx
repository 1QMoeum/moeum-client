import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * 마이페이지 — 내 정보 · 예금토큰 지갑 카드 · 참여 현황 · 최근 참여 이벤트.
 * 아직 전용 API 가 없어 퍼블리싱(정적 데이터) 상태. API 나오면 hooks/query 로 교체.
 */
export default function MyPage() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100%' }}>
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 48px' }}>
        {/* 탑바 */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
            padding: '10px 20px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconButton label="뒤로가기" onClick={() => navigate(-1)}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M14.5 6.5 9 12l5.5 5.5" stroke="#27282c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconButton>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#27282c' }}>
              마이페이지
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconButton label="알림">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="#5c5c72" aria-hidden>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3V3.75H10.4426C8.21751 3.75 6.37591 5.48001 6.23702 7.70074L6.01601 11.2342C5.93175 12.5814 5.47946 13.8797 4.7084 14.9876C4.01172 15.9886 4.63194 17.3712 5.84287 17.5165L9.25 17.9254V19C9.25 20.5188 10.4812 21.75 12 21.75C13.5188 21.75 14.75 20.5188 14.75 19V17.9254L18.1571 17.5165C19.3681 17.3712 19.9883 15.9886 19.2916 14.9876C18.5205 13.8797 18.0682 12.5814 17.984 11.2342L17.763 7.70074C17.6241 5.48001 15.7825 3.75 13.5574 3.75H13V3ZM10.75 19C10.75 19.6904 11.3096 20.25 12 20.25C12.6904 20.25 13.25 19.6904 13.25 19V18.25H10.75V19Z"
                />
              </svg>
            </IconButton>
            <IconButton label="내 정보">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="#5c5c72" aria-hidden>
                <path d="M12 3.75C9.92893 3.75 8.25 5.42893 8.25 7.5C8.25 9.57107 9.92893 11.25 12 11.25C14.0711 11.25 15.75 9.57107 15.75 7.5C15.75 5.42893 14.0711 3.75 12 3.75Z" />
                <path d="M8 13.25C5.92893 13.25 4.25 14.9289 4.25 17V18.1883C4.25 18.9415 4.79588 19.5837 5.53927 19.7051C9.8181 20.4037 14.1819 20.4037 18.4607 19.7051C19.2041 19.5837 19.75 18.9415 19.75 18.1883V17C19.75 14.9289 18.0711 13.25 16 13.25H15.6591C15.4746 13.25 15.2913 13.2792 15.1159 13.3364L14.2504 13.6191C12.7881 14.0965 11.2119 14.0965 9.74959 13.6191L8.88407 13.3364C8.70869 13.2792 8.52536 13.25 8.34087 13.25H8Z" />
              </svg>
            </IconButton>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '30px 20px 0' }}>
          {/* 내 정보 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionTitle>내 정보</SectionTitle>

            {/* 프로필 카드 */}
            <button
              type="button"
              aria-label="내 정보 상세"
              style={{
                width: '100%',
                background: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#000' }}>
                  김하린
                </span>
                <Chip label="하나인증서" />
              </span>
              <CaretRight />
            </button>

            {/* 지갑 카드 */}
            <WalletCard
              onCharge={() => navigate('/wallet?action=charge')}
              onWithdraw={() => navigate('/wallet?action=withdraw')}
            />

            {/* 참여 현황 */}
            <div
              style={{
                display: 'flex',
                background: '#fff',
                borderRadius: 12,
                padding: '16px 8px',
                boxShadow: '0 0 8px rgba(21,21,21,0.04)',
              }}
            >
              <MiniStat label="참여중" value="3개" />
              <MiniStat label="운영중" value="1개" />
              <MiniStat label="관심 이벤트" value="7개" />
            </div>
          </section>

          {/* 최근 참여 이벤트 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionTitle>최근 참여 이벤트</SectionTitle>
            <RecentEventCard />
          </section>
        </div>
      </main>
    </div>
  )
}

/** 둥근 모서리 + 가운데 V 노치가 파인 글래스 트레이 마스크 (viewBox 363×123). */
const TRAY_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 363 123' preserveAspectRatio='none'><path d='M16 0 H150 L181.5 30 L213 0 H347 Q363 0 363 16 V107 Q363 123 347 123 H16 Q0 123 0 107 V16 Q0 0 16 0 Z'/></svg>",
)}")`

/** 그라데이션 예금토큰 카드 + 글래스 트레이(충전/전환 버튼). */
function WalletCard({ onCharge, onWithdraw }: { onCharge: () => void; onWithdraw: () => void }) {
  const trayStyle: CSSProperties & { WebkitBackdropFilter?: string; WebkitMaskImage?: string } = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 123,
    background: 'rgba(255,255,255,0.3)',
    backdropFilter: 'blur(10px) saturate(1.1)',
    WebkitBackdropFilter: 'blur(10px) saturate(1.1)',
    maskImage: TRAY_MASK,
    WebkitMaskImage: TRAY_MASK,
    maskSize: '100% 100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  }

  return (
    <div
      style={{
        position: 'relative',
        height: 221,
        borderRadius: 12,
        background: 'rgba(188,183,255,0.1)',
        boxShadow: '0 0 16px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* 그라데이션 토큰 카드 */}
      <div
        style={{
          position: 'absolute',
          left: 17,
          right: 17,
          top: 20,
          height: 185,
          borderRadius: 12,
          background: 'linear-gradient(103deg, #56d2c9 0%, var(--color-accent) 100%)',
          boxShadow: '0 0 16px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 24, right: 24, top: 12 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#f6f6fa' }}>
            하나 예금토큰
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.5,
                letterSpacing: '-0.02em',
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              58,000
            </span>
            <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#e0e0ed' }}>
              Hana-KRW
            </span>
          </div>
        </div>
      </div>

      {/* 글래스 트레이 — 가운데 노치가 있는 반투명 패널 */}
      <div style={trayStyle}>
        <PillButton label="충전하기" variant="white" onClick={onCharge} />
        <PillButton label="전환하기" variant="violet" onClick={onWithdraw} />
      </div>
    </div>
  )
}

function PillButton({
  label,
  variant,
  onClick,
}: {
  label: string
  variant: 'white' | 'violet'
  onClick: () => void
}) {
  const white = variant === 'white'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '12px 32px',
        borderRadius: 24,
        border: 'none',
        cursor: 'pointer',
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '-0.02em',
        background: white ? '#fff' : 'var(--color-accent)',
        color: white ? '#474c52' : '#fff',
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

/** 최근 참여 이벤트 카드 — 퍼블리싱용 정적 데이터. */
function RecentEventCard() {
  return (
    <button
      type="button"
      aria-label="리나 생일 광고 이벤트 상세"
      style={{
        width: '100%',
        background: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '20px 16px',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <img
        src="/sample-event-rina.png"
        alt=""
        aria-hidden
        style={{
          width: 80,
          height: 80,
          borderRadius: 8,
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: '0 0 16px rgba(21,21,21,0.04)',
        }}
      />
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.5,
                letterSpacing: '-0.02em',
                color: '#151519',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              리나 생일 광고 이벤트
            </span>
            <CaretRight />
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chip label="D-12" />
            <span style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#86869f' }}>
              목표 1,500,000원
            </span>
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#0c0d0d' }}>
            2026.06.07
          </span>
          <Chip label="참여 완료" />
        </span>
      </span>
    </button>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#222229' }}>
      {children}
    </h2>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#5c5c72' }}>
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#151519' }}>
        {value}
      </span>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: '0 8px',
        borderRadius: 4,
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
        background: '#e3e1ff',
        color: 'var(--color-accent)',
      }}
    >
      {label}
    </span>
  )
}

function CaretRight() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="#5c5c72" aria-hidden style={{ flexShrink: 0, transform: 'scaleX(-1)' }}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.0303 7.46967C14.3232 7.76256 14.3232 8.23744 14.0303 8.53033L10.5607 12L14.0303 15.4697C14.3232 15.7626 14.3232 16.2374 14.0303 16.5303C13.7374 16.8232 13.2626 16.8232 12.9697 16.5303L8.96967 12.5303C8.67678 12.2374 8.67678 11.7626 8.96967 11.4697L12.9697 7.46967C13.2626 7.17678 13.7374 7.17678 14.0303 7.46967Z"
      />
    </svg>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        display: 'flex',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}
