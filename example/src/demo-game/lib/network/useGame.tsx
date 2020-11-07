import { useNetwork } from 'smnet'
import { gameReducer } from './GameReducer'
import { GameState } from './GameState'
import { GameActionTypes } from './GameAction'
import React, { createContext, FunctionComponent, useContext, useState } from 'react'
import PropTypes from 'prop-types'

interface GameContextInterface {
  connect: (name: string, room: string) => Promise<void>
  gameAppState: GameAppState
  state: GameState
  room?: string
}

export enum GameAppState {
  HOME,
  ROOM,
  GAME
}

const GameContext = createContext<GameContextInterface>({
  connect: async () => await Promise.reject(new Error('not implemented')),
  gameAppState: GameAppState.HOME,
  state: new GameState()
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
  const connect = async (name: string, room: string): Promise<void> => {
    console.log('connecting')
    await network.join(room)
    await rename(name)
    setGameAppState(GameAppState.ROOM)
    console.log('connected')
  }
  return <GameContext.Provider
    value={{
      connect,
      gameAppState,
      state: network.state,
      room: network.networkName
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
  return WithGame
}

export const useGame = (): GameContextInterface => useContext(GameContext)
