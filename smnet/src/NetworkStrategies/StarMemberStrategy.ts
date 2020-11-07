import { NetworkAction, NetworkState, PkgType } from '../types'
import Peer from 'peerjs'
import { AbstractNetworkStrategy } from './AbstractNetworkStrategy'
import { pause } from '../pause'
import { logger } from '../Logger'

/**
 * Strategy of the non-center point of star network
 * star network host has the greatest power and force everyone to use his state
 */
export class StarMemberStrategy<State extends NetworkState, Action extends NetworkAction> extends AbstractNetworkStrategy<State, Action> {
  // just forward the dispatch to host
  public async dispatch (action: Action): Promise<void> {
    await this.network.broadcast(PkgType.DISPATCH, action)
  }

  // just do the reduce when receiving a dispatch
  public async handleDispatch (prevState: State, action: Action): Promise<State> {
    this.stagingState = this.network.applyReducer(prevState, action)
    return await Promise.resolve(this.stagingState)
  }

  // when got disconnected from host, most probably due to host is down
  // it will try to be the new host or reconnect to new host
  public setUpConnection (conn: Peer.DataConnection): void {
    conn.on('close', () => {
      this.recover().catch(logger.error)
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
