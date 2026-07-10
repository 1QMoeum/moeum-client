import { Wallet as WalletIcon, ChevronRight, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { CSSProperties, UIEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import BottomNav from '@/components/ui/BottomNav'
import ProgressRing from '@/components/home/ProgressRing'
import { useMyWallet } from '@/hooks/wallet'
import { useMyAccount } from '@/hooks/account'
import { useParticipatingEvents } from '@/hooks/events'
import AccountSelectSheet from '@/components/wallet/AccountSelectSheet'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { dDayLabel, fundingPercent } from '@/types/event'
import type { ParticipatingEvent } from '@/types/event'

type Tab = 'events' | 'wallet'

const numLocale = (lang: string | undefined) => (lang === 'ko' ? 'ko-KR' : 'en-US')

/** 서버 날짜(YYYY-MM-DD) → 화면 표기(YY.MM.DD) */
const shortDate = (iso: string) => iso.slice(2).replaceAll('-', '.')

export default function MainPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('events')
  const [index, setIndex] = useState(0)
  const { data, isLoading, error } = useParticipatingEvents()
  const events = data?.content ?? []
  const active = events[index] ?? events[0]
  // 서버에 GET /v1/events/participating 미구현 상태 — 1000(INVALID_INPUT) 로 떨어짐.
  // 사용자에겐 에러 노출 대신 empty state 로 우회 (환경 별 무의미한 노이즈 제거).
  const treatAsEmpty = !!error

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== index) setIndex(next)
  }

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        // 한 화면에 고정 — 100vh 는 웹뷰 주소창 영역까지 포함해 살짝 넘쳐 스크롤되므로
        // html/body/#root(height:100%) 기준의 100% + overflow:hidden 으로 페이지 스크롤을 없앤다.
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <main
        style={{
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          // BottomNav 높이(~92px) + 여유. 이전 140px 는 과함 — 컨텐츠 짧을 때 하단 공백 원인.
          padding: '0 0 108px',
          display: 'flex',
          flex: 1,
          minHeight: 0,
          flexDirection: 'column',
        }}
      >
        {/* 상단 바 */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <img
              src="/moeum-favicon.svg"
              alt="moeum"
              draggable={false}
              style={{ height: 36, width: 'auto', userSelect: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeaderIconButton label={t('main.notifAria')}>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3V3.75H10.4426C8.21751 3.75 6.37591 5.48001 6.23702 7.70074L6.01601 11.2342C5.93175 12.5814 5.47946 13.8797 4.7084 14.9876C4.01172 15.9886 4.63194 17.3712 5.84287 17.5165L9.25 17.9254V19C9.25 20.5188 10.4812 21.75 12 21.75C13.5188 21.75 14.75 20.5188 14.75 19V17.9254L18.1571 17.5165C19.3681 17.3712 19.9883 15.9886 19.2916 14.9876C18.5205 13.8797 18.0682 12.5814 17.984 11.2342L17.763 7.70074C17.6241 5.48001 15.7825 3.75 13.5574 3.75H13V3ZM10.75 19C10.75 19.6904 11.3096 20.25 12 20.25C12.6904 20.25 13.25 19.6904 13.25 19V18.25H10.75V19Z"
              />
            </HeaderIconButton>
            <HeaderIconButton label={t('main.myPageAria')} onClick={() => navigate('/mypage')}>
              <path d="M12 3.75C9.92893 3.75 8.25 5.42893 8.25 7.5C8.25 9.57107 9.92893 11.25 12 11.25C14.0711 11.25 15.75 9.57107 15.75 7.5C15.75 5.42893 14.0711 3.75 12 3.75Z" />
              <path d="M8 13.25C5.92893 13.25 4.25 14.9289 4.25 17V18.1883C4.25 18.9415 4.79588 19.5837 5.53927 19.7051C9.8181 20.4037 14.1819 20.4037 18.4607 19.7051C19.2041 19.5837 19.75 18.9415 19.75 18.1883V17C19.75 14.9289 18.0711 13.25 16 13.25H15.6591C15.4746 13.25 15.2913 13.2792 15.1159 13.3364L14.2504 13.6191C12.7881 14.0965 11.2119 14.0965 9.74959 13.6191L8.88407 13.3364C8.70869 13.2792 8.52536 13.25 8.34087 13.25H8Z" />
            </HeaderIconButton>
          </div>
        </header>

        {/* 세그먼트 토글 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 24px 0' }}>
          <div
            role="tablist"
            aria-label={t('main.viewToggleAria')}
            style={{
              display: 'inline-flex',
              padding: 4,
              borderRadius: 24,
              background: 'var(--color-surface)',
              boxShadow: '0 0 16px rgba(21,21,21,0.04)',
            }}
          >
            <SegmentButton label={t('main.tabEvents')} active={tab === 'events'} onClick={() => setTab('events')} />
            <SegmentButton label={t('main.tabWallet')} active={tab === 'wallet'} onClick={() => setTab('wallet')} />
          </div>
        </div>

        {tab === 'events' ? (
          isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '160px 24px 0' }}>
              <div style={{ width: 256, height: 256, borderRadius: '50%', background: '#eef0f3' }} />
            </div>
          ) : treatAsEmpty || events.length === 0 ? (
            <EmptyEvents onExplore={() => navigate('/explore')} />
          ) : (
          <>
            {/* 캐러셀 */}
            <div
              onScroll={onScroll}
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {events.map((ev, i) => (
                <EventSlide key={ev.eventId} event={ev} active={i === index} />
              ))}
            </div>

            {/* 인디케이터 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '20px 0 0' }}>
              {events.map((ev, i) => (
                <span
                  key={ev.eventId}
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: i === index ? 'var(--color-accent)' : 'var(--color-track)',
                    transition: 'background 0.2s ease',
                  }}
                />
              ))}
            </div>

            {/* 통계 카드 */}
            <div style={{ padding: '32px 24px 0' }}>
              <div
                style={{
                  display: 'flex',
                  background: 'var(--color-surface)',
                  borderRadius: 24,
                  padding: '16px 8px',
                  boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                }}
              >
                <Stat label={t('main.stat.participants')} value={t('main.stat.participantsValue', { count: active.participantCount })} />
                <Divider />
                <Stat label={t('main.stat.progress')} value={`${fundingPercent(active.currentAmount, active.targetAmount)}%`} />
                <Divider />
                <Stat label={t('main.stat.dueDate')} value={shortDate(active.endDate)} />
              </div>
            </div>
          </>
          )
        ) : (
          <WalletView />
        )}
      </main>

      <BottomNav onCreate={() => navigate('/events/new')} />
    </div>
  )
}

function SegmentButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 24,
        border: 'none',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        lineHeight: 1.5,
        background: active ? 'var(--color-accent)' : 'transparent',
        color: active ? '#fff' : '#2f2f3b',
        transition: 'background 0.2s ease, color 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function EventSlide({ event, active }: { event: ParticipatingEvent; active: boolean }) {
  const { t, i18n } = useTranslation()
  const won = (n: number) => n.toLocaleString(numLocale(i18n.resolvedLanguage))
  const percent = fundingPercent(event.currentAmount, event.targetAmount)
  return (
    <section
      style={{
        flex: '0 0 100%',
        scrollSnapAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 24px 0',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#151519',
        }}
      >
        {event.title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <span
          style={{
            padding: '0 8px',
            borderRadius: 4,
            background: '#e3e1ff',
            color: 'var(--color-accent)',
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: '-0.02em',
          }}
        >
          {dDayLabel(event.endDate)}
        </span>
        <span style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#86869f' }}>
          {t('main.targetPrefix', { amount: won(event.targetAmount) })}
        </span>
      </div>
      <p style={{ margin: '4px 0 32px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontSize: 38,
            fontWeight: 700,
            lineHeight: 1.5,
            letterSpacing: '-0.02em',
            color: '#0c0d0d',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {won(event.currentAmount)}
        </span>
        <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: '#222229' }}>{t('main.unit')}</span>
      </p>

      <ProgressRing percent={percent} size={256} active={active}>
        <EventImage event={event} />
      </ProgressRing>
    </section>
  )
}

