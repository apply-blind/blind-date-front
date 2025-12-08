import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SelectModal } from '@/shared/components/ui/SelectModal'
import { ProgressIndicator } from '@/shared/components/feedback/ProgressIndicator'
import { saveIntroDraft, loadIntroDraft } from '@/shared/utils/sessionStorage'

function IntroductionPage() {
  const navigate = useNavigate()

  // useState의 lazy initialization으로 sessionStorage에서 초기값 로드
  const [introduction, setIntroduction] = useState(() => {
    return loadIntroDraft() || ''
  })
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false)
  const [isExampleModalOpen, setIsExampleModalOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const MIN_LENGTH = 100
  const MAX_LENGTH = 1000

  const isValid = introduction.length >= MIN_LENGTH && introduction.length <= MAX_LENGTH

  // 페이지 로드 시 알림 모달 자동 오픈
  useEffect(() => {
    setIsNoticeModalOpen(true)
  }, [])

  // 모달 닫힐 때 textarea 포커스
  useEffect(() => {
    if (!isNoticeModalOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isNoticeModalOpen])

  // 자기소개가 변경될 때마다 sessionStorage에 저장
  useEffect(() => {
    if (introduction) {
      saveIntroDraft(introduction)
    }
  }, [introduction])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      alert(`자기소개는 최소 ${MIN_LENGTH}자 이상 입력해주세요.`)
      return
    }

    // 다음 페이지로 이동 (사진 업로드)
    navigate('/profile/photos')
  }

  const handleBack = () => {
    if (introduction.length > 0) {
      const confirm = window.confirm('작성 중인 내용이 있습니다. 이전 단계로 돌아가시겠습니까?')
      if (!confirm) return
    }
    navigate('/profile/create')
  }

  const getCharacterCountColor = () => {
    if (introduction.length < MIN_LENGTH) {
      return 'text-red-500'
    }
    if (introduction.length > MAX_LENGTH) {
      return 'text-red-500'
    }
    return 'text-coral-pink'
  }

  const steps = [
    { label: '프로필 작성', completed: true },
    { label: '자기소개', completed: false },
    { label: '이미지 업로드', completed: false }
  ]

  return (
    <div className="min-h-screen-dynamic bg-gradient-to-b from-cream to-white flex items-center justify-center p-4 sm:p-6 pt-safe pb-safe">
      <div className="w-full max-w-2xl">
        {/* 진행 단계 표시 */}
        <div className="mb-4 sm:mb-6 text-center">
          <ProgressIndicator steps={steps} currentStep={1} />
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 sm:space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">자기소개</h1>
            <p className="text-sm sm:text-base text-gray-600 text-wrap-balance">나를 표현할 수 있는 매력적인 자기소개를 작성해주세요</p>
          </div>

          {/* 자기소개 작성 팁 */}
          <div className="bg-gradient-to-r from-coral-pink/10 to-honey-gold/10 rounded-xl p-4 sm:p-5 space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
              <span className="text-coral-pink">✨</span>
              자기소개에 포함해보세요
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700 word-break-keep-all">
              <li className="flex items-start gap-2">
                <span className="text-coral-pink font-bold mt-0.5">✔</span>
                <span className="font-semibold text-wrap-balance">본인의 장점을 어필해보세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-coral-pink font-bold mt-0.5">✔</span>
                <span className="font-semibold text-wrap-balance">영화, 음식, 취미 등의 좋아하는 것들과 좋아하는 이유</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-coral-pink font-bold mt-0.5">✔</span>
                <span className="font-semibold text-wrap-balance">만나게 될 이성과 함께 해보고 싶은 것들</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-coral-pink font-bold mt-0.5">✔</span>
                <span className="font-semibold text-wrap-balance">인생의 가치관과 생활 신조</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setIsExampleModalOpen(true)}
              className="w-full mt-3 py-2.5 text-sm font-medium text-coral-pink border-2 border-coral-pink rounded-lg hover:bg-coral-pink hover:text-white transition-all min-h-touch"
            >
              자기소개 작성 예시 보기
            </button>
          </div>

          {/* 반려되는 자기소개 예시 */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 sm:p-5 space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
              <span className="text-gray-500">❌</span>
              반려되는 자기소개 예시
            </h3>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                "안녕하세요. 반갑습니다. 잘부탁드립니다.<br />
                서울 사는 32살 직장인입니다.<br />
                반갑습니다! 새로운 인연을 기대합니다!<br />
                외로워서 가입해 봤습니다."
              </p>
            </div>
            <p className="text-xs text-gray-500">
              💡 구체적이지 않고 성의 없는 자기소개는 반려됩니다
            </p>
          </div>

          {/* 경고 문구 */}
          <div className="bg-amber-50/50 border-2 border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold text-lg">⚠️</span>
              <span className="text-amber-900 font-medium text-sm text-wrap-pretty word-break-keep-all">불성실한 프로필 작성은 자칫 가볍게 보일 수 있습니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold text-lg">⚠️</span>
              <span className="text-amber-900 font-medium text-sm text-wrap-pretty word-break-keep-all">본인의 솔직 담백한 프로필 작성은 만남의 기회를 높여줍니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold text-lg">⚠️</span>
              <span className="text-amber-900 font-medium text-sm text-wrap-pretty word-break-keep-all">SNS 계정이나 연락처 입력 시 영구 정지됩니다.</span>
            </div>
          </div>

          {/* 자기소개 입력란 */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-bold text-gray-700">자기소개 작성</span>
              <textarea
                ref={textareaRef}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                className="mt-2 w-full px-3 sm:px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-pink focus:border-transparent outline-none resize-none transition-all text-base leading-relaxed"
                style={{ fontSize: '16px' }}
                placeholder="예) 안녕하세요! 주말에는 카페 투어와 베이킹을 즐기는 긍정적인 사람입니다. 운동도 좋아해서 요가와 필라테스를 배우고 있어요. 맛집 탐방과 여행을 좋아하고, 새로운 경험을 즐기는 편입니다. 함께 즐거운 시간을 보낼 수 있는 분을 만나고 싶어요!"
                rows={10}
                maxLength={MAX_LENGTH}
              />
            </label>

            {/* 글자 수 카운터 */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {introduction.length < MIN_LENGTH ? (
                  <span className="text-red-500 font-medium">
                    최소 {MIN_LENGTH}자 이상 입력해주세요 (현재 {MIN_LENGTH - introduction.length}자 부족)
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">
                    ✓ 작성 완료
                  </span>
                )}
              </div>
              <div className={`text-sm font-bold ${getCharacterCountColor()}`}>
                {introduction.length} / {MAX_LENGTH}자
              </div>
            </div>
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
              다음
            </button>
          </div>
        </form>

        {/* 자기소개 작성 예시 모달 */}
        <SelectModal
          isOpen={isExampleModalOpen}
          onClose={() => setIsExampleModalOpen(false)}
          title="자기소개 작성 예시"
          hideFooter={true}
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-coral-pink/10 to-honey-gold/10 rounded-xl p-6">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                나이는 86년생 5월생, 취미는 운동, 맛집 탐방이에요.
                찐 대동맛지도 가지고 있답니다.
                {'\n\n'}
                20년 넘게 축구 꾸준히 하고 있고 겨울엔 스노우보드, 요즘은 스쿠버 다이빙과 헬스에 빠져있어요. 스쿠버 다이빙은 강사 자격증까지 취득했고 헬스는 3대 400찍고 바디 프로필 촬영도 23년 12월에 했답니다!
                {'\n\n'}
                누가 봐도 잘생긴 외모는 아니지만 인상 좋다는 이야기 많이 듣고 만난 사람 중에 가장 동안이라는 소리를 자주 들을 수 있음에 부모님께 감사드립니다.
                {'\n\n'}
                피부 좋고 살사기, 프사기 일절 없으니 걱정 안 하셔도 됩니다. 만나는 분도 그랬으면 좋겠어요. 서로의 소중한 시간을 아껴요.
                {'\n\n'}
                성격은 밝고 긍정적이고 솔직하고 재미있습니다.
                만나서 심심하실 일은 없으실 거예요.
                {'\n\n'}
                동물 특히 강아지 매우 좋아합니다. 매달 유기견 봉사활동 꾸준히 가고 기부도 함께 하고 있어요.
                무엇보다 세상에서 가장 사랑스러운 댕댕이를 보호소에서 입양해서 행복한 시간 보내고 있답니다.
                {'\n\n'}
                대기업 그만두고 제가 좋아하는 일을 기쁜 마음으로 하고 있습니다. 사업한다 하면 오해하실 것 같아서 미리 말씀드리면 '적게 일하고 많이 벌자' 마인드로 자기 시간 아주 많습니다. 매일 반려견 1일 2산책 하고 있어요!
                {'\n\n'}
                냄새가 가장 적게 나는 전자담배를 피다 얼마 전부터 금연 시작했어요! 얼마 되진 않았지만 여전히 잘 끊혹 있습니다. 평생 끊어볼게요!
                {'\n\n'}
                가끔 싸우더라도 큰소리 내지 않고 사근사근 대화로 풀 수 있는 분 만나 함께 사계절 겪으며 설레면서도 편안한 연애하다 평생을 함께하고 싶습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExampleModalOpen(false)}
              className="w-full py-3 bg-coral-pink text-white font-semibold rounded-xl hover:bg-coral-pink/90 transition-all min-h-touch"
            >
              확인
            </button>
          </div>
        </SelectModal>

        {/* 알림 모달 */}
        <SelectModal
          isOpen={isNoticeModalOpen}
          onClose={() => setIsNoticeModalOpen(false)}
          title="알림"
          hideFooter={true}
        >
          <div className="space-y-4">
            {/* 알림 내용 */}
            <div className="bg-amber-50/30 border-2 border-amber-200 rounded-xl p-6 space-y-4">
              <div className="text-gray-800 space-y-3 word-break-keep-all">
                <p className="text-wrap-pretty">
                  Blind는 기혼자 가입 방지를 위해 다음 사항을 의무화하고 있습니다.
                </p>

                <div className="space-y-3 pl-4 border-l-4 border-amber-400">
                  <div className="space-y-1">
                    <p className="font-bold text-amber-900 text-wrap-balance">• 40세 이상 가입 희망자</p>
                    <p className="text-sm text-amber-800 ml-4 text-wrap-pretty">남녀 구분 없이 <span className="font-semibold">가족 관계 증명서 제출</span> 필수</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-amber-900 text-wrap-balance">• 돌싱 회원 (사실혼 포함)</p>
                    <p className="text-sm text-amber-800 ml-4 text-wrap-pretty">나이와 상관없이 자기소개에 의무적으로 명시</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-amber-900 text-wrap-balance">• 현역 군인 병사</p>
                    <p className="text-sm text-amber-800 ml-4 text-wrap-pretty">가입 불가 (장교, 부사관은 가능)</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-100 rounded-lg p-3 border border-amber-300">
                <p className="text-sm text-amber-900 font-bold text-center text-wrap-balance word-break-keep-all">
                  ⚠️ 미 작성 시 이용이 제한될 수 있습니다
                </p>
              </div>
            </div>

            {/* 확인 버튼 */}
            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(false)}
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

export default IntroductionPage
