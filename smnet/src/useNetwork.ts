import { useEffect, useMemo, useState } from 'react'
import { NetworkAction, NetworkReducer, NetworkState } from './types'
import { Network } from './Network'
import { StateManager } from './StateManager'
import { PeerFactory } from './PeerFactory'
import { logger } from './Logger'

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
  const network = useMemo(() => new Network(reducer, StateManager.make(initialState, setState, 10)), [])
  useEffect(() => {
    if (process.env.REACT_APP_DISABLE_SMNET_DEBUGGER === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/ban-ts-comment
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window.stateHistory = network.getHistory; window.smnetLog = logger; window.network = network
    }
    return () => {
      network.leave()
        .catch(logger.error)
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
