import { NetworkAction, NetworkState, PkgType } from './types'
import Peer from 'peerjs'
import { AbstractNetworkStrategy } from './AbstractNetworkStrategy'

export class StarMemberStrategy<State extends NetworkState, Action extends NetworkAction> extends AbstractNetworkStrategy<State, Action> {
  public async dispatch (action: Action): Promise<void> {
    await super.dispatch(action)
    await this.network.broadcast(PkgType.DISPATCH, action)
  }

  public async handleDispatch (prevState: State, action: Action): Promise<State> {
    prevState = await super.handleDispatch(prevState, action)
    this.stagingState = this.network.applyReducer(prevState, action)
    return await Promise.resolve(this.stagingState)
  }

  setUpConnection (conn: Peer.DataConnection): void {
    //
  }
}
