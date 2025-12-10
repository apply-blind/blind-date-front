import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/features/auth'
import { NotificationProvider } from '@/features/notification/context/NotificationContext'
import { AdminRoutes } from '@/features/admin/routes/AdminRoutes'
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute'
import KakaoCallback from '@/features/auth/components/KakaoCallback'

// Lazy loading으로 코드 스플리팅
const LandingPage = lazy(() => import('@/features/auth/pages/LandingPage'))
const ProfileCreatePage = lazy(() => import('@/features/profile/pages/ProfileCreatePage'))
const IntroductionPage = lazy(() => import('@/features/profile/pages/IntroductionPage'))
const PhotoUploadPage = lazy(() => import('@/features/profile/pages/PhotoUploadPage'))
const ReviewPendingPage = lazy(() => import('@/features/review/pages/ReviewPendingPage'))
const RejectedPage = lazy(() => import('@/features/review/pages/RejectedPage'))
const BannedPage = lazy(() => import('@/features/review/pages/BannedPage'))
const MainLayout = lazy(() => import('@/features/main/pages/MainLayout'))
const NotificationPage = lazy(() => import('@/features/notification/pages/NotificationPage').then(m => ({ default: m.NotificationPage })))
const PostCreatePage = lazy(() => import('@/features/board/pages/PostCreatePage').then(m => ({ default: m.PostCreatePage })))
const PostDetailPage = lazy(() => import('@/features/board/pages/PostDetailPage').then(m => ({ default: m.PostDetailPage })))
const MyPostsPage = lazy(() => import('@/features/board/pages/MyPostsPage'))
const SearchPage = lazy(() => import('@/features/board/pages/SearchPage').then(m => ({ default: m.SearchPage })))

// 로딩 컴포넌트
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-6">
        <svg className="w-full h-full text-coral-pink animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
        </svg>
      </div>
      <p className="text-gray-500">로딩 중...</p>
    </div>
  </div>
)

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* ⭐ 관리자 라우트 (AuthProvider와 완전 분리) */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* 일반 사용자 라우트 (NotificationProvider → AuthProvider 계층) */}
        <Route path="/*" element={
          <NotificationProvider>
            <AuthProvider>
              <Routes>
              {/* 공개 라우트 (인증 불필요) */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/kakao/callback" element={<KakaoCallback />} />

          {/* 보호된 라우트 (인증 필요) */}
          <Route
            path="/profile/create"
            element={
              <ProtectedRoute allowedStatuses={['PROFILE_WRITING', 'REJECTED', 'APPROVED']}>
                <ProfileCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/introduction"
            element={
              <ProtectedRoute allowedStatuses={['PROFILE_WRITING', 'REJECTED', 'APPROVED']}>
                <IntroductionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/photos"
            element={
              <ProtectedRoute allowedStatuses={['PROFILE_WRITING', 'REJECTED', 'APPROVED']}>
                <PhotoUploadPage />
              </ProtectedRoute>
            }
          />

          {/* 심사 대기 페이지 */}
          <Route
            path="/review-pending"
            element={
              <ProtectedRoute allowedStatuses={['UNDER_REVIEW']}>
                <ReviewPendingPage />
              </ProtectedRoute>
            }
          />

          {/* 반려 페이지 */}
          <Route
            path="/rejected"
            element={
              <ProtectedRoute allowedStatuses={['REJECTED']}>
                <RejectedPage />
              </ProtectedRoute>
            }
          />

          {/* 정지 페이지 */}
          <Route
            path="/banned"
            element={
              <ProtectedRoute allowedStatuses={['BANNED']}>
                <BannedPage />
              </ProtectedRoute>
            }
          />

          {/* 메인 페이지 (APPROVED만 접근 가능) */}
          <Route
            path="/main"
            element={
              <ProtectedRoute allowedStatuses={['APPROVED']}>
                <MainLayout />
              </ProtectedRoute>
            }
          />

          {/* 알림 목록 (APPROVED만 접근 가능) */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedStatuses={['APPROVED']}>
                <NotificationPage />
              </ProtectedRoute>
            }
          />

              {/* 게시글 검색 (APPROVED만 접근 가능) */}
              <Route
                path="/board/search"
                element={
                  <ProtectedRoute allowedStatuses={['APPROVED']}>
                    <SearchPage />
                  </ProtectedRoute>
                }
              />

              {/* 게시글 작성 (APPROVED만 접근 가능) */}
              <Route
                path="/board/create"
                element={
                  <ProtectedRoute allowedStatuses={['APPROVED']}>
                    <PostCreatePage />
                  </ProtectedRoute>
                }
              />

              {/* 게시글 상세 (APPROVED만 접근 가능) */}
              <Route
                path="/board/:publicId"
                element={
                  <ProtectedRoute allowedStatuses={['APPROVED']}>
                    <PostDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* 내가 쓴 글 (APPROVED만 접근 가능) */}
              <Route
                path="/board/my-posts"
                element={
                  <ProtectedRoute allowedStatuses={['APPROVED']}>
                    <MyPostsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
            </AuthProvider>
          </NotificationProvider>
        } />
      </Routes>
    </Suspense>
  )
}

export default App
