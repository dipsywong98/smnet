import { InitialStateFactory, NetworkAction, NetworkReducer, NetworkState, Pkg, PkgType, SendResponse } from './types'
import { PeerFactory } from './PeerFactory'
import Peer, { DataConnection } from 'peerjs'
import { NetworkStrategy } from './NetworkStrategy'
import { StarHostStrategy } from './StarHostStrategy'
import checksum from 'checksum'
import { AlreadyJoinedNetworkError } from './Errors'
import { StarMemberStrategy } from './StarMemberStrategy'
import { DataStream } from './DataStream'

export class Network<State extends NetworkState, Action extends NetworkAction> {
  private state: State
  private peer?: Peer
  private readonly initialStateFactory: InitialStateFactory<State>
  private readonly stateReducer: NetworkReducer<State, Action>
  private networkStrategy?: NetworkStrategy<State, Action>
  private networkName?: string
  private readonly dataStream = new DataStream()

  public getNetworkName (): string | undefined {
    return this.networkName
  }

  constructor (stateReducer: NetworkReducer<State, Action>, initialStateFactory: State | InitialStateFactory<State>) {
    if (typeof initialStateFactory !== 'function') {
      this.initialStateFactory = () => JSON.parse(JSON.stringify(initialStateFactory)) as State
    } else {
      this.initialStateFactory = initialStateFactory
    }
    this.state = this.initialStateFactory()
    this.stateReducer = stateReducer
  }

  public setState (state: State): void {
    this.state = state
  }

  public getState (): State {
    return this.state
  }

  public applyReducer (prevState: State, action: Action): State {
    return this.stateReducer(prevState, action)
  }

  public reduce (action: Action): void {
    this.state = this.stateReducer(this.state, action)
  }

  public async leave (): Promise<void> {
    if (this.peer !== undefined) {
      const promise = new Promise(resolve => this.peer?.on('close', resolve))
      this.peer.destroy()
      await promise
      this.peer = undefined
      this.state = this.initialStateFactory()
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
        conn.send({ pkgType: PkgType.SET_STATE, data: this.state })
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
          this.networkStrategy?.handleDispatch(this.state, data)
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
