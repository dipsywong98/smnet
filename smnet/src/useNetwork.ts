import { useEffect, useMemo, useState } from 'react'
import { NetworkAction, NetworkReducer, NetworkState } from './types'
import { Network } from './Network'
import { StateManager } from './StateManager'
import { PeerFactory } from './PeerFactory'

export interface UseNetworkReturn<State extends NetworkState, Action extends NetworkAction> {
  state: State
  connected: boolean
  networkName: string | undefined
  join: (networkName: string, peerFactory?: PeerFactory) => Promise<void>
  leave: () => Promise<void>
  dispatch: (action: Action) => Promise<void>
}

export function useNetwork<State extends NetworkState = NetworkState, Action extends NetworkAction = NetworkAction> (reducer: NetworkReducer<State, Action>, initialState: State): UseNetworkReturn<State, Action> {
  const [state, setState] = useState(initialState)
  const network = useMemo(() => new Network(reducer, StateManager.make(initialState, setState)), [])
  useEffect(() => {
    return () => {
      network.leave()
        .catch(console.error)
    }
  }, [network])
  return Object.freeze({
    join: network.join.bind(network),
    leave: network.leave.bind(network),
    dispatch: network.dispatch.bind(network),
    state,
    connected: network.connected,
    networkName: network.getNetworkName()
  })
}
