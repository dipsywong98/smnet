import { useMemo, useState } from 'react'
import { NetworkAction, NetworkReducer, NetworkState } from './types'
import { Network } from './Network'
import { StateManager } from './StateManager'
import { PeerFactory } from './PeerFactory'

export interface UseNetworkReturn<State extends NetworkState, Action extends NetworkAction> {
  state: State
  join: (networkName: string, peerFactory?: PeerFactory) => Promise<void>
  leave: () => Promise<void>
  dispatch: (action: Action) => Promise<void>
}

export function useNetwork<State extends NetworkState = NetworkState, Action extends NetworkAction = NetworkAction> (reducer: NetworkReducer<State, Action>, initialState: State): UseNetworkReturn<State, Action> {
  const [state, setState] = useState(initialState)
  const network = useMemo(() => new Network(reducer, StateManager.make(initialState, setState)), [])
  // const network = useMemo(() => {
  //   return new Network(reducer, stateManager)
  // }, [])
  // const networkRef = useRef<Network<State, Action>>(null)
  // if (networkRef.current === null) {
  //   const stateManager = ObservableStateManager.make(initialState)
  //   stateManager.on(setState)
  //   console.log('assign')
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-expect-error
  //   networkRef.current = new Network<State, Action>(reducer, stateManager)
  //   console.log('assign done')
  // }
  // const network: Network<State, Action> = networkRef.current
  return {
    join: network.join.bind(network),
    leave: network.leave.bind(network),
    dispatch: network.dispatch.bind(network),
    state
  }
}
