/** 폼/요청 실패 메시지를 보여주는 공용 배너. message 가 있을 때만 호출부에서 렌더. */
export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: 12,
        background: '#fef2f2',
        color: '#b91c1c',
        borderRadius: 8,
        fontSize: 14,
      }}
    >
      {message}
    </div>
  )
}
