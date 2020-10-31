import { NetworkStrategy } from './NetworkStrategy'
import { Network } from './Network'
import { NetworkAction, NetworkState } from './types'
import Peer from 'peerjs'
import checksum from 'checksum'
import { NetworkBusyError, NoStagingStateError } from './Errors'
import { PeerFactory } from './PeerFactory'

/**
 * AbstractNetworkStrategies is the base class of all other NetworkStrategies, it
 * hold the stagingState, which is an intermediate state computed when a point dispatch,
 *    but hasn't verified by other points,
 *    after getting verified we promote this stagingState to live state that is used by the application,
 *    NetworkStrategies can implement different logics to handle this
 * It always reject dispatch when there is statingState because even if we queue the dispatches in a buffer,
 *    the users may not be aware of what would be the new state before sending this request,
 *    the drawback is the user need to send their request manually later
 */
export abstract class AbstractNetworkStrategy<State extends NetworkState, Action extends NetworkAction> implements NetworkStrategy<State, Action> {
  network: Network<State, Action>
  protected stagingState?: State
  protected peerFactory: PeerFactory

  constructor (network: Network<State, Action>, peerFactory: PeerFactory) {
    this.network = network
    this.peerFactory = peerFactory
  }

  public async dispatch (action: Action): Promise<void> {
    if (this.stagingState !== undefined) {
      throw new NetworkBusyError()
    }
    // next action
    return await Promise.resolve()
  }

  public async handleDispatch (prevState: State, action: Action): Promise<State> {
    if (this.stagingState !== undefined) {
      throw new NetworkBusyError()
    }
    // next action
    return await Promise.resolve(prevState)
  }

  public async handlePromote (cs: string): Promise<void> {
    if (this.stagingState !== undefined) {
      if (checksum(JSON.stringify(this.stagingState)) === cs) {
        this.network.setState(this.stagingState)
        this.stagingState = undefined
      } else {
        throw new Error('Cannot promote staging state with unmatched checksum')
      }
    } else {
      throw new NoStagingStateError()
    }
    return await Promise.resolve()
  }

  public async handleCancel (cs: string): Promise<void> {
    if (this.stagingState !== undefined) {
      if (checksum(JSON.stringify(this.stagingState)) === cs) {
        this.stagingState = undefined
      } else {
        throw new Error('Cannot cancel staging state with unmatched checksum')
      }
    } else {
      throw new NoStagingStateError()
    }
    return await Promise.resolve()
  }

  public forceCancel (): void {
    this.stagingState = undefined
  }

  public isBusy (): boolean {
    return this.stagingState !== undefined
  }

  public abstract setUpConnection (conn: Peer.DataConnection): void
}
