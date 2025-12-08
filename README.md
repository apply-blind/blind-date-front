# Blind Date 포트폴리오

---

## 프로젝트 개요

React 19와 Spring Boot를 활용해 개발 역량을 증명하기 위한 포트폴리오 프로젝트입니다.
복잡한 상태 관리, 워크플로우, 실시간 통신 등 블라인드 데이트에서 요구되는 기술들을 직접 구현하며 준비했습니다.


**구현한 핵심 기능:**
- 승인 워크플로우 (프로필 제출 → 관리자 심사 → 사용자 검증)
- SSE(Server-Sent Events) 기반 실시간 알림 시스템
- JWT HttpOnly Cookie 인증 및 자동 토큰 갱신
- Elasticsearch를 활용한 한글 형태소 분석 검색

**적용 기술:**
- React 19 최신 기능 활용 (use hook, React Compiler 대응)
- TypeScript Strict Mode 100% 준수 (any 타입 0%)
- Elasticsearch + Kafka 이벤트 기반 아키텍처 구현
- 프론트엔드/백엔드 아키텍처 일관성 설계

---

## 주요 기능

- **3단계 프로필 심사** - 사진 및 프로필 제출 → 관리자 검토 -> 승인/반려
- **실시간 알림** - SSE 기반 게시글 작성, 좋아요, 댓글, 대댓글, 메시지 즉시 알림
- **익명 게시판** - 사용자 소통 공간 (댓글, 대댓글 지원)
- **JWT 인증** - HttpOnly Cookie + 자동 토큰 갱신
- **PWA 지원** - 모바일 최적화 (iOS Safe Area, Android Gesture Bar 대응)

---

## 기술 스택

### Frontend

| 분류 | 기술 | 버전 |
|------|------|------|
| Core | React | 19.2.0 |
| | TypeScript | 5.9.3 |
| | Vite | 7.2.2 |
| Router | React Router DOM | 7.9.6 |
| Styling | Tailwind CSS | 3.4.18 |
| HTTP | Axios | 1.13.2 |
| Icons | Lucide React | 0.468.0 |
| Notifications | EventSource Polyfill | 2.0.2 |

### Backend

| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | Spring Boot | 3.5.8 |
| Language | Java | 17 |
| Database | MySQL | 8.0 |
| Cache | Redis | 7.0 |
| Search | Elasticsearch | 8.x |
| Message Queue | Kafka | 3.x |
| Security | Spring Security + OAuth2 | - |
| Storage | AWS S3 + CloudFront | - |

---

## 프로젝트 구조

Feature-based Clean Architecture를 적용하여 백엔드의 3-Layer Architecture와 개념을 동일하게 유지했습니다.

```
src/
├── features/              # 기능별 모듈 (Domain-Driven Design)
│   ├── auth/             # 인증 도메인
│   │   ├── api/         # Data Layer - 서버 통신
│   │   ├── hooks/       # Domain Layer - 비즈니스 로직
│   │   ├── pages/       # Presentation Layer - 라우트
│   │   ├── components/  # Presentation Layer - UI
│   │   └── types/       # DTO
│   ├── profile/         # 프로필 관리
│   ├── review/          # 심사 시스템
│   ├── board/           # 게시판
│   ├── admin/           # 관리자
│   └── notification/    # 알림
│
└── shared/              # 공통 모듈
    ├── api/            # Axios 인스턴스, 인터셉터
    ├── components/     # 공통 컴포넌트
    ├── utils/          # 유틸리티 함수
    └── types/          # 공통 타입
```

**백엔드 vs 프론트엔드 매핑:**

| 백엔드 (Spring Boot) | 프론트엔드 (React) | 역할 |
|---------------------|-------------------|------|
| Controller | `pages/` | HTTP 요청/라우트 처리 |
| Service | `hooks/` | 비즈니스 로직 |
| Repository | `api/` | 데이터 접근 |
| DTO | `types/` | 데이터 전송 객체 |
| Domain Package | `features/` | 도메인별 모듈화 |

---

## 빠른 시작

### 사전 요구사항

- Node.js 18.x 이상
- npm 9.x 이상

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 VITE_KAKAO_CLIENT_ID, VITE_API_BASE_URL 설정

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 타입 체크
npx tsc --noEmit

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 주요 기술 선택 이유

### React 19 + TypeScript Strict Mode
- **선택 이유**: 타입 안전성 극대화, `any` 타입 사용 금지
- **적용 사례**: `noUncheckedIndexedAccess` 옵션으로 배열/객체 접근 시 `undefined` 체크 강제
- **트레이드오프**: 초기 개발 속도는 느리지만, 런타임 에러 사전 방지

### SSE (Server-Sent Events) 기반 실시간 알림
- **선택 이유**: WebSocket 대비 낮은 서버 부하, HTTP/1.1 호환
- **적용 사례**: 매칭, 좋아요, 메시지 알림을 단방향 스트림으로 처리
- **트레이드오프**: 양방향 통신 불가하지만 이 프로젝트에서는 불필요

