/**
 * 메인 Feature 타입 정의
 */

// 하단 네비게이션 탭 타입
export type BottomTabType = 'matching' | 'card-list' | 'board' | 'content' | 'mypage'

// CardList 페이지 상단 탭
export type CardListTab = 'received' | 'sent' | 'matched' | 'profile-exchange' | 'interest'

// Matching 페이지 서브 탭
export type MatchingSubTab = 'daily' | 'past' | 'review'

// 익명게시판 카테고리
export type BoardCategory = 'free' | 'self-intro' | 'popular' | 'meetup' | 'gentlemen' | 'ladies'
