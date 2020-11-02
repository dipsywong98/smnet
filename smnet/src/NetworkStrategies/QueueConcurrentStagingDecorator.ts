import { AbstractNetworkStrategyDecorator } from './AbstractNetworkStrategyDecorator'
import { NetworkAction, NetworkState, PromiseHandler } from '../types'
import { NetworkStrategy } from './NetworkStrategy'

export class QueueConcurrentStagingDecorator<State extends NetworkState, Action extends NetworkAction> extends AbstractNetworkStrategyDecorator<State, Action> {
  private readonly queue: Array<PromiseHandler & { callback: () => Promise<unknown> }> = []

  public set stagingState (state: State | undefined) {
    this.wrappedStrategy.stagingState = state
    if (state === undefined) {
      this.shiftQueue()
    }
  }

  public async dispatch (action: Action): Promise<void> {
    if (this.stagingState !== undefined) {
      return await this.pushQueue(async () => await this.dispatch(action))
    }
    // next action
    await this.wrappedStrategy.dispatch(action)
  }

  public async handleDispatch (prevState: State, action: Action): Promise<State> {
    if (this.stagingState !== undefined) {
      return await this.pushQueue(async () => await this.handleDispatch(prevState, action))
    }
    // next action
    return await this.wrappedStrategy.handleDispatch(prevState, action)
  }

  private shiftQueue (): void {
    const shift = this.queue.shift()
    if (shift !== undefined) {
      const { resolve, reject, callback } = shift
      callback().then(() => resolve()).catch(reject)
    }
  }

  private readonly pushQueue = async <T> (callback: () => Promise<T>): Promise<T> => {
    return await new Promise((resolve, reject) => {
      this.queue.push({ callback, resolve, reject })
    })
  }
}

export const queueConcurrentStaging = <State extends NetworkState, Action extends NetworkAction> (networkStrategy: NetworkStrategy<State, Action>): NetworkStrategy<State, Action> => {
  return new QueueConcurrentStagingDecorator(networkStrategy)
}
