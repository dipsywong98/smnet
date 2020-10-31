import { NetworkAction, NetworkState, PkgType } from './types'
import Peer from 'peerjs'
import { AbstractNetworkStrategy } from './AbstractNetworkStrategy'
import { pause } from './pause'

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

  public setUpConnection (conn: Peer.DataConnection): void {
    conn.on('close', () => {
      this.recover().catch(console.error)
    })
  }

  private async recover (): Promise<void> {
    const name = this.network.getNetworkName()
    if (name !== undefined) {
      if (!this.isBusy()) {
        try {
          await this.network.initAsStarHost(name, this.peerFactory)
        } catch (e) {
          await this.network.initAsStarMember(name, this.peerFactory)
        }
      } else {
        await pause(500)
        await this.recover()
      }
    }
  }
}