function EventImage({ event }: { event: ParticipatingEvent }) {
  const { t } = useTranslation()
  if (event.representativeImageUrl) {
    return (
      <img
        src={event.representativeImageUrl}
        alt={event.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    )
  }
  // 이미지 없을 때 — 부드러운 그라데이션 플레이스홀더
  return (
    <div
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ffe1ec 0%, #f3d4f0 55%, #dcd6f7 100%)',
        color: 'rgba(124,111,240,0.55)',
        fontSize: 15,
        fontWeight: 700,
      }}
    >
      {t('main.imageComingSoon')}
    </div>
  )
}

/** 참여중인 이벤트가 없을 때의 빈 상태 — 일러스트 + 안내 문구 + 탐색 유도 버튼.
 *  flex:1 로 부모(main)의 남는 세로를 채워 하단 여백을 최소화. */
function EmptyEvents({ onExplore }: { onExplore: () => void }) {
  const { t } = useTranslation()
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '40px 24px 32px',
      }}
    >
      <img
        src="/home-empty-events.png"
        alt=""
        aria-hidden
        width={240}
        height={240}
        style={{ display: 'block', objectFit: 'contain' }}
      />
      <h1
        style={{
          margin: '24px 0 0',
          fontSize: 18,
          fontWeight: 600,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#151519',
        }}
      >
        {t('main.emptyTitle')}
      </h1>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: 14,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#86869f',
          textAlign: 'center',
          whiteSpace: 'pre-line',
        }}
      >
        {t('main.emptyDesc')}
      </p>
      <button
        type="button"
        onClick={onExplore}
        style={{
          marginTop: 40,
          padding: '12px 32px',
          borderRadius: 24,
          border: 'none',
          background: 'var(--color-accent)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 500,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          cursor: 'pointer',
          boxShadow: '0 0 8px rgba(21,21,21,0.04)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {t('main.emptyCta')}
      </button>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
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

function Divider() {
  return <div style={{ width: 1, height: 24, alignSelf: 'center', background: 'var(--color-track)' }} />
}

/** 상단 바 우측 solid 아이콘 버튼 (24px, Figma Solid 아이콘 세트). */
function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
}) {
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
        color: '#5c5c72',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        {children}
      </svg>
    </button>
  )
}