### Feature-based Architecture
- **선택 이유**: 도메인별 응집도 향상, 백엔드 구조와 일관성 유지
- **적용 사례**: `features/auth`, `features/profile` 등 독립적 모듈
- **트레이드오프**: 초기 폴더 구조 복잡하지만, 확장성과 유지보수성 향상

### Vite 7 (Rolldown 통합)
- **선택 이유**: esbuild 기반 빠른 HMR, React 19 최신 기능 지원
- **성과**: 개발 서버 시작 시간 < 1초, HMR < 50ms
- **트레이드오프**: CRA 대비 설정 필요하지만 빌드 속도 3-5배 향상

---

## 성능 최적화

### Code Splitting
- 라우트 기반 Lazy Loading (`React.lazy` + `Suspense`)
- 30kb 이상 컴포넌트 분리 (PostDetailPage: Lexical 에디터)
- 동적 Import로 초기 번들 크기 최소화

### Bundle 최적화
- Tree Shaking으로 미사용 코드 제거
- esbuild 기반 Minification
- Gzip 압축 후 메인 번들 < 100kb

### PWA 최적화
- Manifest.json (192x192, 512x512 maskable icons)
- Safe Area 대응 (iOS Notch, Android Gesture Bar)
- Touch target 최소 44px (WCAG 2.5.8 준수)
- Modern viewport units (dvh, svh, lvh)

---

## 디자인 시스템

### 2025 디자인 트렌드 적용

- **완전 원형 버튼** (`rounded-full`) - 모든 액션 버튼
- **큰 라운딩 카드** (`rounded-3xl`, 24px) - 콘텐츠 카드
- **강한 그림자** (shadow-card, shadow-button) - 깊이감 표현
- **그라데이션 배경** (pink-50/30 → white) - 부드러운 시각 효과
- **마이크로 인터랙션** (200ms transitions) - active:scale-95

### 색상 팔레트

```css
primary: {
  500: '#FF5864',  /* Main brand color */
  600: '#FD297B',  /* Darker pink */
}
```

---

## 보안

### JWT 토큰 관리
- HttpOnly Cookie로 XSS 공격 방지
- Access Token (1시간) + Refresh Token (7일)
- Axios 인터셉터로 401/403 발생 시 자동 토큰 갱신

### 환경 변수 보호
- `.env` 파일 Git 커밋 금지 (`.gitignore` 등록)
- 프로덕션 환경변수는 배포 플랫폼에서 관리

---

## 아키텍처 설계 원칙

### TypeScript 필수 규칙

```typescript
// ✅ CORRECT: Union types
interface FormData {
  gender: 'MALE' | 'FEMALE' | ''
  hasCar: boolean | null
}

// ❌ WRONG: any 사용 금지
const data: any = something
```

### 컴포넌트 작성

```typescript
// ✅ CORRECT: function 선언
export function Component({ value }: Props) {
  return <div>{value}</div>
}

// ✅ CORRECT: 버튼에 type 명시
<button type="button" onClick={handler}>클릭</button>

// ❌ WRONG: React.FC 사용
export const Component: React.FC<Props> = () => {}
```

### 에러 처리

```typescript
try {
  await api.post('/endpoint', data)
} catch (err: unknown) {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message || err.message
    if (import.meta.env.DEV) {
      console.error('Error:', err)
    }
  }
}
```

---

## 배포

### Vercel 배포 가이드

1. **Vercel 계정 연동**
   - [Vercel](https://vercel.com) 접속 및 GitHub 연동
   - Private repository 접근 권한 승인

2. **프로젝트 Import**
   - "New Project" → GitHub에서 이 repository 선택
   - Framework Preset: `Vite` (자동 감지)
   - Root Directory: `./` (기본값)

3. **환경 변수 설정**
   ```
   VITE_KAKAO_CLIENT_ID=your_kakao_client_id
   VITE_KAKAO_REDIRECT_URI=https://your-app.vercel.app/auth/kakao/callback
   VITE_API_BASE_URL=https://your-backend-api-url
   ```

4. **카카오 개발자 센터 설정**
   - 배포 완료 후 Vercel 도메인 확인
   - [카카오 개발자 센터](https://developers.kakao.com) → 내 애플리케이션
   - **앱 설정** → **플랫폼** → **Web 플랫폼 등록**
   - Redirect URI 추가: `https://your-app.vercel.app/auth/kakao/callback`

5. **재배포**
   - 환경 변수 업데이트 후 Vercel에서 자동 재배포
   - 카카오 로그인 동작 테스트

---

## 문서

- [API.md](./API.md) - 백엔드 API 명세서
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 클린 아키텍처 상세 가이드
- [kakaoLogin.md](./kakaoLogin.md) - 카카오 OAuth 2.0 구현 가이드

---

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.

---

**개발자**: 강준호 (Kang Junho)
**개발 기간**: 2024.11.29 - 2024.12.09
**개발 형태**: 1인 풀스택 개발 (기획, 디자인, 프론트엔드, 백엔드)

**Last Updated**: 2024-12-09
**Version**: 1.0.0
