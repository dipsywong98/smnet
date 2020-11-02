import { DataConnection } from 'peerjs'
import { NetworkAction, NetworkState } from '../types'
import { Network } from '../Network'

/**
 * These are the supported variation of a network strategy
 */
export interface NetworkStrategy<State extends NetworkState, Action extends NetworkAction> {
  stagingState?: State
  network: Network<State, Action>
  dispatch: (action: Action) => Promise<void>
  handleDispatch: (prevState: State, action: Action) => Promise<State>
  handlePromote: (cs: string) => Promise<void>
  handleCancel: (cs: string) => Promise<void>
  forceCancel: () => void
  setUpConnection: (conn: DataConnection) => void
  isBusy: () => boolean
}
