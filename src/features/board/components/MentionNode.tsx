/**
 * Lexical MentionNode - 원자적 멘션 블록
 *
 * YouTube 스타일 UX:
 * - 1번 백스페이스: 멘션 블록 선택 (파란색 강조)
 * - 2번 백스페이스: 전체 삭제
 * - 부분 편집 불가 (@사랑스러운 사스케 → @사랑스러운 사스 방지)
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread
} from 'lexical'
import { $applyNodeReplacement, TextNode } from 'lexical'

export type SerializedMentionNode = Spread<
  {
    nickname: string
    type: 'mention'
    version: 1
  },
  SerializedTextNode
>

export class MentionNode extends TextNode {
  __nickname: string

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__nickname, node.__text, node.__key)
  }

  constructor(nickname: string, text?: string, key?: NodeKey) {
    // ✅ Discord 스타일 Delimiter 사용 (DB 가독성 향상)
    super(text ?? `<@${nickname}>`, key)
    this.__nickname = nickname
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config)
    dom.className = 'mention'
    // ✅ 원자적 블록: 부분 편집 불가
    dom.setAttribute('data-lexical-mention', 'true')
    dom.setAttribute('data-nickname', this.__nickname)
    return dom
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.setAttribute('data-lexical-mention', 'true')
    element.setAttribute('data-nickname', this.__nickname)
    element.textContent = this.__text
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mention')) {
          return null
        }
        return {
          conversion: convertMentionElement,
          priority: 1,
        }
      },
    }
  }

  // ✅ 백스페이스 2번 삭제 동작 활성화
  isTextEntity(): boolean {
    return true
  }

  // ✅ 선택 가능 (1번 백스페이스 시 전체 선택)
  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }

  // 스크린 리더 지원
  isToken(): boolean {
    return true
  }

  getNickname(): string {
    return this.__nickname
  }

  // ✅ Discord 스타일 Delimiter - 멘션과 내용 구분용 (명시적)
  getTextContent(): string {
    return `<@${this.__nickname}> `  // 일반 공백 추가
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const node = $createMentionNode(serializedNode.nickname)
    node.setTextContent(serializedNode.text)
    node.setFormat(serializedNode.format)
    node.setDetail(serializedNode.detail)
    node.setMode(serializedNode.mode)
    node.setStyle(serializedNode.style)
    return node
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      nickname: this.__nickname,
      type: 'mention',
      version: 1,
    }
  }
}

function convertMentionElement(domNode: HTMLElement): DOMConversionOutput | null {
  const nickname = domNode.getAttribute('data-nickname')
  if (nickname !== null) {
    const node = $createMentionNode(nickname)
    return {
      node,
    }
  }
  return null
}

export function $createMentionNode(nickname: string): MentionNode {
  const mentionNode = new MentionNode(nickname)
  // ✅ token 모드: 공백이 있어도 하나의 블록으로 처리
  mentionNode.setMode('token').toggleDirectionless()
  return $applyNodeReplacement(mentionNode)
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return node instanceof MentionNode
}
