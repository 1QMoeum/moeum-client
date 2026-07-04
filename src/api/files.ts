import { ApiError, apiClient, unwrap } from '@/api/client'
import type {
  FileCompleteRequest,
  FileCompleteResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
} from '@/types/file'

export const fileApi = {
  /** Presigned URL 발급 — 이미지(png·jpeg·webp)만, 용량 한도 서버 검증. */
  presignedUrl: (body: PresignedUrlRequest) =>
    unwrap<PresignedUrlResponse>(apiClient.post('/v1/files/presigned-url', body)),

  /** 업로드 완료 알림 — file_key 검증 후 TEMP 저장, fileId 반환. */
  complete: (userId: number, body: FileCompleteRequest) =>
    unwrap<FileCompleteResponse>(apiClient.post('/v1/files', body, { params: { userId } })),

  /**
   * S3 직접 PUT. 백엔드 공통 래퍼(ResponseDTO)·토큰 인터셉터와 무관한 외부 요청이라
   * apiClient 대신 fetch 를 쓴다. presigned 발급 때와 같은 content-type 이어야 한다.
   */
  uploadToS3: async (uploadUrl: string, file: File) => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!res.ok) {
      throw new ApiError(null, `사진 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요. (S3 ${res.status})`)
    }
  },
}
