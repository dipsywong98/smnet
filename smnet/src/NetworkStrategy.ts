import { DataConnection } from 'peerjs'
import { NetworkAction, NetworkState } from './types'
import { Network } from './Network'

export interface NetworkStrategy<State extends NetworkState, Action extends NetworkAction> {
  network: Network<State, Action>
  dispatch: (action: Action) => Promise<void>
  handleDispatch: (prevState: State, action: Action) => Promise<State>
  handleCancel: (cs: string) => Promise<void>
  handlePromote: (cs: string) => Promise<void>
  setUpConnection: (conn: DataConnection) => void
  isBusy: () => boolean
}
