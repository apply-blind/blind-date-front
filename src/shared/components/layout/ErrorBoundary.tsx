import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  onReset?: () => void  // ⭐ 외부에서 리셋 동작 제어 (React Router navigate 사용)
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * 에러 바운더리 컴포넌트
 * React 컴포넌트 트리 내에서 발생하는 JavaScript 에러를 캐치하고 폴백 UI를 표시합니다.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    })

    // ⭐ 외부에서 onReset을 제공하면 사용 (React Router navigate)
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      // fallback: 제공되지 않으면 window.location 사용
      window.location.href = '/'
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-cream">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">문제가 발생했습니다</h2>
            <p className="text-gray-600 mb-6">
              예상치 못한 오류가 발생했습니다.<br />
              잠시 후 다시 시도해주세요.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs font-mono text-red-800 break-all">
                  {String(this.state.error.message || this.state.error)}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="btn-primary w-full"
            >
              처음으로 돌아가기
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