/** 내 지갑 탭 — 예금토큰 잔액을 이벤트 탭과 같은 레이아웃(제목·계좌·금액·구슬)으로 표시. */
function WalletView() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const userType = useAuthStore((s) => s.userType)
  const { data: wallet, isPending, error } = useMyWallet(!!accessToken)
  const { data: account } = useMyAccount(!!accessToken)
  const [showAccounts, setShowAccounts] = useState(false)
  const won = (n: number) => n.toLocaleString(numLocale(i18n.resolvedLanguage))

  const noWallet = error?.status === ErrorCode.WALLET_NOT_FOUND
  const consentPath = userType === 'FOREIGN' ? '/plaid/consent' : '/mydata/consent'

  if (isPending) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 24px 0' }}>
        <div style={{ width: 256, height: 256, borderRadius: '50%', background: '#eef0f3' }} />
      </div>
    )
  }
  if (noWallet) {
    return (
      <div style={{ padding: '24px 24px 0' }}>
        <EmptyWalletCard onLink={() => navigate(consentPath)} />
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ padding: '24px 24px 0' }}>
        <ErrorCard message={error.message} />
      </div>
    )
  }
  if (!wallet) return null

  // 이벤트 탭(EventSlide)과 같은 위치/타이포 — 상단 정렬, 제목 19/700, 보조줄 14, 금액 38+22.
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 24px 0',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#151519',
        }}
      >
        {t('main.hanaToken')}
      </h1>
      <button
        type="button"
        onClick={() => (account ? setShowAccounts(true) : navigate(consentPath))}
        aria-label={account ? t('main.changeAccountAria') : t('main.linkAccountAria')}
        style={{
          all: 'unset',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          marginTop: 4,
          fontSize: 14,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#86869f',
          cursor: 'pointer',
          fontVariantNumeric: 'tabular-nums',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {account
          ? `${account.accountType === 'HANA' ? t('main.linkedBankHana') : t('main.linkedBankOther')} ${account.accountNumber}`
          : t('main.linkAccountCta')}
        <ChevronRight size={14} strokeWidth={2.4} />
      </button>
      <p style={{ margin: '4px 0 32px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontSize: 38,
            fontWeight: 700,
            lineHeight: 1.5,
            letterSpacing: '-0.02em',
            color: '#0c0d0d',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {won(wallet.tokenBalance)}
        </span>
        <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: '#222229' }}>{t('main.unit')}</span>
      </p>

      <button
        type="button"
        onClick={() => navigate('/wallet')}
        aria-label={t('main.viewWalletAria')}
        style={{ all: 'unset', cursor: 'pointer', borderRadius: '50%', WebkitTapHighlightColor: 'transparent' }}
      >
        <TokenSphere size={256} />
      </button>

      <div style={{ display: 'flex', gap: 24, marginTop: 44 }}>
        <ActionPill label={t('main.charge')} variant="outline" onClick={() => navigate('/wallet/charge')} />
        <ActionPill label={t('main.convert')} variant="filled" onClick={() => navigate('/wallet/convert')} />
      </div>

      <AccountSelectSheet open={showAccounts} onClose={() => setShowAccounts(false)} />
    </section>
  )
}

/** 구슬 하나의 배치·색·부유 파라미터. 좌표/크기는 구체 지름 대비 %. */
interface Marble {
  left: string
  top: string
  size: string
  color: string
  /** 부유 주기(초). 구슬마다 다르게 줘 동기화된 느낌을 없앤다. */
  dur: number
  delay: number
  x: number
  y: number
}

/** 수면 위 구슬 — 선명한 단색 원. */
const FLOATING_MARBLES: Marble[] = [
  { left: '16%', top: '33%', size: '23%', color: '#7ce0d3', dur: 5.2, delay: 0, x: 3, y: -6 },
  { left: '32%', top: '25%', size: '27%', color: '#a99df7', dur: 6.1, delay: 0.4, x: -4, y: -8 },
  { left: '53%', top: '35%', size: '20%', color: '#9d8ff5', dur: 5.6, delay: 0.9, x: 3, y: -5 },
  { left: '60%', top: '29%', size: '10%', color: '#b7adf9', dur: 4.4, delay: 0.2, x: 2, y: -7 },
  { left: '69%', top: '34%', size: '12%', color: '#82e3d6', dur: 4.8, delay: 0.6, x: -2, y: -6 },
  { left: '66%', top: '36%', size: '20%', color: '#a49af6', dur: 5.9, delay: 0.3, x: 3, y: -4 },
]

/** 물속 구슬 — radial-gradient 로 가장자리를 부드럽게, 반투명 수면 아래에서 뿌옇게 비친다. */
const SUNKEN_MARBLES: Marble[] = [
  { left: '35%', top: '54%', size: '33%', color: '#b3aaf8', dur: 7.2, delay: 0.2, x: 4, y: -5 },
  { left: '17%', top: '58%', size: '18%', color: '#beb6fa', dur: 6.4, delay: 1.1, x: -3, y: -4 },
  { left: '62%', top: '66%', size: '18%', color: '#9fe6dc', dur: 6.8, delay: 0.5, x: 3, y: -4 },
  { left: '42%', top: '76%', size: '18%', color: '#c3bcfa', dur: 7.6, delay: 0.8, x: -3, y: -3 },
  { left: '25%', top: '72%', size: '11%', color: '#b6adf9', dur: 5.8, delay: 1.4, x: 2, y: -3 },
]

