import type { ProfileFormData, BackendProfileRequest, UserProfileResponse } from '../types/profile.types'
import { loadIntroDraft } from '@/shared/utils/sessionStorage'

/**
 * 프론트엔드 ↔ 백엔드 ENUM 매핑 유틸리티
 */

// 시/도 매핑 (백엔드 City ENUM과 일치)
const CITY_MAP: Record<string, string> = {
  '서울특별시': 'SEOUL',
  '경기도': 'GYEONGGI',
  '인천광역시': 'INCHEON',
  '부산광역시': 'BUSAN',
  '대구광역시': 'DAEGU',
  '대전광역시': 'DAEJEON',
  '광주광역시': 'GWANGJU',
  '울산광역시': 'ULSAN',
  '세종특별자치시': 'SEJONG',
  '강원특별자치도': 'GANGWON',    // ✅ 백엔드: "강원특별자치도"
  '충청북도': 'CHUNGBUK',
  '충청남도': 'CHUNGNAM',
  '전북특별자치도': 'JEONBUK',    // ✅ 백엔드: "전북특별자치도"
  '전라남도': 'JEONNAM',
  '경상북도': 'GYEONGBUK',
  '경상남도': 'GYEONGNAM',
  '제주특별자치도': 'JEJU'
}

// 직업 카테고리 매핑
const JOB_CATEGORY_MAP: Record<string, string> = {
  '일반': 'GENERAL',
  '전문직': 'PROFESSIONAL',
  '의료직': 'MEDICAL',
  '교육직': 'EDUCATION',
  '공무원': 'GOVERNMENT',
  '사업가': 'BUSINESS',
  '금융직': 'FINANCE',
  '연구, 기술직': 'RESEARCH'
}

// 체형 매핑
const BODY_TYPE_MAP: Record<string, string> = {
  '마른': 'SLIM',
  '슬림': 'AVERAGE_SLIM',
  '보통': 'AVERAGE',
  '다소 볼륨': 'SLIGHTLY_VOLUMINOUS',
  '글래머': 'GLAMOROUS',
  '통통': 'CHUBBY',
  '슬림근육': 'SLIM_MUSCULAR',
  '근육질': 'MUSCULAR',
  '우람': 'BULKY'
}

// 성격 매핑
const PERSONALITY_MAP: Record<string, string> = {
  '지적인': 'INTELLIGENT',
  '차분한': 'CALM',
  '재미있는': 'FUNNY',
  '낙천적인': 'OPTIMISTIC',
  '내향적인': 'INTROVERTED',
  '감성적인': 'EMOTIONAL',
  '상냥한': 'KIND',
  '귀여운': 'CUTE',
  '열정적인': 'PASSIONATE',
  '듬직한': 'RELIABLE',
  '개성있는': 'UNIQUE',
  '외향적인': 'EXTROVERTED',
  '센스 있는': 'SENSIBLE'
}

// 종교 매핑
const RELIGION_MAP: Record<string, string> = {
  '무교': 'NONE',
  '기독교': 'CHRISTIAN',
  '천주교': 'CATHOLIC',
  '불교': 'BUDDHIST',
  '원불교': 'WON_BUDDHIST',
  '기타': 'OTHER'
}

// 음주 매핑 (백엔드 Drinking ENUM과 일치)
const DRINKING_MAP: Record<string, string> = {
  '전혀 안 함': 'NEVER',
  '가끔': 'OCCASIONALLY',
  '자주': 'OFTEN',
  '매일': 'DAILY'
}

// 흡연 매핑
// ⚠️ 서버 ENUM: NON_SMOKER, OCCASIONALLY, SMOKER (3개)
// ✅ 1:1 매핑으로 역변환 가능하도록 수정
const SMOKING_MAP: Record<string, string> = {
  '비흡연': 'NON_SMOKER',
  '가끔': 'OCCASIONALLY',  // '술 마실 때만 흡연' 제거 (중복 방지)
  '흡연': 'SMOKER'          // '자주', '전자담배' 통합 (중복 방지)
  // '금연 중'은 NON_SMOKER와 중복이므로 제거
}

/**
 * 프론트엔드 프로필 데이터 → 백엔드 요청 형식 변환
 */
