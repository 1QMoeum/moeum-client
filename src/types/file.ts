/** 파일 업로드 API 타입 (S3 Presigned URL 방식).
 *  (POST /v1/files/presigned-url → S3 PUT → POST /v1/files) */

export interface PresignedUrlRequest {
  fileName: string
  contentType: string
  size: number
}

export interface PresignedUrlResponse {
  /** 서버가 생성한 S3 object key — 완료 알림에 그대로 전달 */
  fileKey: string
  /** 단기 PUT URL — 같은 content-type 으로 PUT */
  uploadUrl: string
  expiresInSeconds: number
}

export interface FileCompleteRequest {
  fileKey: string
  name: string
  contentType: string
  size: number
}

export interface FileCompleteResponse {
  /** TEMP 상태로 저장된 파일 id — 엔티티 생성/수정 시 도메인 연결 */
  fileId: number
}
