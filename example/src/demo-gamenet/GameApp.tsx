import React, { FunctionComponent } from 'react'
import { Game } from './Game'
import { usePoker99, withPoker99Network } from './withPoker99Network'
import { GamePagesSlider, Home, Room } from 'gamenet-material'

export const GameApp: FunctionComponent = withPoker99Network(() => {
  const network = usePoker99()
  return (
    <GamePagesSlider gameAppState={network.gameAppState} fullPage={[false, false, true]}>
      <Home {...network} />
      <Room {...network} />
      <Game />
    </GamePagesSlider>
  )
})
