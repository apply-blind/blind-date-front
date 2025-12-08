import api from '@/shared/api/axios'
import type {
  PostCategory,
  PostPageResponse,
  PostDetail,
  CreatePostRequest,
  CreatePostResponse,
  LikeToggleResponse,
  PostSearchResponse
} from '../types/board.types'

// ====================================================================
// S3 직접 업로드 헬퍼 함수
// ====================================================================

/**
 * S3에 파일 직접 업로드
 * Presigned URL을 사용하여 PUT 요청
 */
async function uploadToS3(file: File, presignedUrl: string): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  })

  // ✅ 2025 Best Practice: fetch는 4xx, 5xx도 성공으로 간주하므로 명시적 확인 필요
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`S3 업로드 실패 (${response.status}): ${errorText}`)
  }
}

// ====================================================================
// 게시글 생성 Flow (3단계)
// 1. POST /api/v1/posts (게시글 생성 + Presigned URL 발급)
// 2. 클라이언트: S3 직접 업로드
// 3. PATCH /api/v1/posts/{publicId}/image (S3 업로드 완료 처리)
// ====================================================================

/**
 * Step 1: 게시글 생성 (이미지 메타데이터 포함 시 Presigned URL 발급)
 * POST /api/v1/posts
 * @returns 이미지 있으면 CreatePostResponse, 없으면 null
 */
async function createPostRequest(
  request: CreatePostRequest
): Promise<CreatePostResponse | null> {
  const response = await api.post<CreatePostResponse>('/api/v1/posts', request)

  // 201 Created with body (이미지 있음) 또는 201 Created with no body (이미지 없음)
  if (response.status === 201 && response.data) {
    return response.data
  }
  return null
}

/**
 * Step 3: S3 이미지 업로드 완료 처리
 * PATCH /api/v1/posts/{publicId}/image
 */
async function completeImageUpload(postPublicId: string): Promise<void> {
  const response = await api.patch(`/api/v1/posts/${postPublicId}/image`)

  if (import.meta.env.DEV) {
    console.log('[completeImageUpload] 업로드 완료 처리:', response.status, response.statusText)
  }
}

/**
 * 게시글 생성 (전체 플로우)
 * 편의 함수: Step 1 → Step 2 (이미지 있으면) → Step 3 (이미지 있으면)
 * @param category - 게시글 카테고리
 * @param title - 제목
 * @param content - 내용
 * @param image - 업로드할 이미지 (선택)
 */
export async function createPost(
  category: PostCategory,
  title: string,
  content: string,
  image?: File
): Promise<void> {
  // imageMetadata 생성 (이미지 있을 때만)
  const request: CreatePostRequest = {
    category,
    title,
    content,
    imageMetadata: image
      ? {
          filename: image.name,
          contentType: image.type as 'image/jpeg' | 'image/png' | 'image/webp'
        }
      : undefined
  }

  // Step 1: 게시글 생성
  const response = await createPostRequest(request)

  // Step 2 & 3: 이미지가 있고 response가 있으면 S3 업로드 및 완료 처리
  if (image && response) {
    await uploadToS3(image, response.presignedUrlInfo.presignedUrl)
    await completeImageUpload(response.postPublicId)
  }

  // void 반환 (작성 후 목록 페이지에서 자동 조회됨)
}

// ====================================================================
// 조회 API
// ====================================================================

/**
 * 카테고리별 게시글 목록 조회
 * GET /api/v1/posts?category={category}&page={page}&size={size}
 */
export async function getPostsByCategory(
  category: PostCategory,
  page: number = 0,
  size: number = 20
): Promise<PostPageResponse> {
  const response = await api.get<PostPageResponse>('/api/v1/posts', {
    params: { category, page, size }
  })
  return response.data
}

/**
 * 인기글 목록 조회
 * GET /api/v1/posts/hot?page={page}&size={size}
 */
export async function getHotPosts(
  page: number = 0,
  size: number = 20
): Promise<PostPageResponse> {
  const response = await api.get<PostPageResponse>('/api/v1/posts/hot', {
    params: { page, size }
  })
  return response.data
}

/**
 * 게시글 상세 조회
 * GET /api/v1/posts/{publicId}
 */
export async function getPostDetail(publicId: string): Promise<PostDetail> {
  const response = await api.get<PostDetail>(`/api/v1/posts/${publicId}`)
  return response.data
}

// ====================================================================
// 좋아요 API
// ====================================================================

/**
 * 공감(좋아요) 토글
 * POST /api/v1/posts/{publicId}/likes
 */
export async function togglePostLike(publicId: string): Promise<LikeToggleResponse> {
  const response = await api.post<LikeToggleResponse>(`/api/v1/posts/${publicId}/likes`)
  return response.data
}

// ====================================================================
// 삭제 API
// ====================================================================

/**
 * 게시글 삭제 (소프트 삭제)
 * DELETE /api/v1/posts/{publicId}
 */
export async function deletePost(publicId: string): Promise<void> {
  await api.delete(`/api/v1/posts/${publicId}`)
}

// ====================================================================
// 내가 작성한 게시글 API
// ====================================================================

/**
 * 내가 작성한 게시글 목록 조회
 * GET /api/v1/users/me/posts?page={page}&size={size}
 */
export async function getMyPosts(
  page: number = 0,
  size: number = 20
): Promise<PostPageResponse> {
  const response = await api.get<PostPageResponse>('/api/v1/users/me/posts', {
    params: { page, size }
  })
  return response.data
}

// ====================================================================
// 🔍 검색 API (Elasticsearch)
// ====================================================================

/**
 * 게시글 검색 (Elasticsearch 기반)
 * GET /api/v1/posts/search?keyword={keyword}&category={category}&page={page}&size={size}
 *
 * - Nori Analyzer를 사용한 한국어 형태소 분석
 * - Fuzziness AUTO (오타 허용)
 * - title^3 boosting (제목 가중치 3배)
 *
 * @param keyword - 검색어 (필수)
 * @param category - 게시글 카테고리 (선택)
 * @param page - 페이지 번호 (0부터 시작, 기본값 0)
 * @param size - 페이지 크기 (기본값 20)
 */
export async function searchPosts(
  keyword: string,
  category?: PostCategory,
  page: number = 0,
  size: number = 20
): Promise<PostSearchResponse> {
  const response = await api.get<PostSearchResponse>('/api/v1/posts/search', {
    params: {
      keyword,
      category,
      page,
      size
    }
  })
  return response.data
}
