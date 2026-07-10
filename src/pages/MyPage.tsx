import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorBanner from '@/components/ui/ErrorBanner'
import BrandAvatar from '@/components/wallet/BrandAvatar'
import AccountSelectSheet from '@/components/wallet/AccountSelectSheet'
import WalletTokenCard from '@/components/wallet/WalletTokenCard'
import { useMyPage } from '@/hooks/mypage'
import { useOperatingEvents, useParticipatingEvents } from '@/hooks/events'
import { useMyAccount, useLinkableAccounts } from '@/hooks/account'
import type { LinkableAccount } from '@/hooks/account'
import { useAuthStore } from '@/store/auth'
import { isSameAccount } from '@/lib/account'
import { toErrorMessage } from '@/api/client'
import { categoryImage } from '@/types/event'
import type { EventListItem } from '@/types/event'

/** 원화 천단위 콤마. */
const won = (n: number) => n.toLocaleString('ko-KR')

/** 'YYYY-MM-DD' → 'YYYY.MM.DD' (표시용). */
function formatDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.')
}

/** 마감일까지 남은 일수 라벨 (D-day / D-n / 마감). */
function ddayLabel(endDate: string): string {
  const end = new Date(`${endDate}T23:59:59`).getTime()
  const diff = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000))
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-day'
  return '마감'
}

/** 참여 이벤트 상태 → 칩 라벨. */
function participationLabel(status: string): string {
  if (status === 'ONGOING') return '참여중'
  if (status === 'COMPLETED') return '참여 완료'
  if (status === 'FAILED') return '무산'
  if (status === 'CANCELLED') return '취소'
  return status
}

/**
 * 마이페이지 — 내 정보 · 예금토큰 지갑 카드 · 참여 현황 · 최근 참여 이벤트.
 * GET /v1/users/me/mypage 로 실데이터를 받아 렌더한다(지갑·통장 미생성 시 null).
 */
export default function MyPage() {
  const navigate = useNavigate()
  const { data, isPending, error } = useMyPage()
  const accessToken = useAuthStore((s) => s.accessToken)
  const userType = useAuthStore((s) => s.userType)
  const { data: linkableAccounts, isPending: accountsPending } = useLinkableAccounts(!!accessToken)
  const { data: connectedAccount } = useMyAccount(!!accessToken)
  const [showAccounts, setShowAccounts] = useState(false)

  const consentPath = userType === 'FOREIGN' ? '/plaid/consent' : '/mydata/consent'
  const counts = data?.counts
  const recentEvents = data?.recentParticipatingEvents ?? []

  // 연동(대표) 계좌에 해당하는 linkable 행 — 목록 전체 대신 이 한 줄만 노출한다.
  const connectedRow = useMemo(
    () =>
      connectedAccount
        ? linkableAccounts?.find((a) => isSameAccount(connectedAccount.accountNumber, a.id))
        : undefined,
    [linkableAccounts, connectedAccount],
  )

  /** 충전/전환 — 내 지갑을 히스토리에 깔고 tx 화면을 얹어, 뒤로가기가 내 지갑에 안착하게 한다. */
  const goWalletTx = (mode: 'charge' | 'convert') => {
    navigate('/wallet')
    navigate(mode === 'charge' ? '/wallet/charge' : '/wallet/convert')
  }

  // 참여중 카운트 — 내가 총대인(운영중) 이벤트는 '운영중'에만 세도록 목록과 동일 규칙으로 계산한다.
  // (목록은 프론트에서 필터하므로 백엔드 counts.participating 대신 필터 후 개수를 쓴다.)
  const { data: participatingData } = useParticipatingEvents()
  const { data: operatingData } = useOperatingEvents()
  const participatingCount = useMemo(() => {
    if (!participatingData) return counts?.participating
    const operatingIds = new Set((operatingData?.content ?? []).map((e) => e.eventId))
    return participatingData.content.filter((e) => !operatingIds.has(e.eventId)).length
  }, [participatingData, operatingData, counts?.participating])

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
          {error && <ErrorBanner message={toErrorMessage(error)} />}

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
                  {data?.name ?? (isPending ? '불러오는 중…' : '—')}
                </span>
                {data?.hanaCertVerified && <Chip label="하나인증서" />}
              </span>
              <CaretRight />
            </button>

            {/* 지갑 카드 — 카드(지갑) 탭 시 내 지갑으로 이동 */}
            <WalletTokenCard
              balance={data?.wallet?.tokenBalance ?? null}
              hasWallet={data ? data.wallet !== null : true}
              onOpen={() => navigate('/wallet')}
              onCharge={() => goWalletTx('charge')}
              onWithdraw={() => goWalletTx('convert')}
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
              <MiniStat
                label="참여중"
                value={countText(participatingCount)}
                onClick={() => navigate('/mypage/events/participating')}
              />
              <MiniStat
                label="운영중"
                value={countText(counts?.operating)}
                onClick={() => navigate('/mypage/events/operating')}
              />
              <MiniStat
                label="관심 이벤트"
                value={countText(counts?.bookmarked)}
                onClick={() => navigate('/mypage/events/bookmarked')}
              />
            </div>
          </section>

          {/* 내 계좌 — 연동(대표) 계좌 한 줄만. 탭하면 계좌 선택 시트(충전 플로우와 동일)로 변경. */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionTitle>내 계좌</SectionTitle>
            {accountsPending && (
              <div style={{ height: 76, borderRadius: 12, background: '#eef0f3' }} />
            )}
            {!accountsPending &&
              (connectedRow ? (
                <MyAccountRow account={connectedRow} primary onClick={() => setShowAccounts(true)} />
              ) : (
                <button
                  type="button"
                  onClick={() => (connectedAccount ? setShowAccounts(true) : navigate(consentPath))}
                  style={{
                    width: '100%',
                    background: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '18px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#151519' }}>
                    {connectedAccount ? '계좌 변경하기' : '계좌 연동하기'}
                  </span>
                  <CaretRight />
                </button>
              ))}
          </section>

          {/* 최근 참여 이벤트 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionTitle>최근 참여 이벤트</SectionTitle>
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <RecentEventCard
                  key={event.eventId}
                  event={event}
                  onClick={() => navigate(`/events/${event.eventId}`)}
                />
              ))
            ) : (
              <EmptyRecent loading={isPending} />
            )}
          </section>
        </div>
      </main>

      {/* 계좌 선택 시트 — 충전 플로우와 동일하게 다른 계좌 조회·변경 */}
      <AccountSelectSheet open={showAccounts} onClose={() => setShowAccounts(false)} />
    </div>
  )
}

