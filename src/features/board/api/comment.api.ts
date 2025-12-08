/**
 * 댓글 API
 * - 백엔드 REST API 엔드포인트와 1:1 매핑
 * - Axios 인스턴스 사용 (JWT 자동 재발급 인터셉터 적용)
 */

import api from '@/shared/api/axios'
import type {
  CommentListResponse,
  CommentCreateRequest,
  CommentCreateResponse,
  ReplyCreateRequest,
  ReplyCreateResponse,
  LikeToggleResponse
} from '../types/comment.types'

/**
 * 댓글 작성
 * POST /api/v1/posts/{postPublicId}/comments
 *
 * @param postPublicId 게시글 publicId
 * @param request 댓글 작성 요청 (content)
 * @returns commentPublicId
 */
export async function createComment(
  postPublicId: string,
  request: CommentCreateRequest
): Promise<CommentCreateResponse> {
  const response = await api.post<CommentCreateResponse>(
    `/api/v1/posts/${postPublicId}/comments`,
    request
  )
  return response.data
}

/**
 * 댓글 조회 (페이징)
 * GET /api/v1/posts/{postPublicId}/comments?page=0&size=20
 *
 * @param postPublicId 게시글 publicId
 * @param page 페이지 번호 (0부터 시작)
 * @param size 페이지 크기 (기본 20)
 * @returns 댓글 목록 (대댓글 포함, 페이징)
 */
export async function getComments(
  postPublicId: string,
  page: number = 0,
  size: number = 20
): Promise<CommentListResponse> {
  const response = await api.get<CommentListResponse>(
    `/api/v1/posts/${postPublicId}/comments`,
    { params: { page, size } }
  )
  return response.data
}

/**
 * 대댓글 작성
 * POST /api/v1/comments/{commentPublicId}/replies
 *
 * @param commentPublicId 부모 댓글 publicId
 * @param request 대댓글 작성 요청 (content)
 * @returns replyPublicId
 */
export async function createReply(
  commentPublicId: string,
  request: ReplyCreateRequest
): Promise<ReplyCreateResponse> {
  const response = await api.post<ReplyCreateResponse>(
    `/api/v1/comments/${commentPublicId}/replies`,
    request
  )
  return response.data
}

/**
 * 댓글 삭제 (소프트 삭제)
 * DELETE /api/v1/comments/{commentPublicId}
 *
 * @param commentPublicId 댓글 publicId
 */
export async function deleteComment(commentPublicId: string): Promise<void> {
  await api.delete(`/api/v1/comments/${commentPublicId}`)
}

/**
 * 좋아요 토글
 * POST /api/v1/comments/{commentPublicId}/likes
 *
 * @param commentPublicId 댓글 publicId
 * @returns 좋아요 상태 (isLiked, likeCount)
 */
export async function toggleCommentLike(
  commentPublicId: string
): Promise<LikeToggleResponse> {
  const response = await api.post<LikeToggleResponse>(
    `/api/v1/comments/${commentPublicId}/likes`
  )
  return response.data
}
