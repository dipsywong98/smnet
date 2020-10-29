import Peer, { MediaConnection } from 'peerjs'

export class FakeMediaConnection implements MediaConnection {
  bufferSize: unknown
  dataChannel: unknown
  label = 'my label'
  metadata: unknown
  open = true
  peer = 'peer'
  peerConnection!: RTCPeerConnection
  reliable = true
  serialization = 'binary'
  type = 'data'

  parse (): void {
    throw new Error('not implemented')
  }

  stringify (data: Record<string, unknown> | string | number | unknown[]): string {
    return ''
  }

  close (): void {
    this.open = false
  }

  off (event: string, fn: () => void, once?: boolean): void {
    this.callbacks[event] = this.callbacks[event].filter(f => f !== fn)
  }

  public callbacks: Record<string | 'data' | 'open' | 'close' | 'error', Array<(d?: unknown) => void>> = {}

  // on (event: string, cb: () => void): void
  // on (event: 'data', cb: (data: any) => void): void
  // on (event: 'open', cb: () => void): void
  // on (event: 'close', cb: () => void): void
  // on (event: 'error', cb: (err: any) => void): void
  // on (event: string | 'data' | 'open' | 'close' | 'error', cb: (() => void) | ((data: any) => void)): void {
  //   if (!(event in this.callbacks)) {
  //     this.callbacks[event] = []
  //   }
  //   this.callbacks[event].push(cb)
  // }

  public trigger (event: string | 'data' | 'open' | 'close' | 'error', data: unknown | undefined): void {
    this.callbacks[event]?.forEach(cb => cb(data))
  }

  public sent: unknown[] = []

  send (data: unknown): void {
    this.sent.push(data)
  }

  answer (stream?: MediaStream, options?: Peer.AnswerOption): void {
    throw new Error('not implemented')
  }

  on (event: string, cb: () => void): void
  on (event: 'stream', cb: (stream: MediaStream) => void): void
  on (event: 'close', cb: () => void): void
  on (event: 'error', cb: (err: unknown) => void): void
  on (event: string | 'stream' | 'close' | 'error', cb: (() => void) | ((stream: MediaStream) => void) | ((err: unknown) => void)): void {
    if (!(event in this.callbacks)) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(cb as (d: unknown) => void)
  }
}
