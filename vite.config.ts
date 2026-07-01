import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // 5173 이 점유돼 다른 포트로 밀리면 백엔드 CORS 화이트리스트(localhost:5173)에서 벗어나
    // 인증 요청이 CORS error 로 막힌다. 조용히 드리프트하지 말고 즉시 실패시킨다.
    strictPort: true,
    // localhost 가 IPv4 / IPv6 어느 쪽으로 해석되든 응답 — 모든 인터페이스 listen.
    host: true,
  },
})
