import hanaLogo from '@/assets/banks/hana-logo.png'

/**
 * 하나은행 자사 연계 마크. 흰 배경 + 컬러 로고로 표시해 자사 강조.
 * 다른 은행(S/K/N)은 단색 배경 + 흰 글씨로 익명화 유지.
 */
export default function HanaLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: '#ffffff',
        border: '1px solid #f2f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <img
        src={hanaLogo}
        alt="하나은행"
        style={{
          width: '78%',
          height: '78%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  )
}