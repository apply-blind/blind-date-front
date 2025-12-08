import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { SelectModal } from '@/shared/components/ui/SelectModal'
import { ProgressIndicator } from '@/shared/components/feedback/ProgressIndicator'
import { loadProfileDraft, clearAllDrafts } from '@/shared/utils/sessionStorage'
import { convertToBackendRequest } from '../utils/enumMapper'
import { submitProfile, updateProfile, getMyProfile } from '../api/profileApi'
import { useAuth } from '@/features/auth'
import type { ProfileFormData, ImageUpdateMetadata } from '../types/profile.types'

// 백엔드가 허용하는 이미지 타입 (ImageContentType.java 기준)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (백엔드 설정과 일치)

interface PhotoState {
  file: File | null
  preview: string | null  // base64 또는 S3 URL
  existingImageUrl?: string  // 기존 이미지 S3 URL (서버에서 온 것)
  imagePublicId?: string  // 기존 이미지의 UUID (EXISTING 타입 전송 시 필요)
}

function PhotoUploadPage() {
  const navigate = useNavigate()
  const { refetch, user } = useAuth()

  const [photos, setPhotos] = useState<PhotoState[]>(
    Array(6).fill(null).map(() => ({ file: null, preview: null }))
  )
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)
  const hasLoadedImages = useRef(false)
  const fileReadersRef = useRef<(FileReader | null)[]>(Array(6).fill(null))
  // ✅ 2025 Best Practice: 초기 상태 저장 (변경 감지용)
  const initialPhotos = useRef<PhotoState[]>(
    Array(6).fill(null).map(() => ({ file: null, preview: null }))
  )

  // REJECTED/APPROVED 상태일 때 기존 이미지 로드
  useEffect(() => {
    const loadExistingImages = async () => {
      // 이미 로드했거나, REJECTED/APPROVED 상태가 아니면 스킵
      if (hasLoadedImages.current || (user?.status !== 'REJECTED' && user?.status !== 'APPROVED')) return

      hasLoadedImages.current = true

      try {
        const profileData = await getMyProfile()

        // ✅ 백엔드 응답: images (ImageInfo[])
        const images = profileData.images || []

        // displayOrder 순서대로 정렬
        const sortedImages = [...images].sort((a, b) => a.displayOrder - b.displayOrder)

        // PhotoState 배열 생성 (최대 6개)
        const loadedPhotos: PhotoState[] = Array(6)
          .fill(null)
          .map((_, index) => {
            const imageInfo = sortedImages[index]
            if (imageInfo) {
              return {
                file: null,
                preview: imageInfo.imageUrl,  // S3 URL을 preview로
                existingImageUrl: imageInfo.imageUrl,
                imagePublicId: imageInfo.imagePublicId  // UUID 저장
              }
            }
            return { file: null, preview: null }
          })

        setPhotos(loadedPhotos)
        // ✅ 초기 상태 저장 (Deep copy)
        initialPhotos.current = JSON.parse(JSON.stringify(loadedPhotos))

        if (import.meta.env.DEV) {
          console.log('✅ [기존 이미지 로드 완료]', {
            로드된_이미지_개수: images.length
          })
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('기존 이미지 로드 실패:', error)
        }
      }
    }

    loadExistingImages()
  }, [user?.status])

  // 페이지 로드 시 가이드 모달 자동 오픈
  useEffect(() => {
    setIsGuideModalOpen(true)
  }, [])

  // cleanup: 모든 진행 중인 FileReader 취소
  useEffect(() => {
    return () => {
      fileReadersRef.current.forEach(reader => {
        if (reader) {
          reader.abort()
        }
      })
    }
  }, [])

  const handlePhotoChange = (index: number, file: File | null) => {
    // 기존 FileReader 취소 (메모리 누수 방지)
    if (fileReadersRef.current[index]) {
      fileReadersRef.current[index]?.abort()
      fileReadersRef.current[index] = null
    }

    if (file) {
      const reader = new FileReader()
      fileReadersRef.current[index] = reader

      reader.onloadend = () => {
        // 취소되지 않았을 때만 상태 업데이트
        if (fileReadersRef.current[index] === reader) {
          const newPhotos = [...photos]
          newPhotos[index] = { file, preview: reader.result as string }
          setPhotos(newPhotos)
          fileReadersRef.current[index] = null
        }
      }

      reader.onerror = () => {
        if (import.meta.env.DEV) {
          console.error('파일 읽기 실패:', file.name)
        }
        fileReadersRef.current[index] = null
        alert('이미지를 불러오는데 실패했습니다.')
      }

      reader.readAsDataURL(file)
    } else {
      const newPhotos = [...photos]
      newPhotos[index] = { file: null, preview: null }
      setPhotos(newPhotos)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ 2025 Best Practice: 필수 슬롯 [0,1,2] 명시적 검증
    const requiredSlots = [0, 1, 2]
    const isRequiredSlotsFilled = requiredSlots.every(index =>
      photos[index]?.file !== null || photos[index]?.existingImageUrl
    )

    if (!isRequiredSlotsFilled) {
      const emptySlots = requiredSlots
        .filter(index => !photos[index]?.file && !photos[index]?.existingImageUrl)
        .map(index => index + 1)
      alert(`1,2,3번 필수 사진을 모두 등록해주세요. (현재 빈 슬롯: ${emptySlots.join(', ')}번)`)
      return
    }

    // ✅ 2025 Best Practice: 변경 감지 (새 업로드, 삭제, 교체 모두 감지)
    const hasChanges = photos.some((photo, index) => {
      // initialPhotos.current[index]가 undefined일 수 있음 (안전하게 처리)
      const initial = initialPhotos.current[index] ?? { file: null, preview: null, existingImageUrl: null }
      const isNewUpload = photo.file !== null
      const isDeleted = initial.existingImageUrl && !photo.existingImageUrl && !photo.file
      const isReplaced = initial.existingImageUrl && photo.file !== null
      return isNewUpload || isDeleted || isReplaced
    })

    // REJECTED/APPROVED 상태이고 변경사항이 없으면 경고
    if ((user?.status === 'REJECTED' || user?.status === 'APPROVED') && !hasChanges) {
      const confirm = window.confirm(
        '변경된 사진이 없습니다. 기존 사진을 그대로 유지하고 제출하시겠습니까?'
      )
      if (!confirm) return
    }

    try {
      // 1. sessionStorage에서 프로필 데이터 로드
      if (import.meta.env.DEV) {
        console.log('=== 프로필 제출 시작 ===')
      }

      const profileData = loadProfileDraft<ProfileFormData>()
      if (!profileData) {
        alert('프로필 데이터를 찾을 수 없습니다. 처음부터 다시 작성해주세요.')
        navigate('/profile/create')
        return
      }

      // 2. 프론트엔드 → 백엔드 형식으로 변환
      const backendRequest = convertToBackendRequest(profileData)

      // 3. 새 이미지만 수집
      const newImages = photos.filter(p => p.file !== null).map(p => p.file!)

      // 4. 이미지 메타데이터 생성 (displayOrder 유지를 위해 전체 배열, null 제외)
      const imageMetadata = photos
        .map((photo, index) => {
          if (photo.preview === null) {
            // 빈 슬롯 (사용자가 사진을 업로드하지 않음)
            return null
          }

          if (photo.file) {
            // 새로 업로드하는 이미지
            return {
              type: 'NEW' as const,
              displayOrder: index + 1,  // 1-based: 백엔드와 일치
              filename: photo.file.name,
              contentType: photo.file.type
            } as ImageUpdateMetadata
          } else if (photo.existingImageUrl && photo.imagePublicId) {
            // 기존 이미지 유지
            return {
              type: 'EXISTING' as const,
              imagePublicId: photo.imagePublicId,
              displayOrder: index + 1  // 1-based: 백엔드와 일치
            } as ImageUpdateMetadata
          }

          return null
        })
        .filter((item): item is ImageUpdateMetadata => item !== null) as ImageUpdateMetadata[]

      if (import.meta.env.DEV) {
        console.log('✅ [전송 데이터 준비 완료]', {
          새_이미지_개수: newImages.length,
          메타데이터_개수: imageMetadata.length,
          메타데이터_상세: imageMetadata.map(m => ({
            displayOrder: m.displayOrder,
            type: m.type,
            filename: 'filename' in m ? m.filename : undefined,
            imagePublicId: 'imagePublicId' in m ? m.imagePublicId : undefined
          }))
        })
      }

      // 5. API 호출 (상태에 따라 분기)
      // PROFILE_WRITING: 신규 등록 (모든 이미지 NEW)
      // REJECTED/APPROVED: 프로필 수정 (EXISTING + NEW)
      if (import.meta.env.DEV) {
        console.log('📤 [API 호출 시작] 사용자 상태:', user?.status)
      }

      if (user?.status === 'PROFILE_WRITING') {
        // 신규 프로필 등록 (모든 이미지 NEW)
        await submitProfile(backendRequest, newImages)
      } else {
        // 프로필 수정 (REJECTED 재제출 또는 APPROVED 수정)
        await updateProfile(backendRequest, newImages, imageMetadata)
      }

      if (import.meta.env.DEV) {
        console.log('✅ [API 호출 성공]')
      }

      // 6. 성공 시 모든 임시 데이터 삭제
      clearAllDrafts()

      // 7. 사용자 정보 갱신 (서버에서 상태가 UNDER_REVIEW로 변경됨)
      if (import.meta.env.DEV) {
        console.log('🔄 [사용자 정보 갱신 시작]')
      }
      await refetch()

      if (import.meta.env.DEV) {
        console.log('✅ [사용자 정보 갱신 완료]')
      }

      // 8. 심사 대기 페이지로 이동
      // ProtectedRoute가 자동으로 상태 확인 후 적절한 페이지로 리다이렉트
      if (import.meta.env.DEV) {
        console.log('🚀 [리다이렉트] /review-pending')
      }
      navigate('/review-pending')

      if (import.meta.env.DEV) {
        console.log('=== 프로필 제출 완료 ===')
      }

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ [프로필 제출 실패]', error)
      }

      if (axios.isAxiosError(error)) {
        if (import.meta.env.DEV) {
          console.error('📋 [에러 상세 정보]', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method
          })
        }

        // RFC 9457: detail 필드 사용
        const message = error.response?.data?.detail || error.message
        const errorPrefix = (user?.status === 'REJECTED' || user?.status === 'APPROVED') ? '프로필 수정 실패' : '회원가입 실패'
        alert(`${errorPrefix}: ${message}`)
      } else {
        if (import.meta.env.DEV) {
          console.error('📋 [일반 에러]', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          })
        }

        const errorMessage = (user?.status === 'REJECTED' || user?.status === 'APPROVED')
          ? '프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.'
          : '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
        alert(errorMessage)
      }
    }
  }

  const handleBack = () => {
    navigate('/profile/introduction')
  }

  const steps = [
    { label: '프로필 작성', completed: true },
    { label: '자기소개', completed: true },
    { label: '이미지 업로드', completed: false }
  ]

  const getPhotoLabel = (index: number) => {
    if (index === 0) return '대표'
    if (index === 1 || index === 2) return '필수'
    return null
  }

  // ✅ 2025 Best Practice: 필수 슬롯 [0,1,2] 검증
  const requiredSlots = [0, 1, 2]
  const isValid = requiredSlots.every(index =>
    photos[index]?.file !== null || photos[index]?.existingImageUrl
  )
  // 전체 업로드 개수 (UI 표시용)
  const uploadedCount = photos.filter(
    p => p.file !== null || p.existingImageUrl
  ).length

  return (
    <div
      className="min-h-screen-dynamic bg-gradient-to-b from-cream to-white flex items-center justify-center p-4 sm:p-6"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
    >
      <div className="w-full max-w-2xl">
        {/* 진행 단계 표시 */}
        <div className="mb-4 sm:mb-6 text-center">
          <ProgressIndicator steps={steps} currentStep={2} />
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 sm:space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">프로필 사진 등록</h1>
            <p className="text-sm sm:text-base text-gray-600 text-wrap-balance">매력적인 나의 모습을 보여주세요</p>
          </div>

          {/* 프로필 사진 업로드 */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-gray-800">프로필 사진 ({uploadedCount}/6)</h3>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(true)}
                className="text-xs sm:text-sm text-coral-pink hover:underline flex items-center gap-1 min-h-touch py-1"
              >
                <span>👉</span>
                <span className="hidden sm:inline">프로필 사진 </span>가이드 보기
              </button>
            </div>

            {/* 허용 형식 안내 */}
            <p className="text-xs sm:text-sm text-gray-600">
              📌 업로드 가능한 형식: JPG, PNG, GIF, WebP (최대 10MB)
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {photos.map((photo, index) => (
                <PhotoUploadBox
                  key={index}
                  photo={photo}
                  index={index}
                  orderNumber={index + 1}
                  label={getPhotoLabel(index)}
                  onChange={(file) => handlePhotoChange(index, file)}
                />
              ))}
            </div>

            {!isValid && (
              <p className="text-sm text-red-500 font-medium">
                ⚠️ 1,2,3번 필수 사진을 모두 등록해주세요
              </p>
            )}
          </div>

          {/* 이전/다음 버튼 */}
          <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 transition-all min-h-touch active:scale-95"
            >
              이전
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full transition-all min-h-touch active:scale-95 ${
                isValid
                  ? 'bg-honey-gold hover:bg-yellow-400 active:brightness-90 text-gray-900 shadow-lg hover:shadow-xl cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!isValid}
            >
              {user?.status === 'REJECTED' || user?.status === 'APPROVED' ? '프로필 수정 완료' : '회원가입 완료'}
            </button>
          </div>
        </form>

        {/* 프로필 사진 가이드 모달 */}
        <SelectModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
          title="프로필 사진 가이드"
          hideFooter={true}
        >
          <div className="space-y-4">
            {/* 가이드 내용 */}
            <div className="space-y-4">
              <div className="text-gray-800 space-y-4 word-break-keep-all">
                <p className="font-bold text-lg text-wrap-balance">
                  신뢰할 수 있는 블라인드 데이트가 되기 위한 프로필 사진 가이드
                </p>
                <p className="text-sm text-gray-700 text-wrap-pretty">
                  블라인드는 <span className="font-semibold">가벼운 만남으로 변질된 국내 데이팅 앱 시장</span>에서 <span className="font-semibold">신뢰할 수 있는 공간</span>을 만들고 싶습니다. 회원님들께서 매력을 자연스럽게 표현하실 수 있도록, <span className="font-semibold">가장 신뢰받고 안전한 데이팅 앱</span>이 되기 위해 프로필 사진 등록 가이드를 안내해드립니다.
                </p>
              </div>

              {/* 가이드 항목들 */}
              <div className="space-y-3">
                <GuideItem
                  title="필수 사진 3장을 올려주세요."
                  items={[
                    '회원님의 다양하고 매력있는 모습을 보여주세요.',
                    '다양한 모습을 보여주실 수 있도록 필수 사진은 최소 3장 이상 등록 부탁드립니다.'
                  ]}
                />

                <GuideItem
                  title="회원님의 얼굴이 명확히 보이는 사진을 등록해주세요!"
                  items={[
                    '마스크 착용 사진은 (턱스크, 전신 사진 포함) 피해주세요.',
                    '핸드폰으로 얼굴이 가려진 거울 샷 (얼굴의 전체, 반 포함)',
                    '패딩 혹은 목도리 등 전반적으로 하관이 많이 가려진 사진은 등록이 어렵습니다.',
                    '전신사진 중 얼굴이 구분이 안 가는 사진 (지나치게 멀리서 찍거나, 풍경 위주 사진)'
                  ]}
                />

                <GuideItem
                  title="자연스러운 회원님의 모습을 보여주세요!"
                  items={[
                    '과도한 보정이 들어간 사진이나 AI 생성 이미지는 등록이 어려울 수 있어요 🥲',
                    '화질이 낮은 사진도 피해주세요 ❌',
                    '너무 오래된 사진은 지양해 주세요. 현재 모습과 유사한 최근 모습을 보여주시면 더욱 좋습니다! 👍'
                  ]}
                />

                <GuideItem
                  title="다양한 각도의 사진을 올려주세요."
                  items={[
                    '비슷한 느낌의 사진만 올리면 등록이 어려울 수 있어요 🥲',
                    '전신사진(뒷모습 포함)과 취미 사진은 각각 1장만 가능해요.'
                  ]}
                />

                <GuideItem
                  title="친구와 함께 찍은 사진도 좋아요!"
                  items={['하지만 친구 얼굴은 꼭 모자이크 처리해 주세요.']}
                />

                <GuideItem
                  title="기타 규정을 참고해주세요!"
                  items={[
                    '중복된다고 판단되는 사진은 등록이 어려워요 ❌',
                    '상의 탈의 사진은 등록이 어려워요. ❌',
                    '타인에게 불쾌감을 줄 수 있는 사진은 임의로 삭제될 수 있어요. ⚠️'
                  ]}
                />
              </div>

              {/* 경고 문구 */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-bold text-wrap-pretty word-break-keep-all">
                  * 이외 담당자와 확인 시 프로필 사진 가이드에 위배되거나 불건전하다고 판단되는 사진은 예고 없이 삭제와 경고가 진행됩니다.
                </p>
              </div>
            </div>

            {/* 확인 버튼 */}
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(false)}
              className="w-full py-3 bg-coral-pink text-white font-semibold rounded-xl hover:bg-coral-pink/90 transition-all min-h-touch"
            >
              확인
            </button>
          </div>
        </SelectModal>
      </div>
    </div>
  )
}

// 가이드 항목 컴포넌트
interface GuideItemProps {
  title: string
  items: string[]
}

function GuideItem({ title, items }: GuideItemProps) {
  return (
    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 sm:p-4 space-y-2 word-break-keep-all">
      <div className="flex items-start gap-2">
        <span className="text-blue-600 font-bold mt-0.5 text-sm sm:text-base">ⓘ</span>
        <div className="flex-1">
          <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-2 text-wrap-balance">{title}</h4>
          <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5 flex-shrink-0">-</span>
                <span className="text-wrap-pretty">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// 사진 업로드 박스 컴포넌트
interface PhotoUploadBoxProps {
  photo: PhotoState
  index: number
  orderNumber: number
  label?: string | null
  onChange: (file: File | null) => void
}

function PhotoUploadBox({ photo, index, orderNumber, label, onChange }: PhotoUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Step 1: 파일 확장자 검증
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
      if (inputRef.current) inputRef.current.value = ''
      alert('지원하지 않는 파일 형식입니다.\n\n업로드 가능한 형식: JPG, PNG, GIF, WebP')
      return
    }

    // Step 2: MIME 타입 검증
    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      if (inputRef.current) inputRef.current.value = ''
      alert('지원하지 않는 이미지 형식입니다.\n\n업로드 가능한 형식: JPG, PNG, GIF, WebP')
      return
    }

    // Step 3: 파일 크기 제한 (10MB)
    if (file.size > MAX_FILE_SIZE) {
      if (inputRef.current) inputRef.current.value = ''
      alert('이미지 크기는 10MB 이하로 업로드해주세요.')
      return
    }

    onChange(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div
      onClick={handleClick}
      className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl hover:border-coral-pink active:border-coral-pink transition-all cursor-pointer overflow-hidden bg-gray-50"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {photo.preview ? (
        <>
          {/* ✅ 2025 Best Practice: object-cover + aspect-ratio로 비율 유지 */}
          <img
            src={photo.preview}
            alt={`사진 ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ aspectRatio: '1 / 1' }}
            loading="lazy"
            decoding="async"
          />
          {/* 순서 번호 (좌측 상단) - clamp()로 반응형 크기 */}
          <div
            className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-coral-pink text-white rounded-full flex items-center justify-center font-bold shadow-lg"
            style={{
              width: 'clamp(1.5rem, 4vw, 1.75rem)',
              height: 'clamp(1.5rem, 4vw, 1.75rem)',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
            }}
          >
            {orderNumber}
          </div>
          {/* 삭제 버튼 - 반응형 위치 */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1.5 sm:top-2 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 active:bg-black/80 transition-all"
            style={{
              left: 'clamp(2.25rem, 9vw, 2.75rem)',
              width: 'clamp(1.5rem, 4vw, 1.75rem)',
              height: 'clamp(1.5rem, 4vw, 1.75rem)',
              fontSize: 'clamp(1rem, 3vw, 1.25rem)'
            }}
            aria-label="사진 삭제"
          >
            ×
          </button>
          {/* 대표/필수 표시 (우측 상단) */}
          {label && (
            <div
              className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-coral-pink text-white font-bold rounded"
              style={{
                padding: 'clamp(0.125rem, 0.5vw, 0.25rem) clamp(0.375rem, 1.5vw, 0.5rem)',
                fontSize: 'clamp(0.625rem, 2vw, 0.75rem)'
              }}
            >
              {label}
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
          {/* 순서 번호 표시 */}
          <div
            className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold"
            style={{
              width: 'clamp(1.5rem, 4vw, 1.75rem)',
              height: 'clamp(1.5rem, 4vw, 1.75rem)',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
            }}
          >
            {orderNumber}
          </div>
          <span
            className="mb-1 sm:mb-2"
            style={{ fontSize: 'clamp(1.5rem, 5vw, 1.875rem)' }}
          >
            +
          </span>
          <span style={{ fontSize: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
            사진 추가
          </span>
          {label && (
            <span
              className="font-bold text-coral-pink mt-0.5 sm:mt-1"
              style={{ fontSize: 'clamp(0.625rem, 2vw, 0.75rem)' }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default PhotoUploadPage