/** 카운트 값 텍스트 (미로딩 시 '—개'). */
function countText(n: number | undefined): string {
  return n == null ? '—' : `${n}개`
}

/** 내 계좌 행 — 브랜드 아바타 + 상품명/마스킹 번호 + 잔액. 연동(충전) 계좌엔 대표 칩.
 *  탭하면 계좌 선택 시트를 열어 다른 계좌로 변경할 수 있다. */
function MyAccountRow({
  account,
  primary,
  onClick,
}: {
  account: LinkableAccount
  primary: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="계좌 변경"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <BrandAvatar brand={account.brand} size={40} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.5,
              letterSpacing: '-0.02em',
              color: '#151519',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {account.name}
          </span>
          {primary && <Chip label="대표" />}
        </span>
        <span
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            letterSpacing: '-0.02em',
            color: '#86869f',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {account.displayNumber}
        </span>
      </div>
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#151519',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {account.balanceText}
      </span>
      <CaretRight />
    </button>
  )
}

/** 최근 참여 이벤트 카드 — 대표이미지·제목·D-day·목표액·시작일·참여상태. */
function RecentEventCard({ event, onClick }: { event: EventListItem; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={`${event.title} 상세`}
      onClick={onClick}
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
        src={event.representativeImageUrl || categoryImage(event.category) || '/categories/gift.png'}
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
              {event.title}
            </span>
            <CaretRight />
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chip label={ddayLabel(event.endDate)} />
            <span style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#86869f' }}>
              목표 {won(event.targetAmount)}원
            </span>
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#0c0d0d' }}>
            {formatDate(event.startDate)}
          </span>
          <Chip label={participationLabel(event.status)} />
        </span>
      </span>
    </button>
  )
}

/** 최근 참여 이벤트 없음/로딩 안내. */
function EmptyRecent({ loading }: { loading: boolean }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '28px 16px',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 1.5,
        letterSpacing: '-0.02em',
        color: '#86869f',
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
      }}
    >
      {loading ? '불러오는 중…' : '아직 참여한 이벤트가 없어요.'}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#222229' }}>
      {children}
    </h2>
  )
}

function MiniStat({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        background: 'none',
        border: 'none',
        padding: '4px 0',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#5c5c72' }}>
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#151519' }}>
        {value}
      </span>
    </button>
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
