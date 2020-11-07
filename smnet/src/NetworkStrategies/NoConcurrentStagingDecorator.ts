import { AbstractNetworkStrategyDecorator } from './AbstractNetworkStrategyDecorator'
import { NetworkAction, NetworkState } from '../types'
import { NetworkBusyError } from '../Errors'
import { NetworkStrategy } from './NetworkStrategy'
import { logger } from '../Logger'

export class NoConcurrentStagingDecorator<State extends NetworkState, Action extends NetworkAction> extends AbstractNetworkStrategyDecorator<State, Action> {
  public async dispatch (action: Action): Promise<void> {
    if (this.stagingState !== undefined) {
      logger.error('cannot dispatch when there is staging state', this.stagingState)
      throw new NetworkBusyError()
    }
    // next action
    return await this.wrappedStrategy.dispatch(action)
  }

  public async handleDispatch (prevState: State, action: Action): Promise<State> {
    if (this.stagingState !== undefined) {
      logger.error('cannot handle dispatch request when there is staging state', this.stagingState)
      throw new NetworkBusyError()
    }
    // next action
    return await this.wrappedStrategy.handleDispatch(prevState, action)
  }
}

export const noConcurrentStaging = <State extends NetworkState, Action extends NetworkAction> (networkStrategy: NetworkStrategy<State, Action>): NetworkStrategy<State, Action> => {
  return new NoConcurrentStagingDecorator(networkStrategy)
}
