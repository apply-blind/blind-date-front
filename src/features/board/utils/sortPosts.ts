import type { PostListItem } from '../types/board.types'

/**
 * 게시글 정렬 로직
 *
 * 2025 Best Practice:
 * - 원본 배열 불변성 보장 (immutability)
 * - O(n log n) 시간 복잡도 (Array.prototype.sort)
 * - 타입 안전성 (TypeScript strict mode)
 * - React 19 Compiler 대비 (useMemo 불필요)
 *
 * 정렬 우선순위:
 * 1. isPinned: true → 맨 위 (고정 게시글)
 * 2. 고정 게시글 내부: createdAt 내림차순 (최신순)
 * 3. 일반 게시글 내부: createdAt 내림차순 (최신순)
 *
 * @param posts - 정렬할 게시글 배열
 * @returns 정렬된 게시글 배열 (원본 불변)
 *
 * @example
 * ```typescript
 * const response = await getPostsByCategory('FREE_TALK', 0, 20)
 * const sortedPosts = sortPostsWithPinned(response.content)
 * setPosts(sortedPosts)
 * ```
 */
export function sortPostsWithPinned(posts: PostListItem[]): PostListItem[] {
  // ✅ 원본 배열 불변성 보장 (spread operator)
  return [...posts].sort((a, b) => {
    // 1️⃣ isPinned 우선 정렬
    if (a.isPinned && !b.isPinned) return -1  // a가 고정, b가 일반 → a를 위로
    if (!a.isPinned && b.isPinned) return 1   // b가 고정, a가 일반 → b를 위로

    // 2️⃣ 둘 다 고정 OR 둘 다 일반인 경우: 최신 날짜 우선
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA  // 내림차순 (최신순)
  })
}
