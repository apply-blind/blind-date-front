# Blind API 문서 (프론트엔드용)

> 데이팅 앱 백엔드 API 명세서
> Base URL: `http://localhost:8080`
> 마지막 업데이트: 2025-11-25

---

## 목차
1. [개요](#개요)
2. [인증 방식](#인증-방식)
3. [에러 응답 형식](#에러-응답-형식)
4. [인증 API](#인증-api)
5. [사용자 API](#사용자-api)
6. [DTO 명세](#dto-명세)
7. [에러 코드](#에러-코드)

---

## 개요

### 기술 스택
- **인증**: JWT (HttpOnly Cookie)
- **응답 형식**: JSON
- **에러 표준**: RFC 9457 (Problem Details for HTTP APIs)
- **문자 인코딩**: UTF-8

### 공통 헤더
```http
Content-Type: application/json
Accept: application/json
```

---

## 인증 방식

### JWT 기반 인증 (HttpOnly Cookie)

#### Access Token
- **유효 기간**: 1시간
- **쿠키 이름**: `access_token`
- **경로**: `/api/v1` (모든 API 접근 가능)
- **속성**: HttpOnly, Secure (프로덕션), SameSite=Lax

#### Refresh Token
- **유효 기간**: 7일
- **쿠키 이름**: `refresh_token`
- **경로**: `/api/v1/auth/tokens` (토큰 갱신 API만 접근)
- **속성**: HttpOnly, Secure (프로덕션), SameSite=Lax

#### 인증 플로우
1. 로그인 → Access Token + Refresh Token 발급 (쿠키에 저장)
2. API 요청 시 Access Token 자동 전송
3. Access Token 만료 → 401 에러 → Refresh Token으로 재발급
4. Refresh Token도 만료 → 로그인 페이지로 이동

#### 인증이 필요한 API
- `DELETE /api/v1/auth/tokens` (로그아웃)
- `POST /api/v1/users/profiles` (프로필 생성)
- `PUT /api/v1/users/profiles` (프로필 수정)
- `GET /api/v1/users/me` (내 정보 조회)
- `GET /api/v1/users/profiles/me` (내 프로필 전체 조회)
- `GET /api/v1/users/nicknames/check` (닉네임 중복 확인)

---

## 에러 응답 형식

### RFC 9457 (Problem Details) 표준

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "이미 사용 중인 닉네임입니다",
  "instance": "/api/v1/users/profiles",
  "code": "nickname001",
  "timestamp": "2025-11-25T14:30:00"
}
```

### 필드 설명
- `type`: 에러 타입 URI (기본값: `about:blank`)
- `title`: HTTP 상태 코드 이름 (예: "Bad Request")
- `status`: HTTP 상태 코드 (예: 400)
- `detail`: 에러 상세 메시지 (한글)
- `instance`: 요청한 URI
- `code`: 에러 코드 (예: "nickname001")
- `timestamp`: 에러 발생 시각

### Validation 에러 (400)
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "입력값 검증에 실패했습니다",
  "instance": "/api/v1/users/profiles",
  "code": "valid001",
  "timestamp": "2025-11-25T14:30:00",
  "invalidFields": {
    "nickname": "닉네임은 필수입니다",
    "birthday": "생년월일은 과거 날짜여야 합니다"
  }
}
```

---

## 인증 API

### 1. 로그인 (카카오 OAuth2)

```http
POST /api/v1/auth/tokens
Content-Type: application/json
```

**Request Body**
```json
{
  "code": "카카오_인가_코드"
}
```

**Response**
```http
HTTP/1.1 200 OK
Set-Cookie: access_token=eyJhbG...; Path=/api/v1; HttpOnly; SameSite=Lax
Set-Cookie: refresh_token=eyJhbG...; Path=/api/v1/auth/tokens; HttpOnly; SameSite=Lax
```

**응답 본문 없음** (토큰은 쿠키로 전송)

**에러**
- `401 auth004`: 유효하지 않은 인가 코드
- `500`: 카카오 서버 오류

---

### 2. 토큰 갱신

```http
PUT /api/v1/auth/tokens
Cookie: refresh_token=eyJhbG...
```

**Request Body**: 없음 (Refresh Token은 쿠키에서 자동 추출)

**Response**
```http
HTTP/1.1 200 OK
Set-Cookie: access_token=eyJhbG...; Path=/api/v1; HttpOnly; SameSite=Lax
Set-Cookie: refresh_token=eyJhbG...; Path=/api/v1/auth/tokens; HttpOnly; SameSite=Lax
```

**에러**
- `401 auth003`: Refresh Token 만료
- `401 auth004`: 유효하지 않거나 이미 사용된 토큰

**참고**: Refresh Token Rotation 적용 (사용된 토큰은 즉시 무효화)

---

### 3. 로그아웃

```http
DELETE /api/v1/auth/tokens
Cookie: access_token=eyJhbG...
```

**인증 필요**: ✅ Access Token

**Request Body**: 없음

**Response**
```http
HTTP/1.1 200 OK
Set-Cookie: access_token=; Path=/api/v1; Max-Age=0
Set-Cookie: refresh_token=; Path=/api/v1/auth/tokens; Max-Age=0
```

**동작**
1. Access Token으로 사용자 인증
2. 해당 사용자의 모든 활성 Refresh Token 무효화
3. 쿠키 삭제

**에러**
- `401 auth003`: Access Token 만료 → 토큰 갱신 후 재시도
- `401 auth004`: 유효하지 않은 Access Token

---

## 사용자 API

### 1. 내 정보 조회

```http
GET /api/v1/users/me
Cookie: access_token=eyJhbG...
```

**인증 필요**: ✅ Access Token

**Response** (200 OK)
```json
{
  "publicId": "01939dc4-1234-7890-abcd-ef1234567890",
  "status": "APPROVED",
  "grade": "USER",
  "rejectionReason": null,
  "hasProfile": true,
  "nickname": "홍길동"
}
```

**에러**
- `401`: 인증 실패

---

### 2. 닉네임 중복 확인

```http
GET /api/v1/users/nicknames/check?nickname=홍길동
Cookie: access_token=eyJhbG...
```

**인증 필요**: ✅ Access Token

**Query Parameters**
- `nickname` (필수): 확인할 닉네임

**Response** (200 OK)
```json
{
  "available": true
}
```

**필드 설명**
- `available`: `true` = 사용 가능, `false` = 이미 사용 중

**참고**: 자기 자신의 현재 닉네임은 `available: true`로 반환됨

**에러**
- `400 valid001`: nickname 파라미터 누락
- `401`: 인증 실패

---

### 3. 프로필 생성

```http
POST /api/v1/users/profiles
Cookie: access_token=eyJhbG...
Content-Type: multipart/form-data
```

**인증 필요**: ✅ Access Token

**상태 요구사항**: `PROFILE_WRITING` 상태에서만 가능

**Request Body** (multipart/form-data)
```
profile: {
  "nickname": "홍길동",
  "gender": "MALE",
  "birthday": "1995-03-15",
  "jobCategory": "IT_DEVELOPMENT",
  "jobTitle": "백엔드 개발자",
  "company": "네이버",
  "school": "서울대학교",
  "residenceCity": "SEOUL",
  "residenceDistrict": "GANGNAM",
  "workCity": "SEOUL",
  "workDistrict": "BUNDANG",
  "height": 175,
  "bloodType": "A",
  "bodyType": "AVERAGE",
  "personalities": ["ACTIVE", "HUMOROUS"],
  "religion": "NONE",
  "drinking": "SOMETIMES",
  "smoking": "NON_SMOKER",
  "hasCar": true,
  "introduction": "안녕하세요!"
}
images: [File, File, File]  // 3-6개 (필수)
```

**Validation 규칙**
- `nickname`: 2-10자, 한글/영문/숫자만 허용
- `birthday`: 만 19세 이상 (과거 날짜)
- `jobCategory`: IT_DEVELOPMENT, EDUCATION, MEDICAL 등 (Enum)
- `jobTitle`: 2-30자 (선택)
- `company`: 2-30자 (선택)
- `school`: 2-30자 (선택)
- `residenceCity`, `workCity`: SEOUL, BUSAN 등 (Enum)
- `residenceDistrict`, `workDistrict`: 시/도에 속한 구/군 (Enum, 유효성 검증)
- `height`: 100-250cm
- `bloodType`: A, B, O, AB, UNKNOWN
- `bodyType`: SLIM, AVERAGE, ATHLETIC, CHUBBY
- `personalities`: 최소 1개 (ACTIVE, CALM, HUMOROUS 등)
- `religion`: NONE, CHRISTIANITY, CATHOLICISM, BUDDHISM, OTHER
- `drinking`: NON_DRINKER, SOMETIMES, OFTEN
- `smoking`: NON_SMOKER, TRYING_TO_QUIT, SMOKER
- `introduction`: 1-500자
- `images`: 3-6개 파일, 각 파일 최대 10MB

**Response**
```http
HTTP/1.1 201 Created
```

**응답 본문 없음**

**동작**
1. 이미지 검증 (3-6개, 각 10MB 이하)
2. S3 업로드
3. DB 저장 (프로필 + 이미지)
4. 사용자 상태 변경: `PROFILE_WRITING` → `UNDER_REVIEW`

**에러**
- `400 profile001`: 이미 프로필 존재
- `400 nickname001`: 이미 사용 중인 닉네임
- `400 nickname002`: 닉네임 중복 (레이스 컨디션)
- `400 image002`: 이미지 개수 초과 (최대 6개)
- `400 image003`: 파일 크기 초과 (10MB)
- `400 valid001`: Validation 실패 (`invalidFields` 확인)
- `500 s3001`: S3 업로드 실패
- `500 image001`: 이미지 처리 실패

---

### 4. 프로필 수정

```http
PUT /api/v1/users/profiles
Cookie: access_token=eyJhbG...
Content-Type: multipart/form-data
```

**인증 필요**: ✅ Access Token

**상태 요구사항**
- ✅ 수정 가능: `APPROVED` (승인됨), `REJECTED` (반려됨)
- ❌ 수정 불가: `PROFILE_WRITING` (생성만 가능), `UNDER_REVIEW` (심사 중), `BANNED` (정지됨)

**Request Body**: 프로필 생성과 동일 (multipart/form-data)

**Response**
```http
HTTP/1.1 200 OK
```

**응답 본문 없음**

**동작**
1. 상태 검증
2. 기존 이미지 조회
3. 닉네임 변경 시 중복 검증
4. 새 이미지 S3 업로드
5. DB 업데이트 (기존 이미지 삭제, 새 이미지 저장)
6. `REJECTED` 상태였다면 → `UNDER_REVIEW`로 변경

**에러**
- `400 profile003`: 프로필 생성 먼저 필요
- `403 profile004`: 심사 중에는 수정 불가
- `403 profile005`: 정지된 사용자는 수정 불가
- `404 profile002`: 프로필 없음
- `400 nickname001`: 이미 사용 중인 닉네임
- `400 image002`: 이미지 개수 초과
- `400 image003`: 파일 크기 초과
- `400 valid001`: Validation 실패
- `500 s3001`: S3 업로드 실패
- `500 image001`: 이미지 처리 실패

---

### 5. 내 프로필 전체 조회

```http
GET /api/v1/users/profiles/me
Cookie: access_token=eyJhbG...
```

**인증 필요**: ✅ Access Token

**Response** (200 OK)
```json
{
  "nickname": "홍길동",
  "gender": "MALE",
  "age": 30,
  "jobCategory": "IT_DEVELOPMENT",
  "jobTitle": "백엔드 개발자",
  "company": "네이버",
  "school": "서울대학교",
  "residenceCity": "SEOUL",
  "residenceDistrict": "GANGNAM",
  "workCity": "SEOUL",
  "workDistrict": "BUNDANG",
  "height": 175,
  "bloodType": "A",
  "bodyType": "AVERAGE",
  "personalities": ["ACTIVE", "HUMOROUS"],
  "religion": "NONE",
  "drinking": "SOMETIMES",
  "smoking": "NON_SMOKER",
  "hasCar": true,
  "introduction": "안녕하세요!",
  "imageUrls": [
    "https://s3.amazonaws.com/blind-bucket/user-profiles/01939dc4-1234.jpg",
    "https://s3.amazonaws.com/blind-bucket/user-profiles/01939dc4-5678.jpg",
    "https://s3.amazonaws.com/blind-bucket/user-profiles/01939dc4-9012.jpg"
  ]
}
```

**에러**
- `404 profile002`: 프로필 없음
- `500 profile006`: 데이터 정합성 오류 (사용자 상태가 `PROFILE_WRITING`이 아닌데 프로필 없음)

---

## DTO 명세

### UserStatus (사용자 상태)
| 값 | 설명 |
|---|---|
| `PROFILE_WRITING` | 프로필 작성 중 (회원가입 직후) |
| `UNDER_REVIEW` | 심사 중 |
| `APPROVED` | 승인됨 (앱 사용 가능) |
| `REJECTED` | 반려됨 (재작성 필요) |
| `BANNED` | 정지됨 |

### Grade (등급)
| 값 | 설명 |
|---|---|
| `USER` | 일반 사용자 |
| `ADMIN` | 관리자 |

### Gender (성별)
| 값 | 설명 |
|---|---|
| `MALE` | 남성 |
| `FEMALE` | 여성 |

### JobCategory (직업 카테고리)
| 값 | 설명 |
|---|---|
| `IT_DEVELOPMENT` | IT/개발 |
| `DESIGN` | 디자인 |
| `MARKETING_SALES` | 마케팅/영업 |
| `PLANNING_STRATEGY` | 기획/전략 |
| `HR` | 인사 |
| `FINANCE_ACCOUNTING` | 재무/회계 |
| `LEGAL` | 법무 |
| `EDUCATION` | 교육 |
| `MEDICAL` | 의료 |
| `SERVICE` | 서비스업 |
| `MANUFACTURING` | 제조업 |
| `CONSTRUCTION` | 건설업 |
| `MEDIA` | 미디어 |
| `ART_CULTURE` | 예술/문화 |
| `PUBLIC_SERVICE` | 공무원 |
| `SELF_EMPLOYED` | 자영업 |
| `STUDENT` | 학생 |
| `UNEMPLOYED` | 무직 |
| `OTHER` | 기타 |

### City (시/도)
| 값 | 설명 |
|---|---|
| `SEOUL` | 서울특별시 |
| `BUSAN` | 부산광역시 |
| `INCHEON` | 인천광역시 |
| `DAEGU` | 대구광역시 |
| `DAEJEON` | 대전광역시 |
| `GWANGJU` | 광주광역시 |
| `ULSAN` | 울산광역시 |
| `SEJONG` | 세종특별자치시 |
| `GYEONGGI` | 경기도 |
| `GANGWON` | 강원특별자치도 |
| `CHUNGBUK` | 충청북도 |
| `CHUNGNAM` | 충청남도 |
| `JEONBUK` | 전북특별자치도 |
| `JEONNAM` | 전라남도 |
| `GYEONGBUK` | 경상북도 |
| `GYEONGNAM` | 경상남도 |
| `JEJU` | 제주특별자치도 |

### District (구/군)
각 시/도별로 유효한 구/군이 다릅니다.
- **서울**: `GANGNAM`, `GANGDONG`, `GANGBUK`, `GANGSEO`, `GWANAK`, `GWANGJIN`, `GURO`, `GEUMCHEON`, `NOWON`, `DOBONG`, `DONGDAEMUN`, `DONGJAK`, `MAPO`, `SEODAEMUN`, `SEOCHO`, `SEONGDONG`, `SEONGBUK`, `SONGPA`, `YANGCHEON`, `YEONGDEUNGPO`, `YONGSAN`, `EUNPYEONG`, `JONGNO`, `JUNG`, `JUNGNANG`
- **부산**: `GANGSEO`, `GEUMJEONG`, `GIJANG`, `NAM`, `DONG`, `DONGRAE`, `BUSANJIN`, `BUK`, `SASANG`, `SAHA`, `SEO`, `SUYEONG`, `YEONJE`, `YEONGDO`, `JUNG`, `HAEUNDAE`
- **경기**: `SUWON`, `SEONGNAM`, `GOYANG`, `YONGIN`, `BUCHEON`, `ANSAN`, `ANYANG`, `NAMYANGJU`, `HWASEONG`, `PYEONGTAEK`, `UIJEONGBU`, `SIHEUNG`, `PAJU`, `GIMPO`, `GWANGMYEONG`, `GWANGJU`, `GUNPO`, `OSAN`, `ICHEON`, `YANGJU`, `ANSEONG`, `GURI`, `HANAM`, `YEOJU`, `DONGDUCHEON`, `POCHEON`, `GWACHEON`, `YANGPYEONG`, `YEONCHEON`, `GAPYEONG`, `BUNDANG`
- 기타 시/도는 생략 (전체 목록은 코드 참조)

### BloodType (혈액형)
| 값 | 설명 |
|---|---|
| `A` | A형 |
| `B` | B형 |
| `O` | O형 |
| `AB` | AB형 |
| `UNKNOWN` | 모름 |

### BodyType (체형)
| 값 | 설명 |
|---|---|
| `SLIM` | 마른 편 |
| `AVERAGE` | 보통 |
| `ATHLETIC` | 운동을 즐기는 편 |
| `CHUBBY` | 통통한 편 |

### Personality (성격)
| 값 | 설명 |
|---|---|
| `ACTIVE` | 활발함 |
| `CALM` | 차분함 |
| `HUMOROUS` | 유머러스함 |
| `SERIOUS` | 진지함 |
| `OUTGOING` | 외향적 |
| `INTROVERTED` | 내향적 |
| `SENSITIVE` | 섬세함 |
| `EASYGOING` | 느긋함 |
| `PASSIONATE` | 열정적 |
| `RATIONAL` | 이성적 |

### Religion (종교)
| 값 | 설명 |
|---|---|
| `NONE` | 무교 |
| `CHRISTIANITY` | 기독교 |
| `CATHOLICISM` | 천주교 |
| `BUDDHISM` | 불교 |
| `WON_BUDDHISM` | 원불교 |
| `ISLAM` | 이슬람교 |
| `OTHER` | 기타 |

### DrinkingHabit (음주 습관)
| 값 | 설명 |
|---|---|
| `NON_DRINKER` | 전혀 안 함 |
| `SOMETIMES` | 가끔 |
| `OFTEN` | 자주 |

### SmokingStatus (흡연 상태)
| 값 | 설명 |
|---|---|
| `NON_SMOKER` | 비흡연 |
| `TRYING_TO_QUIT` | 금연 중 |
| `SMOKER` | 흡연 |

---

## 에러 코드

### 인증 관련 (401)
| 코드 | 메시지 | 설명 |
|---|---|---|
| `auth001` | 인증에 실패했습니다 | 일반 인증 실패 |
| `auth002` | 토큰을 찾을 수 없습니다 | 쿠키에 토큰 없음 |
| `auth003` | 토큰이 만료되었습니다 | 토큰 갱신 필요 |
| `auth004` | 유효하지 않거나 이미 사용된 토큰입니다 | 위변조 또는 재사용 시도 |

### 사용자 관련 (404)
| 코드 | 메시지 | 설명 |
|---|---|---|
| `user001` | 사용자를 찾을 수 없습니다 | DB에 사용자 없음 |

### 프로필 관련 (400, 403, 404, 500)
| 코드 | 메시지 | 설명 |
|---|---|---|
| `profile001` | 이미 프로필이 존재합니다 | 프로필 생성 중복 시도 |
| `profile002` | 프로필이 존재하지 않습니다 | 프로필 조회 실패 |
| `profile003` | 프로필을 먼저 생성해주세요 | `PROFILE_WRITING` 상태에서 수정 시도 |
| `profile004` | 심사 중에는 프로필을 수정할 수 없습니다 | `UNDER_REVIEW` 상태에서 수정 시도 |
| `profile005` | 정지된 사용자는 프로필을 수정할 수 없습니다 | `BANNED` 상태에서 수정 시도 |
| `profile006` | 사용자 상태와 프로필 데이터가 일치하지 않습니다 | 데이터 정합성 오류 |

### 닉네임 관련 (400)
| 코드 | 메시지 | 설명 |
|---|---|---|
| `nickname001` | 이미 사용 중인 닉네임입니다 | 닉네임 중복 |
| `nickname002` | 죄송합니다. 방금 다른 사용자가 해당 닉네임을 사용했습니다. 다른 닉네임을 선택해주세요 | 레이스 컨디션으로 인한 중복 |

### 이미지 관련 (400, 500)
| 코드 | 메시지 | 설명 |
|---|---|---|
| `image001` | 이미지 업로드에 실패했습니다 | 서버 이미지 처리 오류 |
| `image002` | 업로드 가능한 이미지 수를 초과했습니다 | 최대 6개 초과 |
| `image003` | 파일 크기가 10MB를 초과할 수 없습니다 | 파일 크기 초과 |
| `image004` | 지원하지 않는 이미지 형식입니다 | 이미지 형식 오류 |

### S3 관련 (400, 500)
| 코드 | 메시지 | 설명 |
|---|---|---|
| `s3001` | S3 업로드에 실패했습니다 | AWS S3 업로드 오류 |
| `s3002` | S3 파일 삭제에 실패했습니다 | AWS S3 삭제 오류 |
| `s3003` | 유효하지 않은 S3 URL입니다 | URL 파싱 실패 |

### 검증 관련 (400)
| 코드 | 메시지 | 설명 |
|---|---|---|
| `valid001` | 입력값 검증에 실패했습니다 | Bean Validation 실패 (`invalidFields` 확인) |

---

## 부록

### 프로필 생성/수정 예시 (JavaScript)

```javascript
const formData = new FormData();

// 1. 프로필 JSON을 Blob으로 추가
const profileData = {
  nickname: "홍길동",
  gender: "MALE",
  birthday: "1995-03-15",
  jobCategory: "IT_DEVELOPMENT",
  jobTitle: "백엔드 개발자",
  company: "네이버",
  school: "서울대학교",
  residenceCity: "SEOUL",
  residenceDistrict: "GANGNAM",
  workCity: "SEOUL",
  workDistrict: "BUNDANG",
  height: 175,
  bloodType: "A",
  bodyType: "AVERAGE",
  personalities: ["ACTIVE", "HUMOROUS"],
  religion: "NONE",
  drinking: "SOMETIMES",
  smoking: "NON_SMOKER",
  hasCar: true,
  introduction: "안녕하세요!"
};

formData.append('profile', new Blob([JSON.stringify(profileData)], {
  type: 'application/json'
}));

// 2. 이미지 파일 추가 (3-6개)
imageFiles.forEach(file => {
  formData.append('images', file);
});

// 3. API 호출
fetch('http://localhost:8080/api/v1/users/profiles', {
  method: 'POST',
  credentials: 'include',  // 쿠키 포함
  body: formData
})
.then(response => {
  if (response.status === 201) {
    console.log('프로필 생성 성공');
  } else {
    return response.json().then(error => {
      console.error('에러:', error.code, error.detail);
      if (error.invalidFields) {
        console.error('검증 실패 필드:', error.invalidFields);
      }
    });
  }
})
.catch(error => console.error('네트워크 오류:', error));
```

### 토큰 갱신 자동화 예시 (JavaScript)

```javascript
async function fetchWithAuth(url, options = {}) {
  options.credentials = 'include';  // 쿠키 포함

  let response = await fetch(url, options);

  // Access Token 만료 시 자동 갱신
  if (response.status === 401) {
    const refreshResponse = await fetch('http://localhost:8080/api/v1/auth/tokens', {
      method: 'PUT',
      credentials: 'include'
    });

    if (refreshResponse.ok) {
      // 토큰 갱신 성공 → 원래 요청 재시도
      response = await fetch(url, options);
    } else {
      // Refresh Token도 만료 → 로그인 페이지로 이동
      window.location.href = '/login';
      return null;
    }
  }

  return response;
}

// 사용 예시
const response = await fetchWithAuth('http://localhost:8080/api/v1/users/me');
if (response && response.ok) {
  const data = await response.json();
  console.log('내 정보:', data);
}
```

---

**마지막 업데이트**: 2025-11-25
**작성자**: Backend Team
**문의**: backend@blind.com
