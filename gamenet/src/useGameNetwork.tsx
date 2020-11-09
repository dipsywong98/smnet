import { logger, NetworkReducer, useNetwork } from 'smnet'
import { withGenericGameReducer } from './withGenericGameReducer'
import { GenericGameState } from './GenericGameState'
import { GameActionTypes, GenericGameAction } from './GenericGameAction'
import React, { createContext, FunctionComponent, ReactNode, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

interface GameContextInterface {
  connect: (name: string, room: string) => Promise<void>
  leave: () => Promise<void>
  gameAppState: GameAppState
  state: GenericGameState
  room?: string
  isAdmin: boolean
  myId?: string
  kick: (id: string) => Promise<void>
  ready: () => Promise<void>
  start: () => Promise<void>
  addLocal: (name: string) => Promise<void>
  addAi: (name: string) => Promise<void>
  dispatch: (action: GenericGameAction) => Promise<void>
}

export enum GameAppState {
  HOME,
  ROOM,
  GAME
}

const GameContext = createContext<GameContextInterface | null>(null)

export interface GameNetworkProps {
  children: ReactNode
  reducer: NetworkReducer<GenericGameState, GenericGameAction>
  initialState: GenericGameState
}

export const GameNetworkProvider: FunctionComponent<GameNetworkProps> = ({ children, reducer, initialState }) => {
  const [gameAppState, setGameAppState] = useState(GameAppState.HOME)
  const network = useNetwork(withGenericGameReducer(reducer), initialState)
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
  useEffect(() => {
    if (network.state.started && network.networkName !== undefined) {
      setGameAppState(GameAppState.GAME)
    } else if (network.networkName !== undefined) {
      setGameAppState(GameAppState.ROOM)
    } else {
      setGameAppState(GameAppState.HOME)
    }
  }, [network.state, network.networkName])
  return <GameContext.Provider
    value={{
      connect,
      gameAppState,
      state: network.state,
      room: network.networkName,
      leave,
      isAdmin: network.isAdmin,
      myId: network.myId,
      kick: network.kick,
      ready,
      start,
      dispatch: network.dispatch,
      addLocal,
      addAi
    }}>
    {children}
  </GameContext.Provider>
}

GameNetworkProvider.propTypes = {
  children: PropTypes.node,
  reducer: PropTypes.func.isRequired,
  initialState: PropTypes.instanceOf(GenericGameState).isRequired
}

export const useGameNetwork = (): GameContextInterface => {
  const ret = useContext(GameContext)
  if (ret === null) {
    throw new Error('Please wrap the component with GameNetworkProvider before using useGameNetwork')
  }
  return ret
}
