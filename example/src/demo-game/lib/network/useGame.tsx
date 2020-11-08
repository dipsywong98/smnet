import { logger, useNetwork } from 'smnet'
import { gameReducer } from './GameReducer'
import { GameState } from './GameState'
import { GameActionTypes } from './GameAction'
import React, { createContext, FunctionComponent, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

interface GameContextInterface {
  connect: (name: string, room: string) => Promise<void>
  leave: () => Promise<void>
  gameAppState: GameAppState
  state: GameState
  room?: string
  isAdmin: boolean
  myId?: string
  kick: (id: string) => Promise<void>
  ready: () => Promise<void>
  start: () => Promise<void>
}

export enum GameAppState {
  HOME,
  ROOM,
  GAME
}

const GameContext = createContext<GameContextInterface>({
  connect: async () => await Promise.reject(new Error('not implemented')),
  leave: async () => await Promise.reject(new Error('not implemented')),
  kick: async () => await Promise.reject(new Error('not implemented')),
  ready: async () => await Promise.reject(new Error('not implemented')),
  start: async () => await Promise.reject(new Error('not implemented')),
  gameAppState: GameAppState.HOME,
  state: new GameState(),
  isAdmin: false
})

export const GameProvider: FunctionComponent = ({ children }) => {
  const [gameAppState, setGameAppState] = useState(GameAppState.HOME)
  const network = useNetwork(gameReducer, new GameState())
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
  // useEffect(() => {
  //   if (network.networkName === undefined) {
  //     setGameAppState(GameAppState.HOME)
  //   }
  // }, [network.networkName])
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
      start
    }}>
    {children}
  </GameContext.Provider>
}

GameProvider.propTypes = {
  children: PropTypes.node
}

export const withGame = (Component: FunctionComponent): FunctionComponent => {
  const WithGame: FunctionComponent = (props) => (
    <GameProvider>
      <Component {...props} />
    </GameProvider>
  )
  WithGame.displayName = 'WithGame'
  return WithGame
}

export const useGame = (): GameContextInterface => useContext(GameContext)
