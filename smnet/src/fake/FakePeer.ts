import Peer from 'peerjs'
import { FakeConn } from './FakeConn'
import { FakeMediaConnection } from './FakeMediaConnection'

export class FakePeer implements Peer {
  static allPeers: Record<string, FakePeer> = {}
  connections: FakeConn[] = []
  destroyed = false
  disconnected = false
  id = 'some id'
  prototype!: RTCIceServer

  constructor (id?: string, options?: unknown) {
    this.id = id ?? 'someId'
    if (this.id in FakePeer.allPeers) {
      throw new Error(`Peer '${this.id}' already exist`)
    }
    FakePeer.allPeers[this.id] = this
    window.setTimeout(() => {
      this.trigger('open', this.id)
    }, 1)
  }

  call (id: string, stream: MediaStream, options?: Peer.CallOption): Peer.MediaConnection {
    return new FakeMediaConnection()
  }

  connect (id: string, options?: Peer.PeerConnectOption): Peer.DataConnection {
    if (FakePeer.allPeers[id] === undefined) {
      throw new Error()
    }
    const peer: FakePeer = FakePeer.allPeers[id]
    const fakeConn = new FakeConn()
    const fakeConn2 = new FakeConn()
    this.connections.push(fakeConn)
    peer.connections.push(fakeConn2)
    fakeConn.peer = id
    fakeConn2.peer = this.id
    fakeConn.otherEnd = fakeConn2
    fakeConn2.otherEnd = fakeConn
    fakeConn.hostPeer = this
    fakeConn2.hostPeer = peer
    peer.trigger('connection', fakeConn2)
    return fakeConn
  }

  destroy (): void {
    this.destroyed = true
    this.connections.forEach(conn => {
      conn.close()
    })
    const { [this.id]: t, ...ap } = FakePeer.allPeers
    FakePeer.allPeers = ap
  }

  disconnect (): void {
    this.disconnected = true
    const { [this.id]: t, ...ap } = FakePeer.allPeers
    FakePeer.allPeers = ap
  }

  getConnection (peerId: string, connectionId: string): Peer.MediaConnection | Peer.DataConnection | null {
    return this.connections.find(({ peer }) => peer === peerId) ?? null
  }

  listAllPeers (callback: (peerIds: string[]) => void): void {
    throw new Error('not implemented')
  }

  off (event: string, fn: () => void, once?: boolean): void {
    throw new Error('not implemented')
  }

  public callbacks: Record<string | 'data' | 'open' | 'close' | 'error', Array<(d?: unknown) => void>> = {}

  on (event: string, cb: () => void): void
  on (event: 'open', cb: (id: string) => void): void
  on (event: 'connection', cb: (dataConnection: Peer.DataConnection) => void): void
  on (event: 'call', cb: (mediaConnection: Peer.MediaConnection) => void): void
  on (event: 'close', cb: () => void): void
  on (event: 'disconnected', cb: () => void): void
  on (event: 'error', cb: (err: unknown) => void): void
  on (event: string | 'open' | 'connection' | 'call' | 'close' | 'disconnected' | 'error', cb: (() => void) | ((id: string) => void) | ((dataConnection: Peer.DataConnection) => void) | ((mediaConnection: Peer.MediaConnection) => void) | ((err: unknown) => void)): void {
    if (!(event in this.callbacks)) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(cb as (d?: unknown) => void)
  }

  public trigger (event: string | 'data' | 'open' | 'close' | 'error' | 'connection' | 'disconnected', data: unknown): void {
    this.callbacks[event]?.forEach(cb => {
      cb(data)
    })
  }

  reconnect (): void {
    throw new Error('not implemented')
  }
}
