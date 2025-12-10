import type { PostCategory } from '@/features/board/types/board.types'

/**
 * 알림 타입
 */
export type NotificationType =
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  | 'POST_CREATED'
  | 'POST_DELETED'       // 게시글 삭제 알림 (브로드캐스트)
  | 'COMMENT_CREATED'    // 댓글 작성 알림 (1:1)
  | 'REPLY_CREATED'      // 대댓글 작성 알림 (1:1)
  | 'COMMENT_ADDED'      // 댓글 추가 알림 (브로드캐스트)
  | 'COMMENT_DELETED'    // 댓글 삭제 알림 (브로드캐스트)

/**
 * SSE 이벤트 타입
 */
export type SseEventType = 'connected' | 'heartbeat' | 'notification' | 'session-expired'

/**
 * 기본 알림 인터페이스
 */
interface BaseNotification {
  type: NotificationType
  userPublicId: string | null  // POST_CREATED는 브로드캐스트 알림이므로 null
  timestamp: string
}

/**
 * 프로필 승인 알림
 */
export interface ReviewApprovedNotification extends BaseNotification {
  type: 'REVIEW_APPROVED'
}

/**
 * 프로필 반려 알림
 */
export interface ReviewRejectedNotification extends BaseNotification {
  type: 'REVIEW_REJECTED'
  reason: string
}

/**
 * 새 게시글 생성 알림 (브로드캐스트)
 */
export interface PostCreatedNotification extends BaseNotification {
  type: 'POST_CREATED'
  postPublicId: string        // 게시글 상세 페이지 이동용
  category: PostCategory      // 카테고리 필터링용
  title: string               // 알림 내용 (게시글 제목)
  userPublicId: null          // 브로드캐스트 알림 (특정 사용자 대상 아님)
}

/**
 * 게시글 삭제 알림 (브로드캐스트)
 */
export interface PostDeletedNotification extends BaseNotification {
  type: 'POST_DELETED'
  postPublicId: string        // 삭제된 게시글 ID
  category: PostCategory      // 카테고리 필터링용
  userPublicId: null          // 브로드캐스트 알림
}

/**
 * 댓글 작성 알림 (1:1)
 * - 게시글에 댓글 작성 시 게시글 작성자에게 알림
 */
export interface CommentCreatedNotification extends BaseNotification {
  type: 'COMMENT_CREATED'
  userPublicId: string        // 게시글 작성자
  postPublicId: string        // 게시글 상세 페이지 이동용
  postTitle: string           // 게시글 제목
  commentContent: string      // 댓글 내용 미리보기
}

/**
 * 대댓글 작성 알림 (1:1)
 * - 댓글에 대댓글 작성 시 멘션된 사용자에게 알림
 */
export interface ReplyCreatedNotification extends BaseNotification {
  type: 'REPLY_CREATED'
  userPublicId: string        // 멘션된 사용자
  postPublicId: string        // 게시글 상세 페이지 이동용
  postTitle: string           // 게시글 제목
  commentContent: string      // 대댓글 내용 미리보기
}

/**
 * 댓글 추가 알림 (브로드캐스트)
 * - 댓글/대댓글 작성 시 게시글을 보고 있는 모든 사용자에게 알림
 * - 실시간 댓글 목록 업데이트용 (트리거 역할, 실제 데이터는 API로 재조회)
 */
export interface CommentAddedNotification extends BaseNotification {
  type: 'COMMENT_ADDED'
  userPublicId: null          // 브로드캐스트 알림
  postPublicId: string        // 해당 게시글 식별용
  commentPublicId: string     // 추가된 댓글 ID
}

/**
 * 댓글 삭제 알림 (브로드캐스트)
 * - 댓글/대댓글 삭제 시 게시글을 보고 있는 모든 사용자에게 알림
 * - 실시간 댓글 마스킹 처리용
 */
export interface CommentDeletedNotification extends BaseNotification {
  type: 'COMMENT_DELETED'
  userPublicId: null          // 브로드캐스트 알림
  postPublicId: string        // 해당 게시글 식별용
  commentPublicId: string     // 삭제된 댓글 ID
}

/**
 * 알림 DTO (Union Type)
 */
export type NotificationDto =
  | ReviewApprovedNotification
  | ReviewRejectedNotification
  | PostCreatedNotification
  | PostDeletedNotification
  | CommentCreatedNotification
  | ReplyCreatedNotification
  | CommentAddedNotification
  | CommentDeletedNotification

/**
 * 알림 목록 조회 응답 (백엔드 NotificationResponse)
 */
export interface NotificationResponse {
  id: number
  type: NotificationType
  isRead: boolean
  postPublicId: string | null       // 댓글 알림용
  postTitle: string | null           // 댓글 알림용
  commentContent: string | null      // 댓글 알림용
  commentPublicId: string | null     // 댓글 알림용 (스크롤 이동)
  reason: string | null              // 반려 알림용
  createdAt: string
}
