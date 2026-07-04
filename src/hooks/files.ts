import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { fileApi } from '@/api/files'
import { getUserIdFromToken } from '@/lib/jwt'
import { useAuthStore } from '@/store/auth'

/** 서버가 허용하는 이미지 타입 (presigned 발급 시에도 검증됨). */
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/**
 * 이미지 업로드 — presigned URL 발급 → S3 PUT → 완료 알림까지 한 번에.
 * 성공 시 도메인 연결용 fileId 를 반환한다 (예: 이벤트 representativeFileId).
 */
export function useUploadImage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useMutation<number, ApiError, File>({
    mutationFn: async (file) => {
      const userId = getUserIdFromToken(accessToken)
      if (userId == null) {
        throw new ApiError(null, '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
      }
      if (!IMAGE_TYPES.includes(file.type)) {
        throw new ApiError(null, 'PNG·JPEG·WebP 이미지만 업로드할 수 있어요.')
      }
      const presigned = await fileApi.presignedUrl({
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      })
      await fileApi.uploadToS3(presigned.uploadUrl, file)
      const done = await fileApi.complete(userId, {
        fileKey: presigned.fileKey,
        name: file.name,
        contentType: file.type,
        size: file.size,
      })
      return done.fileId
    },
  })
}
