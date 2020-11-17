import React, { FunctionComponent } from 'react'
import { Home } from './Home'
import { Room } from './Room'
import { Game } from './Game'
import { usePoker99, withPoker99Network } from './withPoker99Network'

const transition = (time: number, props: string[], ease = 'ease'): { transition: string } => ({
  transition: props.map(p => `${time}s ${p} ${ease}`).join(',')
})

export const GameApp: FunctionComponent = withPoker99Network(() => {
  const { gameAppState } = usePoker99()
  // switch (gameAppState) {
  //   case GameAppState.HOME:
  //     return <Home />
  //   case GameAppState.ROOM:
  //     return <Room />
  //   case GameAppState.GAME:
  //     return <Game />
  //   default:
  //     throw new Error('unknown state')
  // }
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/*<GameRenderer />*/}
      <div
        style={{
          pointerEvents: 'none',
          display: 'flex',
          height: '100vh',
          width: '100vw',
          left: `${-(gameAppState - 2) * 100}%`,
          position: 'absolute',
          ...transition(0.3, ['left'], 'linear')
        }}>
        <Game />
      </div>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          height: '100vh',
          left: `${-(gameAppState - 1) * 100}%`,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          ...transition(0.3, ['left'], 'linear')
        }}>
        <Room />
      </div>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          height: '100vh',
          left: `${-gameAppState * 100}%`,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          ...transition(0.3, ['left'], 'linear')
        }}>
        <Home />
      </div>
    </div>
  )
})
