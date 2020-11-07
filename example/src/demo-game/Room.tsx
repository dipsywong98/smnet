import React, { FunctionComponent } from 'react'
import { useGame } from './lib/network/useGame'

export const Room: FunctionComponent = () => {
  const { room, state } = useGame()
  return (
    <div>
      <div>Room: {room}</div>
      <div>
        {Object.values(state.members).map(name => <div key={name}>{name}</div>)}
      </div>
    </div>
  )
}
