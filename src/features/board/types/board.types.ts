/**
 * 게시글 카테고리
 * Backend: PostCategory enum
 */
export type PostCategory =
  | 'FREE_TALK'      // 자유 수다
  | 'SELF_INTRO'     // 셀소
  | 'MEETUP'         // 벙개
  | 'GENTLEMEN'      // 젠틀맨 라운지 (남성 전용)
  | 'LADIES'         // 레이디 라운지 (여성 전용)

/**
 * 이미지 Content-Type (백엔드 ImageContentType enum)
 */
export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp'

/**
 * 게시글 상태
 * Backend: PostStatus enum
 */
export type PostStatus = 'ACTIVE' | 'DELETED'

/**
 * 게시글 목록 조회 응답 (간략 정보)
 * Backend: GetListPostDto.ListResponse
 */
export interface PostListItem {
  publicId: string
  category: PostCategory
  authorGender: 'MALE' | 'FEMALE'
  title: string
  status: PostStatus  // 게시글 상태 (삭제 여부 판단용)
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  isHot: boolean
  hasImage: boolean
  imageUrl: string | null  // Presigned URL (24시간 만료)
  createdAt: string // yyyy-MM-dd HH:mm:ss
}

/**
 * 게시글 상세 조회 응답
 * Backend: GetDetailPostDto.Response
 */
export interface PostDetail {
  publicId: string
  category: PostCategory
  authorGender: 'MALE' | 'FEMALE'
  anonymousNickname: string
  title: string
  content: string
  status: PostStatus  // 게시글 상태 (삭제 여부 판단용)
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  isHot: boolean
  isLikedByCurrentUser: boolean
  isAuthor: boolean  // 작성자 여부 (내가 쓴 글인지)
  imageUrl: string | null
  createdAt: string // yyyy-MM-dd HH:mm:ss
  updatedAt: string // yyyy-MM-dd HH:mm:ss
}

/**
 * 페이징 응답
 * Backend: GetListPostDto.PageResponse
 */
export interface PostPageResponse {
  content: PostListItem[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

/**
 * 게시글 생성 요청
 * Backend: CreatePostDto.Request
 */
export interface CreatePostRequest {
  category: PostCategory
  title: string
  content: string
  imageMetadata?: {
    filename: string
    contentType: ImageContentType
  }
}

/**
 * 게시글 생성 응답 (이미지 있을 때만)
 * Backend: CreatePostDto.Response
 */
export interface CreatePostResponse {
  postPublicId: string
  presignedUrlInfo: {
    presignedUrl: string
    s3Key: string
  }
}

/**
 * 공감(좋아요) 토글 응답
 * Backend: TogglePostLikeDto.LikeToggleResponse
 */
export interface LikeToggleResponse {
  isLiked: boolean
  likeCount: number
}

/**
 * 게시글 검색 결과 아이템
 * Backend: PostSearchDto.PostResult
 */
export interface PostSearchResult {
  publicId: string
  title: string
  content: string        // 200자 미리보기
  category: PostCategory
  imageUrl?: string      // CloudFront CDN URL (nullable)
  createdAt: string      // ISO 8601 (yyyy-MM-dd'T'HH:mm:ss)
}

/**
 * 게시글 검색 응답
 * Backend: PostSearchDto.PageResponse
 */
export interface PostSearchResponse {
  posts: PostSearchResult[]  // 검색 결과 목록 (주의: "content"가 아님)
  totalPages: number
  totalElements: number
  currentPage: number        // 0-based 페이지 번호 (주의: "pageNumber"가 아님)
  size: number
}
