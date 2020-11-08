import React, { FunctionComponent } from 'react'
import { Home } from './Home'
import { Room } from './Room'
import { Game } from './Game'
import { withGameNetwork } from './withGameNetwork'
import { GameAppState, useGameNetwork } from 'gamenet'

export const GameApp: FunctionComponent = withGameNetwork(() => {
  const { gameAppState } = useGameNetwork()
  switch (gameAppState) {
    case GameAppState.HOME:
      return <Home />
    case GameAppState.ROOM:
      return <Room />
    case GameAppState.GAME:
      return <Game />
    default:
      throw new Error('unknown state')
  }
})