/** .moeum-marble 이 읽는 부유 파라미터 CSS 변수. */
type FloatVars = CSSProperties & {
  '--float-dur': string
  '--float-delay': string
  '--float-x': string
  '--float-y': string
}

function MarbleDot({ marble, sunken }: { marble: Marble; sunken?: boolean }) {
  const style: FloatVars = {
    position: 'absolute',
    left: marble.left,
    top: marble.top,
    width: marble.size,
    height: marble.size,
    borderRadius: '50%',
    // 물속 구슬은 filter: blur 없이 radial-gradient 감쇠로 부드러운 가장자리를 만든다 (웹뷰 호환).
    background: sunken
      ? `radial-gradient(circle closest-side, ${marble.color} 55%, transparent 100%)`
      : marble.color,
    '--float-dur': `${marble.dur}s`,
    '--float-delay': `${marble.delay}s`,
    '--float-x': `${marble.x}px`,
    '--float-y': `${marble.y}px`,
  }
  return <span className="moeum-marble" style={style} />
}

/** 유리볼 속 토큰 구슬들 — 수면 위 구슬은 선명하게 떠 있고 물속 구슬은 뿌옇게 잠겨 있다.
 *  filter/backdrop-filter 에 의존하지 않아 하나 인앱 웹뷰에서도 동일하게 렌더되고,
 *  구슬들은 CSS 애니메이션으로 천천히 떠다닌다 (prefers-reduced-motion 시 정지). */
function TokenSphere({ size }: { size: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 33% 26%, #ffffff 0%, #f8f8fc 55%, #eef0f6 100%)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow:
          'inset 0 4px 14px rgba(255,255,255,0.95), inset 0 -14px 30px rgba(124,111,240,0.10), 0 14px 30px rgba(102,91,247,0.14)',
      }}
    >
      {/* 구슬 전부 (수면 오버레이 아래) — 수면 밑으로 잠긴 부분은 오버레이가 뿌옇게 덮는다 */}
      {SUNKEN_MARBLES.map((m) => (
        <MarbleDot key={`${m.left}-${m.top}`} marble={m} sunken />
      ))}
      {FLOATING_MARBLES.map((m) => (
        <MarbleDot key={`${m.left}-${m.top}`} marble={m} />
      ))}

      {/* 수면 — 반투명 화이트로 아래쪽을 뿌옇게. blur 는 지원 환경 향상 효과로만. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.66) 0%, rgba(255,255,255,0.36) 100%)',
          borderTop: '1.5px solid rgba(255,255,255,0.9)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />

      {/* 상단 유리 하이라이트 */}
      <span
        style={{
          position: 'absolute',
          left: '20%',
          top: '10%',
          width: '34%',
          height: '15%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
    </div>
  )
}

/** 지갑 탭 하단 액션 버튼 (충전하기 = 흰색 / 전환하기 = 보라 채움). */
function ActionPill({
  label,
  variant,
  onClick,
}: {
  label: string
  variant: 'outline' | 'filled'
  onClick: () => void
}) {
  const filled = variant === 'filled'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        padding: '12px 32px',
        borderRadius: 24,
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        cursor: 'pointer',
        color: filled ? '#ffffff' : '#474c52',
        background: filled ? '#665bf7' : '#ffffff',
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function EmptyWalletCard({ onLink }: { onLink: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onLink}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        width: '100%',
        cursor: 'pointer',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#191f28' }}>
        <WalletIcon size={18} strokeWidth={2.2} color="#8B5CF6" />
        {t('main.walletEmptyTitle')}
      </span>
      <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>
        {t('main.walletEmptyDesc')}
        <ChevronRight size={13} strokeWidth={2.4} style={{ verticalAlign: -2, marginLeft: 2 }} />
      </span>
    </button>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      style={{
        background: '#fff5f5',
        borderRadius: 'var(--radius-xl)',
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: '#e03e3e',
        fontSize: 13.5,
      }}
    >
      <AlertCircle size={18} strokeWidth={2.2} style={{ flexShrink: 0 }} />
      {message}
    </div>
  )
}

