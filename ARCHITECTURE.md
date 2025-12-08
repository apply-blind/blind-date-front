# 🏗️ 프론트엔드 클린 아키텍처 가이드

## 📋 현재 마이그레이션 상태

### ✅ 완료된 작업
- [x] Phase 1: 새 폴더 구조 생성
- [x] Phase 2: Shared 모듈 이동
  - `shared/api/axios.ts`
  - `shared/components/layout/` (ErrorBoundary, ProtectedRoute)
  - `shared/components/feedback/` (ProgressIndicator)
  - `shared/components/ui/` (SelectModal)
  - `shared/utils/` (date, enumMapper, sessionStorage, env)
  - `shared/types/common.types.ts`
- [x] Phase 3: Auth feature 분리
  - `features/auth/api/authApi.ts`
  - `features/auth/hooks/useAuth.ts`
  - `features/auth/pages/LandingPage.tsx`
  - `features/auth/components/KakaoCallback.tsx`
  - `features/auth/types/auth.types.ts`
  - `features/auth/index.ts` (Public API)

### 🚧 진행 중인 작업
- [ ] Phase 4: Profile feature 분리
- [ ] Phase 5: Review feature 분리
- [ ] Phase 6: App 진입점 정리
- [ ] Phase 7: Import 경로 업데이트
- [ ] Phase 8: 테스트 및 검증

---

## 🎯 최종 목표 구조

```
src/
├── app/                      # 애플리케이션 진입점
│   ├── App.tsx              # 라우터 설정
│   ├── main.tsx             # 엔트리 포인트
│   └── routes/
│       └── index.tsx
│
├── features/                # 🔥 기능별 모듈
│   ├── auth/               # ✅ 완료
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── profile/            # 🚧 진행 중
│   │   ├── api/
│   │   │   └── profileApi.ts
│   │   ├── hooks/
│   │   │   ├── useProfileForm.ts
│   │   │   └── useNicknameCheck.ts
│   │   ├── components/
│   │   │   ├── HeightSelector.tsx
│   │   │   ├── RegionSelector.tsx
│   │   │   ├── PersonalitySelector.tsx
│   │   │   ├── OccupationSelector.tsx
│   │   │   ├── BirthDateSelector.tsx
│   │   │   └── SimpleSelector.tsx
│   │   ├── pages/
│   │   │   ├── ProfileCreatePage.tsx
│   │   │   ├── IntroductionPage.tsx
│   │   │   └── PhotoUploadPage.tsx
│   │   ├── types/
│   │   │   └── profile.types.ts
│   │   ├── utils/
│   │   │   └── enumMapper.ts
│   │   └── index.ts
│   │
│   └── review/             # 🚧 진행 중
│       ├── pages/
│       │   ├── ReviewPendingPage.tsx
│       │   ├── RejectedPage.tsx
│       │   └── BannedPage.tsx
│       ├── types/
│       │   └── review.types.ts
│       └── index.ts
│
├── shared/                 # ✅ 완료
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   ├── hooks/
│   ├── utils/
│   ├── api/
│   ├── types/
│   ├── constants/
│   └── config/
│
└── assets/                # 정적 파일
    ├── images/
    └── data/
        ├── regions.json
        └── occupations.json
```

---

## 📝 남은 마이그레이션 작업

### Phase 4: Profile Feature 분리

#### 1. API 이동
```bash
mv api/profile.ts features/profile/api/profileApi.ts
```

#### 2. 페이지 이동
```bash
mv pages/ProfileCreatePage.tsx features/profile/pages/
mv pages/IntroductionPage.tsx features/profile/pages/
mv pages/PhotoUploadPage.tsx features/profile/pages/
```

#### 3. 컴포넌트 이동
```bash
mv components/HeightSelector.tsx features/profile/components/
mv components/RegionSelector.tsx features/profile/components/
mv components/PersonalitySelector.tsx features/profile/components/
mv components/OccupationSelector.tsx features/profile/components/
mv components/BirthDateSelector.tsx features/profile/components/
mv components/SimpleSelector.tsx features/profile/components/
```

#### 4. 유틸 이동
```bash
# enumMapper는 이미 shared/utils에 있지만, profile 전용이므로 이동
mv shared/utils/enumMapper.ts features/profile/utils/
```

