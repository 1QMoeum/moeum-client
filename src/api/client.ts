import axios, { type AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

/** access 토큰을 동적으로 주입 (zustand store 가 set/clear). */
let accessToken: string | null = null
export function setAccessToken(token: string | null) {
  accessToken = token
}
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/**
 * 서버가 항상 HTTP 200 + ResponseDTO 로 응답하는 정책이라(공통 응답 통일),
 * 성공/실패는 본문의 success 필드로 판별한다. 실패면 ApiError 로 통일해 throw.
 */
export class ApiError extends Error {
  readonly status: number | null

  constructor(status: number | null, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const res = await promise
    const body = res.data
    if (!body.success) {
      throw new ApiError(body.status, body.message ?? '요청에 실패했습니다.')
    }
    return body.data as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    const ax = e as AxiosError<ApiResponse<unknown>>
    if (ax.response?.data?.message) {
      throw new ApiError(ax.response.data.status ?? null, ax.response.data.message)
    }
    throw new ApiError(null, ax.message || '네트워크 오류가 발생했습니다.')
  }
}