import { NetworkAction, NetworkReducer, NetworkState, Pkg, PkgType, SendResponse } from './types'
import { PeerFactory } from './PeerFactory'
import Peer, { DataConnection } from 'peerjs'
import { NetworkStrategy } from './NetworkStrategies/NetworkStrategy'
import { StarHostStrategy } from './NetworkStrategies/StarHostStrategy'
import checksum from 'checksum'
import { AlreadyJoinedNetworkError } from './Errors'
import { StarMemberStrategy } from './NetworkStrategies/StarMemberStrategy'
import { DataStream } from './DataStream'
import { StateManager } from './StateManager'
import { noConcurrentStaging } from './NetworkStrategies/NoConcurrentStagingDecorator'

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

  /**
   * Join a network, give a peerFactory if you have different PeerJS configuration
   * @param networkName
   * @param peerFactory
   */
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

  /**
   * set up StarHostStrategy
   * @param name
   * @param peerFactory
   */
  public async initAsStarHost (name: string, peerFactory: PeerFactory): Promise<void> {
    this.networkStrategy = noConcurrentStaging(new StarHostStrategy(this, peerFactory))
    this.peer = await peerFactory.makeAndOpen(name)
    this.peer.on('connection', conn => {
      this.setUpConnection(conn)
      conn.on('open', () => {
        console.log('on new connect open send', this.getState())
        conn.send({ pkgType: PkgType.SET_STATE, data: this.getState() })
      })
    })
    this.networkName = name
  }

  /**
   * set up StarMemberStrategy
   * @param name
   * @param peerFactory
   */
  public async initAsStarMember (name: string, peerFactory: PeerFactory): Promise<void> {
    this.networkStrategy = noConcurrentStaging(new StarMemberStrategy(this, peerFactory))
    this.peer = await peerFactory.makeAndOpen()
    const conn = this.peer.connect(name)
    this.setUpConnection(conn)
    this.dataStream.registerConnection(conn)
    this.networkName = name
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
    await this.networkStrategy?.dispatch(action)
  }

  private setUpConnection (conn: DataConnection): void {
    conn.on('open', () => {
      this.dataStream.registerConnection(conn)
    })
    conn.on('close', () => {
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
    }
  }
}
