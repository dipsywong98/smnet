import { useEffect, useMemo, useState } from 'react'
import { NetworkAction, NetworkReducer, NetworkState } from './types'
import { Network } from './Network'
import { StateManager } from './StateManager'
import { PeerFactory } from './PeerFactory'
import { logger } from './Logger'
import { usePeerFactory } from './useConfigurePeerFactory'

export interface UseNetworkReturn<State extends NetworkState, Action extends NetworkAction> {
  state: State
  connected: boolean
  connecting: boolean
  dispatching: boolean
  networkName: string | undefined
  join: (networkName: string, peerFactory?: PeerFactory) => Promise<void>
  leave: () => Promise<void>
  dispatch: (action: Action) => Promise<void>
  isAdmin: boolean
  myId?: string
  kick: (id: string) => Promise<void>
}

export function useNetwork<State extends NetworkState = NetworkState, Action extends NetworkAction = NetworkAction> (reducer: NetworkReducer<State, Action>, initialState: State): UseNetworkReturn<State, Action> {
  const [state, setState] = useState(initialState)
  const [connecting, setConnecting] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const network = useMemo(() => new Network(reducer, StateManager.make(initialState, setState, 10)), [])
  useEffect(() => {
    if (process.env.REACT_APP_DISABLE_SMNET_WINDOW_VAR === undefined) {
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
  const peerFactoryInContext = usePeerFactory()
  const join = async (networkName: string, peerFactory?: PeerFactory) => {
    setConnecting(true)
    await network.join(networkName, peerFactory ?? peerFactoryInContext).finally(() => {
      setConnecting(false)
    })
  }
  const dispatch = async (action: Action) => {
    setDispatching(true)
    await network.dispatch(action).finally(() => {
      setDispatching(false)
    })
  }
  return Object.freeze({
    join,
    leave: network.leave.bind(network),
    dispatch,
    state,
    connected: network.connected,
    connecting,
    dispatching,
    networkName: network.getNetworkName(),
    isAdmin: network.isAdmin,
    myId: network.myId,
    kick: network.kick
  })
}
