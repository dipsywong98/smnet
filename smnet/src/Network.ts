import { NetworkAction, NetworkReducer, NetworkState, Pkg, PkgType, SendResponse } from './types'
import { PeerFactory } from './PeerFactory'
import Peer, { DataConnection } from 'peerjs'
import { NetworkStrategy } from './NetworkStrategy'
import { StarHostStrategy } from './StarHostStrategy'
import checksum from 'checksum'
import { AlreadyJoinedNetworkError } from './Errors'
import { StarMemberStrategy } from './StarMemberStrategy'
import { DataStream } from './DataStream'
import { StateManager } from './StateManager'

export class Network<State extends NetworkState, Action extends NetworkAction> {
  private peer?: Peer
  private readonly stateManager: StateManager<State>
  private readonly stateReducer: NetworkReducer<State, Action>
  private networkStrategy?: NetworkStrategy<State, Action>
  private networkName?: string
  private readonly dataStream = new DataStream()

  constructor (stateReducer: NetworkReducer<State, Action>, initialStateOrManager: State | StateManager<State>) {
    if (initialStateOrManager instanceof StateManager) {
      this.stateManager = initialStateOrManager
    } else {
      this.stateManager = StateManager.make(initialStateOrManager)
    }
    this.stateReducer = stateReducer
  }

  public getNetworkName (): string | undefined {
    return this.networkName
  }

  public setState (state: State): void {
    this.stateManager.set(state)
  }

  public getState (): State {
    return this.stateManager.get()
  }

  public get state (): State {
    return this.getState()
  }

  public applyReducer (prevState: State, action: Action): State {
    return this.stateReducer(prevState, action)
  }

  public reduce (action: Action): void {
    this.stateManager.set(this.stateReducer(this.stateManager.get(), action))
  }

  public async leave (): Promise<void> {
    if (this.peer !== undefined) {
      const promise = new Promise(resolve => this.peer?.on('close', resolve))
      this.peer.destroy()
      await promise
      this.peer = undefined
      this.stateManager.reset()
      this.dataStream.reset()
      this.networkName = undefined
    }
  }

  public async join (networkName: string, peerFactory?: PeerFactory): Promise<void> {
    if (this.peer !== undefined) {
      throw new AlreadyJoinedNetworkError()
    }
    peerFactory = peerFactory ?? new PeerFactory()
    try {
      await this.initAsStarHost(networkName, peerFactory)
    } catch (e) {
      await this.initAsStarMember(networkName, peerFactory)
    }
  }

  public async initAsStarHost (name: string, peerFactory: PeerFactory): Promise<void> {
    this.networkStrategy = new StarHostStrategy(this, peerFactory)
    this.peer = await peerFactory.makeAndOpen(name)
    this.peer.on('connection', conn => {
      this.setUpConnection(conn)
      conn.on('open', () => {
        conn.send({ pkgType: PkgType.SET_STATE, data: this.getState() })
      })
    })
    this.networkName = name
  }

  public async initAsStarMember (name: string, peerFactory: PeerFactory): Promise<void> {
    this.networkStrategy = new StarMemberStrategy(this, peerFactory)
    this.peer = await peerFactory.makeAndOpen()
    const conn = this.peer.connect(name)
    this.setUpConnection(conn)
    this.dataStream.registerConnection(conn)
    this.networkName = name
  }

  public getNeighbor (): string[] | undefined {
    if (this.peer === undefined) {
      return undefined
    }
    return [this.peer.id, ...Object.keys(this.dataStream.getConnections())]
  }

  public async send<T, U = unknown> (id: string | DataConnection, pkgType: PkgType, data: T): Promise<SendResponse<U>> {
    return await this.dataStream.send(id, pkgType, data)
  }

  public async broadcast<T, U = unknown> (pkgType: PkgType, data: T): Promise<Array<SendResponse<U>>> {
    return await this.dataStream.broadcast(pkgType, data)
  }

  public async dispatch (action: Action): Promise<void> {
    await this.networkStrategy?.dispatch(action)
  }

  private setUpConnection (conn: DataConnection): void {
    conn.on('open', () => {
      this.dataStream.registerConnection(conn)
    })
    conn.on('close', () => {
      this.dataStream.unregisterConnection(conn)
    })
    conn.on('data', (rawData: Pkg<State, Action>) => {
      const { pid, pkgType, data } = rawData
      switch (pkgType) {
        case PkgType.DISPATCH:
          this.networkStrategy?.handleDispatch(this.getState(), data)
            .then(newState => {
              const cs: string = checksum(JSON.stringify(newState))
              this.dataStream.sendACK(conn, pid, cs)
            })
            .catch((error: Error) => {
              this.dataStream.sendNACK(conn, pid, error.message)
            })
          break
        case PkgType.ACK:
          this.dataStream.receiveACK(pid, data)
          break
        case PkgType.NACK:
          this.dataStream.receiveNACK(pid, data)
          break
        case PkgType.PROMOTE:
          this.networkStrategy?.handlePromote(data)
            .then(() => this.dataStream.sendACK(conn, pid, data))
            .catch((error: Error) => this.dataStream.sendNACK(conn, pid, error.message))
          break
        case PkgType.CANCEL:
          this.networkStrategy?.handleCancel(data)
            .then(() => this.dataStream.sendACK(conn, pid, data))
            .catch((error: Error) => this.dataStream.sendNACK(conn, pid, error.message))
          break
        case PkgType.SET_STATE:
          this.setState(data)
      }
    })
    this.networkStrategy?.setUpConnection(conn)
  }
}