export function convertToBackendRequest(
  profileData: ProfileFormData
): BackendProfileRequest {
  // ✅ 런타임 검증: 필수 필드가 미선택 상태인지 확인
  if (profileData.gender === '') {
    throw new Error('성별을 선택해주세요')
  }
  if (profileData.bloodType === '') {
    throw new Error('혈액형을 선택해주세요')
  }
  if (profileData.hasCar === null) {
    throw new Error('자차 보유 여부를 선택해주세요')
  }

  // ✅ 검증 통과 후 타입 좁히기 (타입 단언 제거)
  const gender: 'MALE' | 'FEMALE' = profileData.gender
  const bloodType: 'A' | 'B' | 'O' | 'AB' = profileData.bloodType
  const hasCar: boolean = profileData.hasCar

  // 직업 분리 ("일반/대기업직원" → jobCategory + jobTitle)
  const [jobCategoryKorean = '', jobTitle = ''] = profileData.occupation.split('/')

  // 거주지 분리 ("경기도 용인시 수지구" → city + district)
  // ⚠️ 공백이 없는 경우 (예: "제주특별자치도") 처리 필요
  const firstSpaceIndex = profileData.region.indexOf(' ')
  let residenceCity: string
  let residenceDistrict: string

  if (firstSpaceIndex === -1) {
    // 공백 없음: 전체를 city로, district는 빈 문자열
    residenceCity = profileData.region
    residenceDistrict = ''

    if (import.meta.env.DEV) {
      console.warn(`⚠️ 거주지에 공백 없음: "${profileData.region}" → city로 처리`)
    }
  } else {
    // 공백 있음: 첫 번째 공백 기준으로 분리
    residenceCity = profileData.region.substring(0, firstSpaceIndex)
    residenceDistrict = profileData.region.substring(firstSpaceIndex + 1)
  }

  // 🔍 디버깅: 거주지 split 결과
  if (import.meta.env.DEV) {
    console.log('🔍 거주지 분리 결과:', {
      원본: profileData.region,
      city: residenceCity,
      district: residenceDistrict
    })
  }

  // 🔍 디버깅: 거주지 매핑 확인
  if (import.meta.env.DEV && !CITY_MAP[residenceCity]) {
    console.warn(`⚠️ CITY_MAP에 없는 거주지: "${residenceCity}"`)
  }

  // 직장지역 분리 (거주지와 동일한 로직)
  const firstSpaceIndexWork = profileData.workRegion.indexOf(' ')
  let workCity: string
  let workDistrict: string

  if (firstSpaceIndexWork === -1) {
    // 공백 없음: 전체를 city로, district는 빈 문자열
    workCity = profileData.workRegion
    workDistrict = ''

    if (import.meta.env.DEV) {
      console.warn(`⚠️ 직장지역에 공백 없음: "${profileData.workRegion}" → city로 처리`)
    }
  } else {
    // 공백 있음: 첫 번째 공백 기준으로 분리
    workCity = profileData.workRegion.substring(0, firstSpaceIndexWork)
    workDistrict = profileData.workRegion.substring(firstSpaceIndexWork + 1)
  }

  // 🔍 디버깅: 직장지역 분리 결과
  if (import.meta.env.DEV) {
    console.log('🔍 직장지역 분리 결과:', {
      원본: profileData.workRegion,
      city: workCity,
      district: workDistrict
    })
  }

  // 🔍 디버깅: 직장지역 매핑 확인
  if (import.meta.env.DEV && !CITY_MAP[workCity]) {
    console.warn(`⚠️ CITY_MAP에 없는 직장지역: "${workCity}"`)
  }

  // 자기소개 로드
  const introduction = loadIntroDraft() || ''

  return {
    nickname: profileData.nickname,
    gender: gender,  // ✅ 타입 단언 제거
    birthday: profileData.birthDate,  // 이미 YYYY-MM-DD 형식
    jobCategory: JOB_CATEGORY_MAP[jobCategoryKorean] || jobCategoryKorean,
    jobTitle: jobTitle,
    company: profileData.company,
    school: profileData.school,
    residenceCity: CITY_MAP[residenceCity] || residenceCity,
    residenceDistrict: residenceDistrict,
    workCity: CITY_MAP[workCity] || workCity,
    workDistrict: workDistrict,
    height: profileData.height,
    bloodType: bloodType,  // ✅ 타입 단언 제거
    bodyType: BODY_TYPE_MAP[profileData.bodyType] || profileData.bodyType,
    personalities: profileData.personalities.map(p => PERSONALITY_MAP[p] || p),
    religion: RELIGION_MAP[profileData.religion] || profileData.religion,
    drinking: DRINKING_MAP[profileData.drinking] || profileData.drinking,
    smoking: SMOKING_MAP[profileData.smoking] || profileData.smoking,
    hasCar: hasCar,  // ✅ 타입 단언 제거
    introduction: introduction
  }
}

