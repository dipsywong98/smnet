import { logger, NetworkAction, NetworkReducer, useNetwork } from 'smnet'
import { withGenericGameReducer } from './withGenericGameReducer'
import { GenericGameState, PlayerType } from './GenericGameState'
import { GameActionTypes } from './GenericGameAction'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { extractNamespacedRoom, getNamespacedRoom } from '../getNamespacedRoom'

export interface GameContextInterface<State, Action> {
  connect: (name: string, room: string) => Promise<void>
  connected: boolean
  connecting: boolean
  dispatching: boolean
  leave: () => Promise<void>
  gameAppState: GameAppState
  state: State
  room?: string
  isAdmin: boolean
  myId?: string
  kick: (id: string) => Promise<void>
  ready: () => Promise<void>
  start: () => Promise<void>
  addLocal: (name: string) => Promise<void>
  addAi: (name: string) => Promise<void>
  dispatch: (action: Action) => Promise<void>
  playerType: (nameOrId: string | number) => PlayerType
  myPlayerId: number
  myLocals: string[] // array of names
  myAis: string[] // array of names
  getPeerId: (playerId: number) => string
  dispatchAs: (playerId: number, action: Action) => Promise<void>
  namespace?: string
  namespacedRoom?: string
  setShowInLobby: (flag: boolean) => Promise<void>
}

export enum GameAppState {
  HOME,
  ROOM,
  GAME
}

export interface GameNetworkProps<State extends GenericGameState, Action extends NetworkAction> {
  children: ReactNode
  reducer: NetworkReducer<State, Action>
  initialState: State
}

export const useGameNetwork = <State extends GenericGameState, Action extends NetworkAction> (reducer: NetworkReducer<State, Action>, initialState: State, namespace?: string): GameContextInterface<State, Action> => {
  const [gameAppState, setGameAppState] = useState(GameAppState.HOME)
  const network = useNetwork(withGenericGameReducer(reducer), initialState)
  const state = network.state as State
  const myId = network.myId
  const myPlayerId = useMemo(() => {
    try {
      return state.nameDict[state.members[myId as string]]
    } catch (e) {
      return -1
    }
  }, [myId, state])
  const myLocals = useMemo(() => {
    try {
      return Object.keys(state.localPlayers).filter(name => state.localPlayers[name] === myId).map(peerId => state.members[peerId])
    } catch (e) {
      return []
    }
  }, [myId, state])
  const myAis = useMemo(() => {
    try {
      return Object.keys(state.aiPlayers).filter(name => state.aiPlayers[name] === myId).map(peerId => state.members[peerId])
    } catch (e) {
      return []
    }
  }, [myId, state])

  const getPeerId = (playerId: number): string => {
    return Object.keys(state.members).filter(peerId => state.members[peerId] === state.players[playerId])[0]
  }

  const dispatchAs = async (playerId: number, action: Action): Promise<void> => {
    await network.dispatch({ ...action, peerId: getPeerId(playerId) })
  }

  const playerType = (nameOrId: string | number): PlayerType => {
    const name: string = typeof nameOrId === 'string' ? nameOrId : network.state.players[nameOrId]
    const peerId: string | undefined = Object.entries(network.state.members).find(([_peerId, n]) => name === n)?.[0]
    if (peerId === undefined) {
      return PlayerType.NORMAL
    }
    if (peerId in network.state.aiPlayers) {
      return PlayerType.AI
    } else if (peerId in network.state.localPlayers) {
      return PlayerType.LOCAL
    } else {
      return PlayerType.NORMAL
    }
  }
  const rename = async (name: string): Promise<void> => {
    await network.dispatch({
      type: GameActionTypes.RENAME,
      payload: name
    })
  }
  const ready = async (): Promise<void> => {
    await network.dispatch({
      type: GameActionTypes.READY
    })
  }
  const start = async (): Promise<void> => {
    await network.dispatch({
      type: GameActionTypes.START
    })
  }
  const addLocal = async (name: string): Promise<void> => {
    await network.dispatch({
      type: GameActionTypes.ADD_LOCAL,
      payload: name
    })
  }
  const addAi = async (name: string): Promise<void> => {
    await network.dispatch({
      type: GameActionTypes.ADD_AI,
      payload: name
    })
  }
  const setShowInLobby = async (flag: boolean): Promise<void> => {
    await network.dispatch({
      type: GameActionTypes.SET_SHOW_IN_LOBBY,
      payload: flag
    })
  }
  const connect = async (name: string, room: string): Promise<void> => {
    try {
      const namespacedRoom = getNamespacedRoom(room, namespace)
      logger.info('connecting', namespacedRoom)
      await network.join(namespacedRoom)
      logger.info('entering with name', name)
      await rename(name)
      logger.info('connected', namespacedRoom)
    } catch (e) {
      logger.error(e)
      await leave()
      throw e
    }
  }
  const leave = async (): Promise<void> => {
    logger.info('leaving')
    await network.leave()
  }
  const kick = async (peerId: string): Promise<void> => {
    logger.info('leaving')
    if (peerId in network.state.aiPlayers || peerId in network.state.localPlayers) {
      await network.dispatch({
        type: GameActionTypes.REMOVE_LOCAL_AI,
        payload: peerId
      })
    } else {
      await network.kick(peerId)
    }
  }
  useEffect(() => {
    if (network.state.started && network.networkName !== undefined) {
      setGameAppState(GameAppState.GAME)
    } else if (network.networkName !== undefined) {
      setGameAppState(GameAppState.ROOM)
    } else {
      setGameAppState(GameAppState.HOME)
    }
  }, [network.state, network.networkName])
  return {
    connect,
    connected: network.connected,
    connecting: network.connecting,
    dispatching: network.dispatching,
    gameAppState,
    state,
    leave,
    isAdmin: network.isAdmin,
    myId,
    kick,
    ready,
    start,
    dispatch: network.dispatch,
    addLocal,
    addAi,
    playerType,
    myPlayerId,
    myLocals,
    myAis,
    getPeerId,
    dispatchAs,
    setShowInLobby,
    ...extractNamespacedRoom(network.networkName)
  }
}