#### 5. 타입 분리
`shared/types/common.types.ts`에서 Profile 관련 타입을 추출하여 `features/profile/types/profile.types.ts` 생성

```typescript
// features/profile/types/profile.types.ts
export interface ProfileFormData {
  nickname: string
  gender: 'MALE' | 'FEMALE' | ''
  birthDate: string
  occupation: string
  company: string
  school: string
  region: string
  workRegion: string
  height: number
  bloodType: 'A' | 'B' | 'O' | 'AB' | ''
  bodyType: string | ''
  personalities: string[]
  religion: string | ''
  drinking: string | ''
  smoking: string | ''
  hasCar: boolean | null
}

export interface UserProfileResponse {
  nickname: string
  gender: 'MALE' | 'FEMALE'
  birthday: string
  jobCategory: string
  jobTitle: string
  company: string
  school: string
  residenceCity: string
  residenceDistrict: string
  workCity: string
  workDistrict: string
  height: number
  bloodType: 'A' | 'B' | 'O' | 'AB'
  bodyType: string
  personalities: string[]
  religion: string
  drinking: string
  smoking: string
  hasCar: boolean
  introduction: string
  images: ProfileImage[]
}

export interface ProfileImage {
  imageUrl: string
  displayOrder: number
}

export interface BackendProfileRequest {
  nickname: string
  gender: 'MALE' | 'FEMALE'
  birthday: string
  jobCategory: string
  jobTitle: string
  company: string
  school: string
  residenceCity: string
  residenceDistrict: string
  workCity: string
  workDistrict: string
  height: number
  bloodType: 'A' | 'B' | 'O' | 'AB'
  bodyType: string
  personalities: string[]
  religion: string
  drinking: string
  smoking: string
  hasCar: boolean
  introduction: string
}
```

#### 6. Public API 정의
```typescript
// features/profile/index.ts
export { default as ProfileCreatePage } from './pages/ProfileCreatePage'
export { default as IntroductionPage } from './pages/IntroductionPage'
export { default as PhotoUploadPage } from './pages/PhotoUploadPage'

export * from './api/profileApi'

export type {
  ProfileFormData,
  UserProfileResponse,
  BackendProfileRequest,
  ProfileImage
} from './types/profile.types'
```

---

### Phase 5: Review Feature 분리

```bash
# 페이지 이동
mv pages/ReviewPendingPage.tsx features/review/pages/
mv pages/RejectedPage.tsx features/review/pages/
mv pages/BannedPage.tsx features/review/pages/
mv pages/MainPage.tsx features/review/pages/  # 또는 features/main/
```

```typescript
// features/review/index.ts
export { default as ReviewPendingPage } from './pages/ReviewPendingPage'
export { default as RejectedPage } from './pages/RejectedPage'
export { default as BannedPage } from './pages/BannedPage'
export { default as MainPage } from './pages/MainPage'
```

---

### Phase 6: App 진입점 정리

#### 1. App.tsx 이동
```bash
mv App.tsx app/App.tsx
```

#### 2. main.tsx 이동
```bash
mv main.tsx app/main.tsx
```

#### 3. App.tsx import 경로 업데이트
```typescript
// app/App.tsx
import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/features/auth'
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute'

// Feature에서 import
import {
  LandingPage,
  KakaoCallback
} from '@/features/auth'

import {
  ProfileCreatePage,
  IntroductionPage,
  PhotoUploadPage
} from '@/features/profile'

import {
  ReviewPendingPage,
  RejectedPage,
  BannedPage,
  MainPage
} from '@/features/review'

// ... 라우트 정의
```

---

### Phase 7: Import 경로 일괄 업데이트

프로젝트 전체에서 import 경로를 새 구조에 맞게 변경:

#### Before:
```typescript
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentUser } from '@/api/auth'
import { submitProfile } from '@/api/profile'
import type { ProfileFormData } from '@/types'
import api from '@/api/axios'
```

#### After:
```typescript
import { useAuth } from '@/features/auth'
import { getCurrentUser } from '@/features/auth'
import { submitProfile } from '@/features/profile'
import type { ProfileFormData } from '@/features/profile'
import api from '@/shared/api/axios'
```

#### 자동 변경 스크립트 (참고):
```bash
# 예시: find & replace
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/@\/api\/auth/@\/features\/auth/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/@\/api\/profile/@\/features\/profile/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/@\/contexts\/AuthContext/@\/features\/auth/g'
```

