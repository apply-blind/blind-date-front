/**
 * Mention Editor - Lexical 기반 댓글 에디터 (2025 Mobile Best Practice)
 *
 * 주요 기능:
 * - YouTube 스타일 원자적 멘션 블록
 * - 백스페이스 2번으로 전체 삭제
 * - 부분 편집 방지
 * - Auto-expand (최대 120px)
 * - iOS/Android 최적화
 */

import { useEffect } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $createTextNode, $createParagraphNode, EditorState, CLEAR_EDITOR_COMMAND, $getSelection, $isRangeSelection, $isElementNode, $isTextNode } from 'lexical'

import { MentionNode, $createMentionNode, $isMentionNode } from './MentionNode'

interface MentionEditorProps {
  placeholder?: string
  onTextChange: (text: string) => void
  disabled?: boolean
  initialMention?: {
    nickname: string
  } | null
  onClearMention?: () => void
}

function AutoFocusPlugin({ initialMention }: { initialMention?: { nickname: string } | null }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // 멘션이 있으면 즉시 삽입 및 포커스
    if (initialMention?.nickname) {
      editor.update(() => {
        const root = $getRoot()
        root.clear()

        // 새 Paragraph 노드 생성
        const paragraph = $createParagraphNode()

        // 멘션 노드 생성
        const mentionNode = $createMentionNode(initialMention.nickname)
        const spaceNode = $createTextNode(' ')

        paragraph.append(mentionNode)
        paragraph.append(spaceNode)

        root.append(paragraph)

        // 커서를 멘션 뒤로 이동
        spaceNode.select()
      })

      // 포커스 (스크롤 위치 유지 - 2025 UX Best Practice)
      requestAnimationFrame(() => {
        const scrollY = window.scrollY
        editor.focus()
        window.scrollTo(0, scrollY)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 초기 마운트 시에만 실행

  return null
}

function ClearEditorPlugin({ onClear }: { onClear: () => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      CLEAR_EDITOR_COMMAND,
      () => {
        onClear()
        return false
      },
      0
    )
  }, [editor, onClear])

  return null
}

function PreventAtSymbolPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot()
        const firstChild = root.getFirstChild()

        if (!firstChild || !$isElementNode(firstChild)) return

        const firstNode = firstChild.getFirstChild()

        // 멘션 노드가 아닌 일반 텍스트 노드이고, '@'로 시작하는 경우
        if (firstNode && $isTextNode(firstNode) && !$isMentionNode(firstNode)) {
          const text = firstNode.getTextContent()

          if (text.startsWith('@')) {
            editor.update(() => {
              const selection = $getSelection()

              if ($isRangeSelection(selection)) {
                // '@' 제거
                firstNode.setTextContent(text.slice(1))

                // 커서를 맨 앞으로 이동
                selection.anchor.set(firstNode.getKey(), 0, 'text')
                selection.focus.set(firstNode.getKey(), 0, 'text')
              }
            })
          }
        }
      })
    })
  }, [editor])

  return null
}

export default function MentionEditor({
  placeholder = '댓글을 입력하세요...',
  onTextChange,
  disabled = false,
  initialMention = null,
  onClearMention,
}: MentionEditorProps) {
  const initialConfig = {
    namespace: 'MentionEditor',
    theme: {
      // ✅ 2025 Vibrant Pill 스타일
      text: {
        base: 'text-base text-gray-900',
      },
      paragraph: 'mb-0',
    },
    nodes: [MentionNode],
    onError: (error: Error) => {
      if (import.meta.env.DEV) {
        console.error('[Lexical Error]', error)
      }
    },
    editable: !disabled,
  }

  function handleChange(editorState: EditorState) {
    editorState.read(() => {
      const root = $getRoot()
      const text = root.getTextContent()
      onTextChange(text)
    })
  }

  function handleClearMention() {
    onClearMention?.()
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative flex-1">
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-coral-pink/20 focus:bg-white transition-all overflow-y-auto"
              aria-label={placeholder}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          }
          placeholder={
            <div className="absolute top-3 left-4 text-gray-400 pointer-events-none select-none">
              {placeholder}
            </div>
          }
          ErrorBoundary={() => <div>Error</div>}
        />
        <HistoryPlugin /> {/* Ctrl+Z/Y 지원 */}
        <OnChangePlugin onChange={handleChange} />
        <AutoFocusPlugin initialMention={initialMention} />
        <ClearEditorPlugin onClear={handleClearMention} />
        <PreventAtSymbolPlugin /> {/* @ 입력 방지 */}
      </div>
    </LexicalComposer>
  )
}
