import { NetworkAction, NetworkReducer, NetworkState, Pkg, PkgType, SendResponse } from './types'
import { PeerFactory } from './PeerFactory'
import Peer, { DataConnection } from 'peerjs'
import { NetworkStrategy } from './NetworkStrategies/NetworkStrategy'
import { StarHostStrategy } from './NetworkStrategies/StarHostStrategy'
import checksum from 'checksum'
import { AlreadyConnectingError, AlreadyJoinedNetworkError } from './Errors'
import { StarMemberStrategy } from './NetworkStrategies/StarMemberStrategy'
import { DataStream } from './DataStream'
import { StateManager } from './StateManager'
import { noConcurrentStaging } from './NetworkStrategies/NoConcurrentStagingDecorator'
import { logger } from './Logger'

/**
 * The main Network class, which holds
 * - a networkStrategy that handles behavior when in different kinds of network and position, e.g. the center point in StarNetwork vs other points in that
 * - a stateManager, which holds the data state of this network, you may supply you own version of stateManager such as observableStateManager
 * - a dataStream, which handle the data exchange between different points in the network
 * and it can
 * - join a network
 * - leave the joined network
 * - dispatch changes on the data state
 * - get the newest data state
 */
export class Network<State extends NetworkState, Action extends NetworkAction> {
  private peer?: Peer
  private readonly stateManager: StateManager<State>
  private readonly stateReducer: NetworkReducer<State, Action>
  private networkStrategy?: NetworkStrategy<State, Action>
  private networkName?: string
  private readonly dataStream = new DataStream()
  private _connecting = false
  private _dispatching = false

  constructor (stateReducer: NetworkReducer<State, Action>, initialStateOrManager: State | StateManager<State>) {
    if (initialStateOrManager instanceof StateManager) {
      this.stateManager = initialStateOrManager
    } else {
      this.stateManager = StateManager.make(initialStateOrManager)
    }
    this.stateReducer = stateReducer
  }

  public get myId (): string | undefined {
    return this.peer?.id
  }

  public get connected (): boolean {
    return this.networkName !== undefined
  }

  public get connecting (): boolean {
    return this._connecting
  }

