import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import '@/i18n' // 부수효과 — i18next 전역 초기화 (localStorage → navigator → fallback)
import App from '@/App'

// iOS Safari 는 접근성 정책상 viewport 의 user-scalable=no 를 무시하고 핀치 줌을 허용한다.
// 앱형 UI 고정을 위해 Safari 전용 gesture 이벤트를 직접 막는다 (다른 브라우저는 발생 안 함).
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
