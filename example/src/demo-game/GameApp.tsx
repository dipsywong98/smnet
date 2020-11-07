import React, { FunctionComponent } from 'react'
import { Home } from './Home'
import { GameAppState, useGame, withGame } from './lib/network/useGame'
import { Room } from './Room'

export const GameApp: FunctionComponent = withGame(() => {
  const { gameAppState } = useGame()
  switch (gameAppState) {
    case GameAppState.HOME:
      return <Home />
    case GameAppState.ROOM:
      return <Room />
    default:
      throw new Error('unknown state')
  }
})
