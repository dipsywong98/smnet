import { DataConnection } from 'peerjs'
import { FakePeer } from './FakePeer'

export class FakeConn implements DataConnection {
  static allConns: {[id: string]: DataConnection} = {}
  bufferSize!: number
  dataChannel!: RTCDataChannel
  label = 'my label'
  metadata: unknown
  open = false
  peer = 'peer'
  peerConnection!: RTCPeerConnection
  reliable = true
  serialization = 'binary'
  type = 'data'
  otherEnd?: FakeConn
  hostPeer?: FakePeer

  constructor (peerId?: string) {
    this.peer = peerId ?? 'someId'
    FakeConn.allConns[this.peer] = this
    window.setTimeout(() => {
      this.open = true
      this.trigger('open')
    }, 1)
  }

  parse (): void {
    throw new Error('not implemented')
  }

  stringify (_data: Record<string, unknown> | number | string | unknown[]): string {
    throw new Error('not implemented')
  }

  close (): void {
    if (this.open) {
      this.open = false
      if (this.hostPeer !== undefined) {
        this.hostPeer.connections = this.hostPeer?.connections.filter(conn => conn !== this)
      }
      if (this.otherEnd !== undefined) {
        this.otherEnd.open = false
        if (this.otherEnd.hostPeer !== undefined) {
          this.otherEnd.hostPeer.connections = this.otherEnd.hostPeer?.connections.filter(conn => conn !== this.otherEnd)
        }
      }
      window.setTimeout(() => {
        this.otherEnd?.trigger('close')
        this.trigger('close')
      }, 1)
    }
  }

  off (event: string, fn: () => void, once?: boolean): void {
    throw new Error('not implemented')
  }

  public callbacks: Record<string | 'data' | 'open' | 'close' | 'error', Array<(d?: unknown) => void>> = {}

  public on (event: string, cb: () => void): void
  public on (event: 'data', cb: (data: unknown) => void): void
  public on (event: 'open', cb: () => void): void
  public on (event: 'close', cb: () => void): void
  public on (event: 'error', cb: (err: unknown) => void): void
  public on (event: string | 'data' | 'open' | 'close' | 'error', cb: (() => void) | ((data: unknown) => void)): void {
    if (!(event in this.callbacks)) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(cb)
  }

  public trigger (event: string | 'data' | 'open' | 'close' | 'error', data?: unknown): void {
    this.callbacks[event]?.forEach(cb => {
      cb(data)
    })
  }

  public sent: unknown[] = []

  send (data: unknown): void {
    if (!this.open) {
      throw new Error('Send data before opening')
    }
    this.sent.push(data)
    // eslint-disable-next-line no-void
    void Promise.resolve(
      this.otherEnd?.trigger('data', data)
    )
  }
}
