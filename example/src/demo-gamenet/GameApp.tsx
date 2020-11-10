import React, { FunctionComponent } from 'react'
import { Home } from './Home'
import { Room } from './Room'
import { Game } from './Game'
import { usePoker99, withPoker99Network } from './withPoker99Network'
import { GameAppState } from 'gamenet'

export const GameApp: FunctionComponent = withPoker99Network(() => {
  const { gameAppState } = usePoker99()
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
