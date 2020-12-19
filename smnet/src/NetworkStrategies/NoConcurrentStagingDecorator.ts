import { AbstractNetworkStrategyDecorator } from './AbstractNetworkStrategyDecorator'
import { NetworkAction, NetworkState } from '../types'
import { NetworkBusyError } from '../Errors'
import { NetworkStrategy } from './NetworkStrategy'
import { logger } from '../Logger'
import checksum from 'checksum'

export class NoConcurrentStagingDecorator<State extends NetworkState, Action extends NetworkAction> extends AbstractNetworkStrategyDecorator<State, Action> {
  private failCount = 0
  private MAX_RESET = 10
  public async dispatch (action: Action): Promise<void> {
    this.checkStagingState('cannot dispatch when there is staging state')
    // next action
    return await this.wrappedStrategy.dispatch(action)
  }

  public async handleDispatch (prevState: State, action: Action): Promise<State> {
    this.checkStagingState('cannot handle dispatch request when there is staging state')
    // next action
    return await this.wrappedStrategy.handleDispatch(prevState, action)
  }

  private checkStagingState (errorMessage: string): void {
    if(this.failCount >= this.MAX_RESET) {
      this.stagingState = undefined
    }
    if (this.stagingState !== undefined) {
      if(checksum(JSON.stringify(this.stagingState)) === checksum(JSON.stringify(this.network.state))) {
        this.stagingState = undefined
      } else {
        logger.error(errorMessage, this.stagingState)
        this.failCount++
        throw new NetworkBusyError()
      }
    } else {
      this.failCount = 0
    }
  }
}

export const noConcurrentStaging = <State extends NetworkState, Action extends NetworkAction> (networkStrategy: NetworkStrategy<State, Action>): NetworkStrategy<State, Action> => {
  return new NoConcurrentStagingDecorator(networkStrategy)
}
