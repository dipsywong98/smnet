import { InitialStateFactory, NetworkAction } from './types'
import { PeerFactory } from './PeerFactory'
import Peer, { DataConnection } from 'peerjs'

class AlreadyJoinedNetworkError extends Error {
  message = 'already joined network'
  name = 'AlreadyJoinedNetworkError'
}

export class Network<T> {
  private state: T
  private peer?: Peer
  private readonly connections: { [id: string]: DataConnection } = {}
  private readonly initialStateFactory: InitialStateFactory

  protected constructor (initialStateFactory: InitialStateFactory) {
    this.state = initialStateFactory()
    this.initialStateFactory = initialStateFactory
  }

  public async leave (): Promise<void> {
    if (this.peer !== undefined) {
      const promise = new Promise(resolve => this.peer?.on('close', resolve))
      this.peer.destroy()
      await promise
      this.peer = undefined
      this.state = this.initialStateFactory()
    }
  }

  public async join (peerFactory: PeerFactory, networkName: string): Promise<void> {
    if (this.peer !== undefined) {
      throw new AlreadyJoinedNetworkError()
    }
    try {
      this.peer = await peerFactory.makeAndOpen(networkName)
    } catch (e) {
      //
    }
  }

  public async dispatch (action: NetworkAction): Promise<void> {
    //
  }
}