  public get dispatching (): boolean {
    return this._dispatching
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

  public getHistory = (): State[] => {
    return this.stateManager.getHistory()
  }

  public get isAdmin (): boolean {
    return this.networkStrategy?.isAdmin ?? false
  }

  /**
   * reduce a given state which changing owns' state
   * @param prevState
   * @param action
   */
  public applyReducer (prevState: State, action: Action): State {
    return this.stateReducer(prevState, action)
  }

  /**
   * reduce owns' state
   * @param action
   */
  public reduce (action: Action): void {
    this.stateManager.set(this.stateReducer(this.stateManager.get(), action))
  }

  public kick = async (id: string): Promise<void> => {
    if (this.getNeighbor()?.includes(id) ?? false) {
      await this.send(id, PkgType.KICK, id)
    } else {
      await this.broadcast(PkgType.KICK, id)
    }
  }

  public async leave (): Promise<void> {
    if (this.peer !== undefined) {
      if (this.networkStrategy !== undefined) {
        this.networkStrategy.leaving = true
      }
      const promise = new Promise(resolve => this.peer?.on('close', resolve))
      this.peer.destroy()
      await promise
      this.peer = undefined
      this.networkName = undefined
      this.dataStream.reset()
      this.stateManager.reset()
    }
  }

  /**
   * Join a network, give a peerFactory if you have different PeerJS configuration
   * @param networkName
   * @param peerFactory
   */
  public async join (networkName: string, peerFactory?: PeerFactory): Promise<void> {
    if (this.peer !== undefined) {
      throw new AlreadyJoinedNetworkError()
    }
    if (this._connecting) {
      throw new AlreadyConnectingError()
    }
    this._connecting = true
    try {
      peerFactory = peerFactory ?? new PeerFactory()
      try {
        await this.initAsStarHost(networkName, peerFactory)
        this.stateManager.reset()
        this.setState({ ...this.getState(), networkName })
      } catch (e) {
        logger.info('cannot init as host, try to init as member')
        await this.initAsStarMember(networkName, peerFactory)
      }
      await this.dispatch({
        type: 'member-join'
      } as unknown as Action)
      this._connecting = false
    } catch (e) {
      this._connecting = false
      throw e
    }
  }

  /**
   * set up StarHostStrategy
   * @param name
   * @param peerFactory
   */
  public async initAsStarHost (name: string, peerFactory: PeerFactory): Promise<void> {
    logger.info('initing as host')
    const oldPeer = this.peer
    this.peer = await peerFactory.makeAndOpen(name)
    this.peer.on('connection', conn => {
      logger.info('received connection with', conn.peer)
      this.setUpConnection(conn)
    })
    this.networkName = name
    this.networkStrategy = noConcurrentStaging(new StarHostStrategy(this, peerFactory))
    oldPeer?.destroy()
    logger.info('inited as host')
  }

  /**
   * set up StarMemberStrategy
   * @param name
   * @param peerFactory
   */
  public async initAsStarMember (name: string, peerFactory: PeerFactory): Promise<void> {
    logger.info('initing as member')
    this.networkStrategy = noConcurrentStaging(new StarMemberStrategy(this, peerFactory))
    this.peer = await peerFactory.makeAndOpen()
    logger.info('opened peer')
    await this.reconnectToHost(name)
  }

  public async reconnectToHost (name: string): Promise<void> {
    if (this.peer === undefined) return
    const conn = this.peer.connect(name)
    this.setUpConnection(conn)
    await new Promise((resolve, reject) => {
      conn.on('open', () => {
        resolve()
      })
      conn.on('error', err => {
        reject(err)
      })
    })
    logger.info('opened connection with host')
    this.dataStream.registerConnection(conn)
    this.networkName = name
    logger.info('requesting state from host')
    const { data } = await this.dataStream.send<undefined, State>(name, PkgType.ASK_STATE, undefined)
    if (data !== undefined) {
      logger.info('updating the state got from host', data)
      this.setState(data)
    }
    logger.info('inited as member')
  }

  /**
   * Get the neighboring connections of this point
   */
  public getNeighbor (): string[] | undefined {
    if (this.peer === undefined) {
      return undefined
    }
    return Object.keys(this.dataStream.getConnections())
  }

  public async send<T, U = unknown> (id: string | DataConnection, pkgType: PkgType, data: T): Promise<SendResponse<U>> {
    return await this.dataStream.send(id, pkgType, data)
  }

  public async broadcast<T, U = unknown> (pkgType: PkgType, data: T): Promise<Array<SendResponse<U>>> {
    return await this.dataStream.broadcast(pkgType, data)
  }

  public async dispatch (action: Action): Promise<void> {
    try {
      this._dispatching = true
      action.peerId = action.peerId ?? this.myId
      if (this.myId !== undefined && this.myId !== null) {
        logger.info('dispatching action', action)
        await this.networkStrategy?.dispatch(action)
        logger.info('dispatched action', action)
      } else {
        logger.error('not connected')
      }
      this._dispatching = false
    } catch (e) {
      this._dispatching = false
      throw e
    }
  }

  private setUpConnection (conn: DataConnection): void {
    conn.on('open', () => {
      logger.info('opened connection with', conn.peer)
      this.dataStream.registerConnection(conn)
    })
    conn.on('close', () => {
      logger.info('closed connection with', conn.peer)
      this.dataStream.unregisterConnection(conn)
    })
    conn.on('data', (pkg: Pkg<State, Action>) => this.dataHandler(pkg, conn))
    this.networkStrategy?.setUpConnection(conn)
  }

  /**
   * handling different kinds of package
   *
   * @param pkg
   * @param conn
   * @private
   */
  private dataHandler (pkg: Pkg<State, Action>, conn: Peer.DataConnection): void {
    const { pid, pkgType, data } = pkg
    logger.debug('received pkg from', conn.peer, pkg)
    switch (pkgType) {
      case PkgType.DISPATCH:
        // ack with new state's checksum
        // nack with error message
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
        // promote need to provide checksum, only promote when checksum same as that of staging state
        this.networkStrategy?.handlePromote(data)
          .then(() => this.dataStream.sendACK(conn, pid, data))
          .catch((error: Error) => this.dataStream.sendNACK(conn, pid, error.message))
        break
      case PkgType.CANCEL:
        // cancel need to provide checksum, only cancel when checksum same as that of staging state
        this.networkStrategy?.handleCancel(data)
          .then(() => this.dataStream.sendACK(conn, pid, data))
          .catch((error: Error) => this.dataStream.sendNACK(conn, pid, error.message))
        break
      case PkgType.SET_STATE:
        // ignore whatever staging state, just set state and cancel the staging state
        this.setState(data)
        this.networkStrategy?.forceCancel()
        break
      case PkgType.ASK_STATE:
        this.dataStream.sendACK(conn, pid, this.state)
        break
      case PkgType.KICK:
        if (data === this.myId) {
          logger.info('you got kicked out of network')
          this.leave().catch(logger.error)
        } else {
          this.send(data, pkgType, data).catch(logger.error)
        }
    }
  }
}