/**
 * 백엔드 프로필 응답 → 프론트엔드 폼 데이터 변환
 * 프로필 수정 시 기존 데이터 로드용
 */
export function convertToFrontendForm(
  backendData: UserProfileResponse
): ProfileFormData {
  // 역변환 맵 생성
  const CITY_REVERSE_MAP = Object.fromEntries(
    Object.entries(CITY_MAP).map(([k, v]) => [v, k])
  )
  const JOB_CATEGORY_REVERSE_MAP = Object.fromEntries(
    Object.entries(JOB_CATEGORY_MAP).map(([k, v]) => [v, k])
  )
  const BODY_TYPE_REVERSE_MAP = Object.fromEntries(
    Object.entries(BODY_TYPE_MAP).map(([k, v]) => [v, k])
  )
  const PERSONALITY_REVERSE_MAP = Object.fromEntries(
    Object.entries(PERSONALITY_MAP).map(([k, v]) => [v, k])
  )
  const RELIGION_REVERSE_MAP = Object.fromEntries(
    Object.entries(RELIGION_MAP).map(([k, v]) => [v, k])
  )
  const DRINKING_REVERSE_MAP = Object.fromEntries(
    Object.entries(DRINKING_MAP).map(([k, v]) => [v, k])
  )
  const SMOKING_REVERSE_MAP = Object.fromEntries(
    Object.entries(SMOKING_MAP).map(([k, v]) => [v, k])
  )

  // 직업 조합
  const jobCategoryKorean = JOB_CATEGORY_REVERSE_MAP[backendData.jobCategory] || backendData.jobCategory
  const occupation = `${jobCategoryKorean}/${backendData.jobTitle}`

  // 거주지 조합
  const residenceCityKorean = CITY_REVERSE_MAP[backendData.residenceCity] || backendData.residenceCity
  const region = `${residenceCityKorean} ${backendData.residenceDistrict}`

  // 직장지역 조합
  const workCityKorean = CITY_REVERSE_MAP[backendData.workCity] || backendData.workCity
  const workRegion = `${workCityKorean} ${backendData.workDistrict}`

  // 체형 변환
  const bodyType = BODY_TYPE_REVERSE_MAP[backendData.bodyType] || backendData.bodyType

  // 성격 변환
  const personalities = backendData.personalities.map(
    p => PERSONALITY_REVERSE_MAP[p] || p
  )

  // 종교 변환
  const religion = RELIGION_REVERSE_MAP[backendData.religion] || backendData.religion

  // 음주 변환
  const drinking = DRINKING_REVERSE_MAP[backendData.drinking] || backendData.drinking

  // 흡연 변환
  const smoking = SMOKING_REVERSE_MAP[backendData.smoking] || backendData.smoking

  // ✅ 백엔드에서 받은 데이터는 항상 유효한 ENUM 값이므로 타입 단언 허용
  // (REVERSE_MAP의 fallback은 만약의 경우를 대비한 것)
  return {
    nickname: backendData.nickname,
    gender: backendData.gender,
    birthDate: backendData.birthday,
    occupation: occupation,
    company: backendData.company,
    school: backendData.school,
    region: region,
    workRegion: workRegion,
    height: backendData.height,
    bloodType: backendData.bloodType,
    bodyType: bodyType as ProfileFormData['bodyType'],
    personalities: personalities as string[],
    religion: religion as ProfileFormData['religion'],
    drinking: drinking as ProfileFormData['drinking'],
    smoking: smoking as ProfileFormData['smoking'],
    hasCar: backendData.hasCar
  }
}
