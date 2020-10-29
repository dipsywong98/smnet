import {
  InitialStateFactory,
  NetworkAction,
  NetworkReducer,
  NetworkState,
  Pkg,
  PkgType,
  PromiseHandler,
  SendResponse
} from './types'
import { PeerFactory } from './PeerFactory'
import Peer, { DataConnection } from 'peerjs'
import { v4 } from 'uuid'
import { NetworkStrategy } from './NetworkStrategy'
import { StarHostStrategy } from './StarHostStrategy'
import checksum from 'checksum'
import { AlreadyJoinedNetworkError, NotConnectedToPeerError } from './Errors'
import { StarMemberStrategy } from './StarMemberStrategy'

export class Network<State extends NetworkState, Action extends NetworkAction> {
  private state: State
  private peer?: Peer
  private connections: { [id: string]: DataConnection } = {}
  private readonly initialStateFactory: InitialStateFactory<State>
  private sentPromises: { [id: string]: PromiseHandler } = {}
  private readonly stateReducer: NetworkReducer<State, Action>
  private networkStrategy: NetworkStrategy<State, Action> = new StarHostStrategy(this)

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
      this.connections = {}
    }
  }

  public async join (name: string, peerFactory?: PeerFactory): Promise<void> {
    if (this.peer !== undefined) {
      throw new AlreadyJoinedNetworkError()
    }
    peerFactory = peerFactory ?? new PeerFactory()
    try {
      this.networkStrategy = new StarHostStrategy(this)
      this.peer = await peerFactory.makeAndOpen(name)
      this.peer.on('connection', conn => {
        this.setUpConnection(conn)
        conn.on('open', () => {
          conn.send({ pkgType: PkgType.SET_STATE, data: this.state })
        })
      })
    } catch (e) {
      this.networkStrategy = new StarMemberStrategy(this)
      this.peer = await peerFactory.makeAndOpen()
      const conn = this.peer.connect(name)
      this.setUpConnection(conn)
      this.connections[conn.peer] = conn
    }
  }

  public getNeighbor (): string[] | undefined {
    if (this.peer === undefined) {
      return undefined
    }
    return [this.peer.id, ...Object.keys(this.connections)]
  }

  public async send<T, U = unknown> (id: string | DataConnection, pkgType: PkgType, data: T): Promise<SendResponse<U>> {
    const conn = typeof id === 'string' ? this.connections[id] : id
    if (conn !== undefined) {
      return await new Promise((resolve) => {
        const pid = v4()
        this.sentPromises[pid] = {
          resolve: (data: never) => resolve({ conn, data }),
          reject: (error: string) => resolve({ conn, error })
        }
        conn.send({ pid, pkgType, data })
      })
    }
    return Promise.reject(new NotConnectedToPeerError(conn))
  }

  public async broadcast<T, U = unknown> (pkgType: PkgType, data: T): Promise<Array<SendResponse<U>>> {
    const promises = Object.keys(this.connections).map(async id => await this.send<T, U>(id, pkgType, data))
    return await Promise.all(promises)
  }

  private setUpConnection (conn: DataConnection): void {
    conn.on('open', () => {
      this.connections[conn.peer] = conn
    })
    conn.on('close', () => {
      const { [conn.peer]: a, ...rest } = this.connections
      this.connections = rest
    })
    conn.on('data', (rawData: Pkg<State, Action>) => {
      const { pid, pkgType, data } = rawData
      switch (pkgType) {
        case PkgType.DISPATCH:
          this.networkStrategy.handleDispatch(this.state, data).then(newState => {
            const cs: string = checksum(JSON.stringify(newState))
            conn.send({ pkgType: PkgType.ACK, pid, data: cs })
          }).catch((error: Error) => {
            conn.send({ pkgType: PkgType.NACK, pid, data: error.message })
          })
          break
        case PkgType.ACK:
          if (pid !== undefined && pid in this.sentPromises) {
            const { resolve } = this.sentPromises[pid]
            resolve(data)
            this.removeSentPromise(pid)
          }
          break
        case PkgType.NACK:
          if (pid !== undefined && pid in this.sentPromises) {
            const { reject } = this.sentPromises[pid]
            reject(data)
            this.removeSentPromise(pid)
          }
          break
        case PkgType.PROMOTE:
          this.networkStrategy.handlePromote(data)
            .then(() => conn.send({ pkgType: PkgType.ACK, pid, data }))
            .catch((error: Error) => conn.send({ pkgType: PkgType.NACK, pid, data: error.message }))
          break
        case PkgType.CANCEL:
          this.networkStrategy.handleCancel(data)
            .then(() => conn.send({ pkgType: PkgType.ACK, pid, data }))
            .catch((error: Error) => conn.send({ pkgType: PkgType.NACK, pid, data: error.message }))
          break
        case PkgType.SET_STATE:
          this.setState(data)
      }
    })
    this.networkStrategy.setUpConnection(conn)
  }

  private removeSentPromise (pid: string): void {
    const { [pid]: p, ...rest } = this.sentPromises
    this.sentPromises = rest
  }

  public async dispatch (action: Action): Promise<void> {
    await this.networkStrategy.dispatch(action)
  }
}
