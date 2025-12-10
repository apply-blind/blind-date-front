import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getMyProfile, checkNicknameAvailability } from '../api/profileApi'
import { convertToFrontendForm } from '../utils/enumMapper'
import { RegionSelector } from '../components/RegionSelector'
import { OccupationSelector } from '../components/OccupationSelector'
import { PersonalitySelector } from '../components/PersonalitySelector'
import { HeightSelector } from '../components/HeightSelector'
import { SimpleSelector } from '../components/SimpleSelector'
import { BirthDateSelector } from '../components/BirthDateSelector'
import { SelectModal } from '@/shared/components/ui/SelectModal'
import { ProgressIndicator } from '@/shared/components/feedback/ProgressIndicator'
import { saveProfileDraft, loadProfileDraft, saveNicknameCheckStatus, loadNicknameCheckStatus, saveIntroDraft } from '@/shared/utils/sessionStorage'
import type { ProfileFormData } from '../types/profile.types'

function ProfileCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const hasLoadedProfile = useRef(false)

  // useState의 lazy initialization으로 sessionStorage에서 초기값 로드
  const [formData, setFormData] = useState<ProfileFormData>(() => {
    const savedData = loadProfileDraft<ProfileFormData>()
    return savedData || {
      nickname: '',
      gender: '',
      birthday: '',
      occupation: '',
      company: '',
      school: '',
      region: '',
      workRegion: '',
      height: 0,
      bloodType: '',
      bodyType: '',
      personalities: [],
      religion: '',
      drinking: '',
      smoking: '',
      hasCar: null
    }
  })

  // REJECTED 상태일 때 기존 프로필 데이터 로드
  useEffect(() => {
    const loadExistingProfile = async () => {
      // 이미 로드했거나, 로딩 중이면 스킵
      if (hasLoadedProfile.current || isLoadingProfile) return

      // REJECTED 상태가 아니면 스킵
      if (user?.status !== 'REJECTED') return

      // sessionStorage에 데이터가 있으면 원본 닉네임만 설정하고 API 호출 스킵
      const savedData = loadProfileDraft<ProfileFormData>()
      if (savedData && savedData.nickname) {
        setOriginalNickname(savedData.nickname)
        if (import.meta.env.DEV) {
          console.log('📂 sessionStorage에서 원본 닉네임 복원:', savedData.nickname)
        }
        return
      }

      // sessionStorage에 데이터가 없으면 API 호출
      hasLoadedProfile.current = true
      setIsLoadingProfile(true)

      try {
        const profileData = await getMyProfile()
        const frontendData = convertToFrontendForm(profileData)
        setFormData(frontendData)

        // 원본 닉네임 저장 (중복확인 자동 통과용)
        setOriginalNickname(frontendData.nickname)

        // 자기소개도 sessionStorage에 저장
        saveIntroDraft(profileData.introduction)

        if (import.meta.env.DEV) {
          console.log('✅ 기존 프로필 데이터 로드 완료')
          console.log('📝 원본 닉네임:', frontendData.nickname)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('프로필 데이터 로드 실패:', error)
        }
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadExistingProfile()
  }, [user?.status])

  // 닉네임 중복확인 상태
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [lastCheckedNickname, setLastCheckedNickname] = useState('')
  const [nicknameWarning, setNicknameWarning] = useState(false)

  // 프로필 수정 시 원본 닉네임 (중복확인 자동 통과용)
  const [originalNickname, setOriginalNickname] = useState<string>('')

  // 학교 모달 상태
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false)
  const [tempSchool, setTempSchool] = useState('')
  const schoolInputRef = useRef<HTMLInputElement>(null)

  // 직장 모달 상태
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [tempCompany, setTempCompany] = useState('')
  const companyInputRef = useRef<HTMLInputElement>(null)

  // 닉네임 input ref
  const nicknameInputRef = useRef<HTMLInputElement>(null)
  // 타이머 refs (메모리 누수 방지)
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null)
  const nicknameWarningTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 직장 모달 열릴 때 자동 포커스
  useEffect(() => {
    if (isCompanyModalOpen && companyInputRef.current) {
      focusTimerRef.current = setTimeout(() => companyInputRef.current?.focus(), 100)
      return () => {
        if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
      }
    }
  }, [isCompanyModalOpen])

  // 학교 모달 열릴 때 자동 포커스
  useEffect(() => {
    if (isSchoolModalOpen && schoolInputRef.current) {
      focusTimerRef.current = setTimeout(() => schoolInputRef.current?.focus(), 100)
      return () => {
        if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
      }
    }
  }, [isSchoolModalOpen])

  /**
   * 페이지 마운트 시 닉네임 중복확인 상태 복원 및 포커스
   *
   * ⚠️ Dependency Array 설명:
   * - 의도적으로 `formData.nickname`을 제외하여 마운트 시 1회만 실행
   * - 조건문 `savedCheckStatus.nickname === formData.nickname`로 안전성 보장
   * - formData.nickname이 변경되어도 재실행되지 않음 (의도된 동작)
   * - 닉네임 변경 시 중복확인 상태는 `handleNicknameChange`에서 초기화됨
   */
  useEffect(() => {
    // sessionStorage에서 닉네임 중복확인 상태 복원
    const savedCheckStatus = loadNicknameCheckStatus()
    if (savedCheckStatus && savedCheckStatus.nickname === formData.nickname) {
      setNicknameCheckStatus(savedCheckStatus.status)
      setLastCheckedNickname(savedCheckStatus.nickname)
    }

    if (nicknameInputRef.current) {
      focusTimerRef.current = setTimeout(() => nicknameInputRef.current?.focus(), 100)
    }

    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // 의도적으로 dependency 없음 (마운트 시 1회만 실행)

  // 프로필 수정 시 기존 닉네임이면 중복확인 자동 통과
  useEffect(() => {
    // 조건: 원본 닉네임이 있고, 현재 닉네임과 동일한 경우
    if (originalNickname && formData.nickname === originalNickname) {
      setNicknameCheckStatus('available')
      setLastCheckedNickname(originalNickname)

      if (import.meta.env.DEV) {
        console.log('✅ 기존 닉네임 중복확인 자동 통과:', originalNickname)
      }
    }
  }, [formData.nickname, originalNickname])

  // formData가 변경될 때마다 sessionStorage에 저장
  useEffect(() => {
    saveProfileDraft(formData)
  }, [formData])

  // cleanup: 모든 타이머 정리
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
      if (nicknameWarningTimerRef.current) clearTimeout(nicknameWarningTimerRef.current)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // 닉네임은 한글만 입력 가능 (입력 중에는 자음/모음 허용)
    if (name === 'nickname') {
      // 영문, 숫자, 특수문자 등 한글이 아닌 문자 확인
      const hasNonKorean = /[^ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value)

      if (hasNonKorean) {
        // 기존 타이머 정리 (메모리 누수 방지)
        if (nicknameWarningTimerRef.current) {
          clearTimeout(nicknameWarningTimerRef.current)
        }

        // 경고 표시
        setNicknameWarning(true)

        // 1.5초 후 경고 자동 해제
        nicknameWarningTimerRef.current = setTimeout(() => {
          setNicknameWarning(false)
          nicknameWarningTimerRef.current = null
        }, 1500)
      }

      // 한글(자음, 모음, 완성형 모두 포함) 허용 - 영문/숫자/특수문자만 제거
      const koreanOnly = value.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣]/g, '')
      setFormData(prev => ({ ...prev, [name]: koreanOnly }))

      // 닉네임이 변경되면 중복확인 상태 초기화
      setNicknameCheckStatus('idle')
      setLastCheckedNickname('')
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // 닉네임 입력 완료 시 자음/모음 제거
  const handleNicknameBlur = () => {
    // 완성된 한글만 남기고 자음/모음 제거
    const completedKoreanOnly = formData.nickname.replace(/[^가-힣]/g, '')
    if (completedKoreanOnly !== formData.nickname) {
      setFormData(prev => ({ ...prev, nickname: completedKoreanOnly }))
      // 자음/모음이 제거되었음을 알림
      if (formData.nickname.length > 0 && completedKoreanOnly.length === 0) {
        alert('완성된 한글만 입력 가능합니다')
      }
    }
  }

  // 직장 모달 열기
  const handleOpenCompanyModal = () => {
    setTempCompany(formData.company)
    setIsCompanyModalOpen(true)
  }

  // 직장 모달에서 확인 버튼 클릭
  const handleCompanyConfirm = () => {
    if (tempCompany.trim().length === 0) {
      alert('직장명을 최소 1자 이상 입력해주세요')
      return
    }
    if (!/^[가-힣]+$/.test(tempCompany)) {
      alert('직장은 띄어쓰기 없이 한글로만 입력해주세요')
      return
    }
    setFormData(prev => ({ ...prev, company: tempCompany }))
    setIsCompanyModalOpen(false)
  }

  // 직장 모달 닫기
  const handleCloseCompanyModal = () => {
    setIsCompanyModalOpen(false)
    setTempCompany('')
  }

  // 학교 모달 열기
  const handleOpenSchoolModal = () => {
    setTempSchool(formData.school)
    setIsSchoolModalOpen(true)
  }

  // 학교 모달에서 확인 버튼 클릭
  const handleSchoolConfirm = () => {
    if (tempSchool.trim().length === 0) {
      alert('학교명을 최소 1자 이상 입력해주세요')
      return
    }
    if (!/^[가-힣0-9]+$/.test(tempSchool)) {
      alert('학교명은 띄어쓰기 없이 한글과 숫자로만 입력해주세요')
      return
    }
    setFormData(prev => ({ ...prev, school: tempSchool }))
    setIsSchoolModalOpen(false)
  }

  // 학교 모달 닫기
  const handleCloseSchoolModal = () => {
    setIsSchoolModalOpen(false)
    setTempSchool('')
  }

  // 닉네임 중복확인 API 호출
  const handleCheckNickname = async () => {
    if (!formData.nickname.trim()) {
      alert('닉네임을 입력해주세요')
      return
    }

    // 자음/모음 자동 제거 후 사용자에게 표시
    const completedKoreanOnly = formData.nickname.replace(/[^가-힣]/g, '')

    if (completedKoreanOnly.length === 0) {
      alert('완성된 한글만 입력 가능합니다')
      setFormData(prev => ({ ...prev, nickname: '' }))
      return
    }

    // 자음/모음이 제거된 경우 업데이트
    if (completedKoreanOnly !== formData.nickname) {
      setFormData(prev => ({ ...prev, nickname: completedKoreanOnly }))
    }

    setNicknameCheckStatus('checking')
    setLastCheckedNickname(completedKoreanOnly)

    try {
      const response = await checkNicknameAvailability(completedKoreanOnly)

      if (response.available) {
        setNicknameCheckStatus('available')
        // sessionStorage에 중복확인 상태 저장
        saveNicknameCheckStatus(completedKoreanOnly, 'available')
        alert('✅ 사용 가능한 닉네임입니다.')
      } else {
        setNicknameCheckStatus('unavailable')
        // sessionStorage에 중복확인 상태 저장
        saveNicknameCheckStatus(completedKoreanOnly, 'unavailable')
        alert('❌ 이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.')
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('닉네임 중복확인 실패:', error)
      }
      alert('중복확인 중 오류가 발생했습니다. 다시 시도해주세요.')
      setNicknameCheckStatus('idle')
      setLastCheckedNickname('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 닉네임 중복확인 검증
    if (nicknameCheckStatus !== 'available') {
      alert('닉네임 중복확인을 완료해주세요')
      return
    }

    // 직장 한글 검증 (띄어쓰기 없이, 한글만)
    if (formData.company && !/^[가-힣]+$/.test(formData.company)) {
      alert('직장은 띄어쓰기 없이 한글로만 입력해주세요')
      return
    }

    // 성격 최소 1개 이상 선택 검증
    if (formData.personalities.length === 0) {
      alert('성격을 최소 1개 이상 선택해주세요')
      return
    }

    if (import.meta.env.DEV) {
      console.log('📝 프로필 데이터 저장:', formData)
      console.log('🏠 거주지:', formData.region)
      console.log('🏢 직장지역:', formData.workRegion)
    }

    // 프로필 데이터는 sessionStorage에 저장 (이미 자동 저장됨)
    // 최종 제출은 PhotoUploadPage에서 이미지와 함께 수행
    navigate('/profile/introduction')
  }

  // 폼 검증
  const isFormValid =
    formData.nickname &&
    nicknameCheckStatus === 'available' &&
    formData.gender &&
    formData.birthday &&
    formData.occupation &&
    formData.company &&
    formData.school &&
    formData.region &&
    formData.workRegion &&
    formData.height > 0 &&
    formData.bloodType &&
    formData.bodyType &&
    formData.personalities.length > 0 &&
    formData.religion &&
    formData.drinking &&
    formData.smoking &&
    formData.hasCar !== null

  const steps = [
    { label: '프로필 작성', completed: false },
    { label: '자기소개', completed: false },
    { label: '이미지 업로드', completed: false }
  ]

  return (
    <div className="min-h-screen-dynamic bg-cream py-4 sm:py-6 md:py-8 px-4 sm:px-6 pt-safe pb-safe">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-6 sm:mb-8">
          {/* 진행 단계 표시 */}
          <div className="mb-4 sm:mb-6">
            <ProgressIndicator steps={steps} currentStep={0} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-toast-peach via-jam-red to-honey-gold bg-clip-text text-transparent word-break-keep-all">
            프로필 만들기
          </h1>
          <p className="text-sm sm:text-base text-gray-600 word-break-keep-all">모든 정보를 입력해주세요</p>
        </div>

        {/* 프로필 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg space-y-4 sm:space-y-5">
          {/* 1. 닉네임 */}
          <div>
            <div
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all ${
                nicknameWarning
                  ? 'border-red-500 animate-pulse'
                  : nicknameCheckStatus === 'available'
                  ? 'border-gray-900'
                  : nicknameCheckStatus === 'unavailable'
                  ? 'border-red-500'
                  : 'border-gray-300 focus-within:ring-2 focus-within:ring-coral-pink focus-within:border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs sm:text-sm text-gray-500 font-bold">
                  닉네임
                </label>
                <span className="text-[10px] sm:text-xs text-gray-400">
                  {formData.nickname.length}/10
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <input
                  ref={nicknameInputRef}
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  onBlur={handleNicknameBlur}
                  maxLength={10}
                  className="flex-1 outline-none bg-transparent text-gray-900 text-base min-w-0"
                  placeholder="한글만 입력"
                  required
                />
                {nicknameCheckStatus === 'available' && (
                  <span className="text-green-600 text-xs sm:text-sm font-semibold flex-shrink-0">✓</span>
                )}
                <button
                  type="button"
                  onClick={handleCheckNickname}
                  disabled={
                    !formData.nickname.trim() ||
                    nicknameCheckStatus === 'checking' ||
                    (formData.nickname === lastCheckedNickname && nicknameCheckStatus !== 'idle')
                  }
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all min-h-[40px] sm:min-h-touch flex-shrink-0 ${
                    nicknameCheckStatus === 'checking'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : !formData.nickname.trim() || (formData.nickname === lastCheckedNickname && nicknameCheckStatus !== 'idle')
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : nicknameCheckStatus === 'available'
                      ? 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
                      : 'bg-coral-pink text-white hover:bg-coral-pink/90 active:brightness-90'
                  }`}
                >
                  {nicknameCheckStatus === 'checking' ? '확인중' : '중복확인'}
                </button>
              </div>
            </div>
            {nicknameWarning && (
              <p className="text-xs text-red-600 mt-1 ml-1 animate-pulse">⚠️ 한글만 입력 가능합니다</p>
            )}
            {!nicknameWarning && nicknameCheckStatus === 'available' && (
              <p className="text-xs text-green-600 mt-1 ml-1">✓ 사용 가능한 닉네임입니다</p>
            )}
            {!nicknameWarning && nicknameCheckStatus === 'unavailable' && (
              <p className="text-xs text-red-600 mt-1 ml-1">✕ 이미 사용 중인 닉네임입니다</p>
            )}
          </div>

          {/* 2. 성별 */}
          <div>
            <div className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all ${
              formData.gender ? 'border-gray-900' : 'border-gray-300'
            }`}>
              <span className="text-sm text-gray-500 font-bold block mb-2">성별</span>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    formData.gender === 'MALE'
                      ? 'border-gray-900 bg-gray-900'
                      : 'border-gray-300 bg-white group-hover:border-gray-400'
                  }`}>
                    {formData.gender === 'MALE' && (
                      <span className="text-white text-sm font-bold">✓</span>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={formData.gender === 'MALE'}
                    onChange={() => {
                      setFormData(prev => {
                        // 남성 전용 체형 옵션
                        const maleBodyTypes = ['마른', '슬림근육', '보통', '근육질', '통통', '우람']
                        // 현재 체형이 남성 옵션에 없으면 초기화
                        const newBodyType = maleBodyTypes.includes(prev.bodyType) ? prev.bodyType : ''
                        return { ...prev, gender: 'MALE', bodyType: newBodyType }
                      })
                    }}
                    className="sr-only"
                  />
                  <span className="text-gray-900 font-medium">남성</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    formData.gender === 'FEMALE'
                      ? 'border-gray-900 bg-gray-900'
                      : 'border-gray-300 bg-white group-hover:border-gray-400'
                  }`}>
                    {formData.gender === 'FEMALE' && (
                      <span className="text-white text-sm font-bold">✓</span>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={formData.gender === 'FEMALE'}
                    onChange={() => {
                      setFormData(prev => {
                        // 여성 전용 체형 옵션
                        const femaleBodyTypes = ['마른', '슬림', '보통', '다소 볼륨', '글래머', '통통']
                        // 현재 체형이 여성 옵션에 없으면 초기화
                        const newBodyType = femaleBodyTypes.includes(prev.bodyType) ? prev.bodyType : ''
                        return { ...prev, gender: 'FEMALE', bodyType: newBodyType }
                      })
                    }}
                    className="sr-only"
                  />
                  <span className="text-gray-900 font-medium">여성</span>
                </label>
              </div>
            </div>
          </div>

          {/* 3. 생일 */}
          <BirthDateSelector
            value={formData.birthday}
            onChange={(birthday) => setFormData(prev => ({ ...prev, birthday }))}
            required
          />

          {/* 4. 직업 */}
          <OccupationSelector
            value={formData.occupation}
            onChange={(occupation) => setFormData(prev => ({ ...prev, occupation }))}
            required
          />

          {/* 5. 직장 */}
          <button
            type="button"
            onClick={handleOpenCompanyModal}
            className={`w-full px-4 py-3.5 border-2 rounded-xl text-left transition-all font-medium ${
              formData.company
                ? 'border-gray-900 text-gray-900'
                : 'border-gray-300 text-gray-400 hover:border-gray-400'
            }`}
          >
            <span className="text-sm text-gray-500 font-bold block mb-0.5">직장</span>
            <span className={formData.company ? 'text-gray-900' : 'text-gray-400'}>
              {formData.company || '직장을 입력하세요.'}
            </span>
          </button>

          {/* 6. 학교 */}
          <button
            type="button"
            onClick={handleOpenSchoolModal}
            className={`w-full px-4 py-3.5 border-2 rounded-xl text-left transition-all font-medium ${
              formData.school
                ? 'border-gray-900 text-gray-900'
                : 'border-gray-300 text-gray-400 hover:border-gray-400'
            }`}
          >
            <span className="text-sm text-gray-500 font-bold block mb-0.5">학교</span>
            <span className={formData.school ? 'text-gray-900' : 'text-gray-400'}>
              {formData.school || '학교를 입력하세요.'}
            </span>
          </button>

          {/* 7. 거주지 */}
          <RegionSelector
            value={formData.region}
            onChange={(region) => {
              if (import.meta.env.DEV) {
                console.log('🏠 거주지 선택:', region)
              }
              setFormData(prev => ({ ...prev, region }))
            }}
            label="거주지"
            placeholder="거주지를 선택해주세요."
            required
          />

          {/* 8. 직장지역 */}
          <RegionSelector
            value={formData.workRegion}
            onChange={(workRegion) => {
              if (import.meta.env.DEV) {
                console.log('🏢 직장지역 선택:', workRegion)
              }
              setFormData(prev => ({ ...prev, workRegion }))
            }}
            label="직장지역"
            placeholder="직장 지역을 선택해주세요."
            required
          />

          {/* 9-10. 키 & 혈액형 (같은 행) */}
          <div className="grid grid-cols-2 gap-4">
            <HeightSelector
              value={formData.height}
              onChange={(height) => setFormData(prev => ({ ...prev, height }))}
              required
            />
            <SimpleSelector
              label="혈액형"
              value={formData.bloodType}
              options={[
                { value: 'A', label: 'A형' },
                { value: 'B', label: 'B형' },
                { value: 'O', label: 'O형' },
                { value: 'AB', label: 'AB형' }
              ]}
              onChange={(bloodType) => setFormData(prev => ({ ...prev, bloodType: bloodType as typeof formData.bloodType }))}
              placeholder="예) A형"
              required
            />
          </div>

          {/* 11-12. 체형 & 성격 (같은 행) */}
          <div className="grid grid-cols-2 gap-4">
            <SimpleSelector
              label="체형"
              value={formData.bodyType}
              options={
                formData.gender === 'FEMALE'
                  ? [
                      { value: '마른', label: '마른' },
                      { value: '슬림', label: '슬림' },
                      { value: '보통', label: '보통' },
                      { value: '다소 볼륨', label: '다소 볼륨' },
                      { value: '글래머', label: '글래머' },
                      { value: '통통', label: '통통' }
                    ]
                  : formData.gender === 'MALE'
                  ? [
                      { value: '마른', label: '마른' },
                      { value: '슬림근육', label: '슬림근육' },
                      { value: '보통', label: '보통' },
                      { value: '근육질', label: '근육질' },
                      { value: '통통', label: '통통' },
                      { value: '우람', label: '우람' }
                    ]
                  : []
              }
              onChange={(bodyType) => setFormData(prev => ({ ...prev, bodyType: bodyType as ProfileFormData['bodyType'] }))}
              placeholder={formData.gender ? '체형을 선택하세요' : '성별을 먼저 선택하세요'}
              required
            />
            <PersonalitySelector
              value={formData.personalities}
              onChange={(personalities) => setFormData(prev => ({ ...prev, personalities }))}
            />
          </div>

          {/* 13-14. 종교 & 음주여부 (같은 행) */}
          <div className="grid grid-cols-2 gap-4">
            <SimpleSelector
              label="종교"
              value={formData.religion}
              options={[
                { value: '무교', label: '무교' },
                { value: '기독교', label: '기독교' },
                { value: '불교', label: '불교' },
                { value: '천주교', label: '천주교' },
                { value: '원불교', label: '원불교' },
                { value: '기타', label: '기타' }
              ]}
              onChange={(religion) => setFormData(prev => ({ ...prev, religion: religion as ProfileFormData['religion'] }))}
              placeholder="예) 종교없음"
              required
            />
            <SimpleSelector
              label="음주여부"
              value={formData.drinking}
              options={[
                { value: '전혀 안 함', label: '전혀 안 함' },
                { value: '가끔', label: '가끔' },
                { value: '자주', label: '자주' }
              ]}
              onChange={(drinking) => setFormData(prev => ({ ...prev, drinking: drinking as ProfileFormData['drinking'] }))}
              placeholder="예) 가끔"
              required
            />
          </div>

          {/* 15-16. 흡연 & 자차여부 (같은 행) */}
          <div className="grid grid-cols-2 gap-4">
            <SimpleSelector
              label="흡연"
              value={formData.smoking}
              options={[
                { value: '비흡연', label: '비흡연' },
                { value: '가끔', label: '가끔' },
                { value: '흡연', label: '흡연' }
              ]}
              onChange={(smoking) => setFormData(prev => ({ ...prev, smoking: smoking as ProfileFormData['smoking'] }))}
              placeholder="예) 비흡연"
              required
            />
            <SimpleSelector
              label="자차여부"
              value={formData.hasCar === true ? '있음' : formData.hasCar === false ? '없음' : ''}
              options={[
                { value: '있음', label: '차량 있음' },
                { value: '없음', label: '차량 없음' }
              ]}
              onChange={(value) => setFormData(prev => ({ ...prev, hasCar: value === '있음' ? true : value === '없음' ? false : null }))}
              placeholder="예) 있음"
              required
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className={`w-full mt-6 sm:mt-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full transition-all min-h-touch word-break-keep-all ${
              isFormValid
                ? 'bg-honey-gold hover:bg-yellow-400 text-gray-900 shadow-lg hover:shadow-xl cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isFormValid}
          >
            다음
          </button>
        </form>

        {/* 직장 입력 모달 */}
        <SelectModal
          isOpen={isCompanyModalOpen}
          onClose={handleCloseCompanyModal}
          title="직장을 입력하세요"
          hideFooter={true}
        >
          <div className="space-y-3 sm:space-y-4">
            {/* 안내 문구 */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 word-break-keep-all">
                띄어쓰기 없이 한글로 입력하셔야 합니다.
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 word-break-keep-all">
                타인에게 공개되지 않으며 같은 직장과 매칭되지 않는 데이터로 사용됩니다.
              </p>
              <p className="text-xs text-gray-500 word-break-keep-all">
                Ex) 현대자동차, 엘지전자, 에스케이텔레콤
              </p>
            </div>

            {/* 입력란 */}
            <div>
              <input
                ref={companyInputRef}
                type="text"
                value={tempCompany}
                onChange={(e) => setTempCompany(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCompanyConfirm()
                  }
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-pink focus:border-transparent outline-none text-base"
                placeholder="직장명 입력"
                maxLength={250}
              />
              <p className="text-xs text-gray-500 mt-1 word-break-keep-all">
                {tempCompany.length} / 250 (최소 1자)
              </p>
            </div>

            {/* 취소/확인 버튼 */}
            <div className="flex gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleCloseCompanyModal}
                className="flex-1 py-2.5 sm:py-3 bg-gray-200 text-gray-700 font-semibold text-sm sm:text-base rounded-xl hover:bg-gray-300 transition-all min-h-touch word-break-keep-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCompanyConfirm}
                className="flex-1 py-2.5 sm:py-3 bg-coral-pink text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-coral-pink/90 transition-all min-h-touch word-break-keep-all"
              >
                확인
              </button>
            </div>
          </div>
        </SelectModal>

        {/* 학교 입력 모달 */}
        <SelectModal
          isOpen={isSchoolModalOpen}
          onClose={handleCloseSchoolModal}
          title="학교를 입력하세요"
          hideFooter={true}
        >
          <div className="space-y-3 sm:space-y-4">
            {/* 안내 문구 */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 word-break-keep-all">
                띄어쓰기 없이 한글로 입력하셔야 합니다.
              </p>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                <p className="flex items-start gap-1.5 sm:gap-2 word-break-keep-all">
                  <span className="text-coral-pink font-bold mt-0.5">•</span>
                  <span>대학교 공개를 원하지 않는 경우 서울4년제, 지방4년제, 전문대 등으로 작성 가능</span>
                </p>
                <p className="flex items-start gap-1.5 sm:gap-2 word-break-keep-all">
                  <span className="text-coral-pink font-bold mt-0.5">•</span>
                  <span>본캠이 아닌 경우 캠퍼스를 작성해 주시기 바랍니다.</span>
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2 sm:mt-3 word-break-keep-all">
                Ex) 서울대학교, 연세대학교, 이화여자대학교
              </p>
            </div>

            {/* 입력란 */}
            <div>
              <input
                ref={schoolInputRef}
                type="text"
                value={tempSchool}
                onChange={(e) => setTempSchool(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSchoolConfirm()
                  }
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-pink focus:border-transparent outline-none text-base"
                placeholder="학교명 입력"
                maxLength={250}
              />
              <p className="text-xs text-gray-500 mt-1 word-break-keep-all">
                {tempSchool.length} / 250 (최소 1자)
              </p>
            </div>

            {/* 취소/확인 버튼 */}
            <div className="flex gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleCloseSchoolModal}
                className="flex-1 py-2.5 sm:py-3 bg-gray-200 text-gray-700 font-semibold text-sm sm:text-base rounded-xl hover:bg-gray-300 transition-all min-h-touch word-break-keep-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSchoolConfirm}
                className="flex-1 py-2.5 sm:py-3 bg-coral-pink text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-coral-pink/90 transition-all min-h-touch word-break-keep-all"
              >
                확인
              </button>
            </div>
          </div>
        </SelectModal>
      </div>
    </div>
  )
}

export default ProfileCreatePage
