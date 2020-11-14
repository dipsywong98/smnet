import { logger, NetworkReducer, useNetwork } from 'smnet'
import { withGenericGameReducer } from './withGenericGameReducer'
import { GenericGameState, PlayerType } from './GenericGameState'
import { GameActionTypes, GenericGameAction } from './GenericGameAction'
import { ReactNode, useEffect, useMemo, useState } from 'react'

export interface GameContextInterface<State, Action> {
  connect: (name: string, room: string) => Promise<void>
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
}

export enum GameAppState {
  HOME,
  ROOM,
  GAME
}

export interface GameNetworkProps<State extends GenericGameState, Action extends GenericGameAction> {
  children: ReactNode
  reducer: NetworkReducer<State, Action>
  initialState: State
}

export const useGameNetwork = <State extends GenericGameState, Action extends GenericGameAction> (reducer: NetworkReducer<State, Action>, initialState: State): GameContextInterface<State, Action> => {
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
  const connect = async (name: string, room: string): Promise<void> => {
    try {
      logger.info('connecting', room)
      await network.join(room)
      logger.info('entering with name', name)
      await rename(name)
      logger.info('connected', room)
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
    gameAppState,
    state,
    room: network.networkName,
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
    dispatchAs
  }
}
