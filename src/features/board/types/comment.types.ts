/**
 * 댓글 시스템 타입 정의
 * - 백엔드 API 스펙과 완전 일치
 * - TypeScript strict mode 준수
 */

/**
 * 댓글 작성 요청
 */
export interface CommentCreateRequest {
  content: string
}

/**
 * 댓글 작성 응답
 */
export interface CommentCreateResponse {
  commentPublicId: string
}

/**
 * 대댓글 작성 요청
 */
export interface ReplyCreateRequest {
  content: string
}

/**
 * 대댓글 작성 응답
 */
export interface ReplyCreateResponse {
  replyPublicId: string
}

/**
 * 좋아요 토글 응답
 */
export interface LikeToggleResponse {
  isLiked: boolean
  likeCount: number
}

/**
 * 댓글 상태
 */
export type CommentStatus = 'ACTIVE' | 'DELETED'

/**
 * 대댓글
 */
export interface Reply {
  publicId: string
  authorGender: 'MALE' | 'FEMALE'
  anonymousNickname: string
  content: string
  status: CommentStatus  // 삭제 여부 판단용
  likeCount: number
  isLikedByCurrentUser: boolean
  isAuthor: boolean
  createdAt: string  // yyyy-MM-dd HH:mm:ss
}

/**
 * 댓글 (대댓글 포함)
 */
export interface Comment {
  publicId: string
  authorGender: 'MALE' | 'FEMALE'
  anonymousNickname: string
  content: string
  status: CommentStatus  // 삭제 여부 판단용
  likeCount: number
  isLikedByCurrentUser: boolean
  isAuthor: boolean
  createdAt: string  // yyyy-MM-dd HH:mm:ss
  replies: Reply[]
}

/**
 * 댓글 목록 응답 (페이징)
 */
export interface CommentListResponse {
  content: Comment[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
