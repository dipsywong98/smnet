import { NetworkStrategy } from './NetworkStrategy'
import { Network } from './Network'
import { NetworkAction, NetworkState, PkgType } from './types'
import Peer from 'peerjs'
import checksum from 'checksum'
import { NetworkBusyError, NoStagingStateError } from './Errors'

export class StarHostStrategy<State extends NetworkState, Action extends NetworkAction> implements NetworkStrategy<State, Action> {
  network: Network<State, Action>
  private stagingState?: State

  constructor (network: Network<State, Action>) {
    this.network = network
  }

  public async dispatch (action: Action): Promise<void> {
    if (this.stagingState !== undefined) {
      throw new NetworkBusyError()
    }
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
    if (this.stagingState !== undefined) {
      throw new NetworkBusyError()
    }
    await this.network.dispatch(action)
    return this.network.getState()
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

  setUpConnection (conn: Peer.DataConnection): void {
    //
  }
}
