/**
 * event-source-polyfill 타입 선언
 */
declare module 'event-source-polyfill' {
  export interface EventSourcePolyfillInit {
    withCredentials?: boolean
    heartbeatTimeout?: number
    headers?: Record<string, string>
  }

  export class EventSourcePolyfill extends EventTarget {
    constructor(url: string, options?: EventSourcePolyfillInit)

    readonly readyState: number
    readonly url: string
    readonly withCredentials: boolean

    onopen: ((event: Event) => void) | null
    onmessage: ((event: MessageEvent) => void) | null
    onerror: ((event: Event) => void) | null

    close(): void

    static readonly CONNECTING: 0
    static readonly OPEN: 1
    static readonly CLOSED: 2
  }

  export const EventSource: typeof EventSourcePolyfill
}
