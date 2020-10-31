import { NetworkAction, NetworkState, PkgType } from './types'
import Peer from 'peerjs'
import checksum from 'checksum'
import { AbstractNetworkStrategy } from './AbstractNetworkStrategy'

export class StarHostStrategy<State extends NetworkState, Action extends NetworkAction> extends AbstractNetworkStrategy<State, Action> {
  public async dispatch (action: Action): Promise<void> {
    await super.dispatch(action)
    this.stagingState = this.network.applyReducer(this.network.getState(), action)
    const cs = checksum(JSON.stringify(this.stagingState))
    const responses = await this.network.broadcast(PkgType.DISPATCH, action)
    const forceUpdate: Peer.DataConnection[] = []
    const promote: Peer.DataConnection[] = []
    const errors: string[] = []
    responses.forEach(({ conn, data, error }) => {
      if (error !== undefined) {
        errors.push(error)
      } else {
        if (data !== cs) {
          forceUpdate.push(conn)
        } else {
          promote.push(conn)
        }
      }
    })
    if (errors.length > 0) {
      console.error('cancelling', errors)
      await this.network.broadcast(PkgType.CANCEL, cs)
      throw new Error(errors[0])
    }
    forceUpdate.map(async conn => {
      await this.network.send(conn, PkgType.SET_STATE, this.stagingState)
    })
    promote.map(async conn => {
      await this.network.send(conn, PkgType.PROMOTE, cs)
    })
    this.network.setState(this.stagingState)
    this.stagingState = undefined
  }

  public async handleDispatch (prevState: State, action: Action): Promise<State> {
    await super.handleDispatch(prevState, action)
    await this.network.dispatch(action)
    return this.network.getState()
  }

  setUpConnection (conn: Peer.DataConnection): void {
    //
  }
}