---

## 🎨 계층별 가이드

### 1. Data Layer (API)
**책임**: 서버 통신, 데이터 변환
```typescript
// features/profile/api/profileApi.ts
import api from '@/shared/api/axios'
import type { BackendProfileRequest } from '../types/profile.types'

export const profileApi = {
  submit: async (data: BackendProfileRequest, images: File[]) => {
    const formData = new FormData()
    formData.append('profile', new Blob([JSON.stringify(data)], {
      type: 'application/json'
    }))
    images.forEach(img => formData.append('images', img))

    return api.post('/api/v1/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  checkNickname: async (nickname: string) => {
    const res = await api.get<{ available: boolean }>(
      `/api/v1/users/nicknames/${encodeURIComponent(nickname)}/availability`
    )
    return res.data
  }
}
```

### 2. Domain Layer (Hooks)
**책임**: 비즈니스 로직, 상태 관리
```typescript
// features/profile/hooks/useNicknameCheck.ts
import { useState } from 'react'
import { profileApi } from '../api/profileApi'

export function useNicknameCheck() {
  const [nickname, setNickname] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [lastChecked, setLastChecked] = useState('')

  const checkNickname = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력하세요')
      return
    }

    setStatus('checking')
    setLastChecked(nickname)

    try {
      const result = await profileApi.checkNickname(nickname)
      setStatus(result.available ? 'available' : 'unavailable')
      alert(result.available ? '✅ 사용 가능' : '❌ 중복')
    } catch (error) {
      console.error('중복확인 실패:', error)
      setStatus('idle')
    }
  }

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    if (value !== lastChecked) {
      setStatus('idle')
    }
  }

  return {
    nickname,
    status,
    checkNickname,
    handleNicknameChange,
    isValid: status === 'available'
  }
}
```

### 3. Presentation Layer (Components/Pages)
**책임**: UI 렌더링, 이벤트 처리
```typescript
// features/profile/pages/ProfileCreatePage.tsx
import { useNicknameCheck } from '../hooks/useNicknameCheck'
import { NicknameInput } from '../components/NicknameInput'

export default function ProfileCreatePage() {
  const nicknameCheck = useNicknameCheck()

  return (
    <form>
      <NicknameInput
        value={nicknameCheck.nickname}
        status={nicknameCheck.status}
        onChange={nicknameCheck.handleNicknameChange}
        onCheck={nicknameCheck.checkNickname}
      />
    </form>
  )
}
```

---

## ✅ 마이그레이션 체크리스트

### Auth Feature ✅
- [x] API 분리
- [x] Hooks 분리
- [x] Components 분리
- [x] Pages 분리
- [x] Types 분리
- [x] Public API 정의

### Profile Feature 🚧
- [ ] API 이동 (`api/profile.ts` → `features/profile/api/`)
- [ ] Hooks 생성 (`useProfileForm`, `useNicknameCheck`)
- [ ] Components 이동 (Selectors)
- [ ] Pages 이동 (Create, Introduction, PhotoUpload)
- [ ] Types 분리
- [ ] Utils 이동 (`enumMapper`)
- [ ] Public API 정의

### Review Feature 🚧
- [ ] Pages 이동 (Pending, Rejected, Banned, Main)
- [ ] Public API 정의

### App 🚧
- [ ] App.tsx 이동
- [ ] main.tsx 이동
- [ ] Import 경로 업데이트

---

## 🚀 빠른 시작 가이드

### 1. 현재 작동하는 구조 유지
기존 구조도 여전히 작동합니다. 점진적으로 마이그레이션하세요.

### 2. Feature별로 순차 마이그레이션
1. Auth (완료)
2. Profile (진행 중)
3. Review (대기)

### 3. Import 경로는 마지막에 일괄 변경
모든 파일 이동 후 한 번에 import 경로 수정

### 4. 테스트
각 Phase 완료 후 `npm run dev`로 동작 확인

---

## 📚 참고 자료

- **Bulletproof React**: https://github.com/alan2207/bulletproof-react
- **Feature-Sliced Design**: https://feature-sliced.design/
- **React Folder Structure**: https://www.robinwieruch.de/react-folder-structure/
- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

---

**마지막 업데이트**: 2025.01.25
**작성자**: 강준호
