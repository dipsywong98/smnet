import { NetworkAction, NetworkState, PkgType } from '../types'
import Peer from 'peerjs'
import checksum from 'checksum'
import { AbstractNetworkStrategy } from './AbstractNetworkStrategy'

/**
 * Strategy of the center point of star network
 * star network host has the greatest power and force everyone to use his state
 */
export class StarHostStrategy<State extends NetworkState, Action extends NetworkAction> extends AbstractNetworkStrategy<State, Action> {
  public async dispatch (action: Action): Promise<void> {
    // run reducer locally, stage it and get checksum of new state
    console.log('reduce locally', this.network.getState(), action)
    this.stagingState = this.network.applyReducer(this.network.getState(), action)
    const cs = checksum(JSON.stringify(this.stagingState))
    console.log('stagingState', this.stagingState)

    // tell other points to calculate
    const responses = await this.network.broadcast(PkgType.DISPATCH, action)
    console.log('obtained responses', responses)

    // revert if anypoint threw any error
    // force update if that point wont have same checksum
    // promote if that point will have same checksum
    const errors: string[] = []
    const forceUpdate: Peer.DataConnection[] = []
    const promote: Peer.DataConnection[] = []
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
    console.log('different type of responses', { errors, forceUpdate, promote })
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

    // promote owns' state after updating all others' state
    await this.handlePromote(cs)
    console.log('promoted locally')
  }

  // other points' dispatch action will directly forward to host, and host broadcast the action
  // if host cannot broadcast the action, it will feedback the source with error message
  public async handleDispatch (prevState: State, action: Action): Promise<State> {
    await this.dispatch(action)
    return this.network.getState()
  }

  // no special handlers for star host
  public setUpConnection (conn: Peer.DataConnection): void {
    // no-ops
  }
}
