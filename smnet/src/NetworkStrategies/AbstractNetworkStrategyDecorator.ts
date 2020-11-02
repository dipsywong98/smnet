import { NetworkStrategy } from './NetworkStrategy'
import { NetworkAction, NetworkState } from '../types'
import { Network } from '../Network'
import { DataConnection } from 'peerjs'

export abstract class AbstractNetworkStrategyDecorator<State extends NetworkState, Action extends NetworkAction> implements NetworkStrategy<State, Action> {
  protected wrappedStrategy: NetworkStrategy<State, Action>

  get stagingState (): State | undefined {
    return this.wrappedStrategy.stagingState
  }

  set stagingState (value: State | undefined) {
    this.wrappedStrategy.stagingState = value
  }

  get network (): Network<State, Action> {
    return this.wrappedStrategy.network
  }

  constructor (networkStrategy: NetworkStrategy<State, Action>) {
    this.wrappedStrategy = networkStrategy
  }

  public async dispatch (action: Action): Promise<void> {
    return await this.wrappedStrategy.dispatch(action)
  }

  public forceCancel (): void {
    return this.wrappedStrategy.forceCancel()
  }

  public async handleCancel (cs: string): Promise<void> {
    return await this.wrappedStrategy.handleCancel(cs)
  }

  public async handleDispatch (prevState: State, action: Action): Promise<State> {
    return await this.wrappedStrategy.handleDispatch(prevState, action)
  }

  public async handlePromote (cs: string): Promise<void> {
    return await this.wrappedStrategy.handlePromote(cs)
  }

  public isBusy (): boolean {
    return this.wrappedStrategy.isBusy()
  }

  public setUpConnection (conn: DataConnection): void {
    return this.wrappedStrategy.setUpConnection(conn)
  }
}
