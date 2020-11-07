import React, { FunctionComponent } from 'react'
import { useGame } from './lib/network/useGame'

export const Room: FunctionComponent = () => {
  const { room, state, leave, isAdmin, myId, kick } = useGame()
  return (
    <div>
      <div>Room: {room}</div>
      <div>
        {Object.entries(state.members).map(([id, name]) => <div key={name}>{name} {(id !== myId && isAdmin) && <button onClick={async () => await kick(id)}>kick</button>}</div>)}
      </div>
      <button onClick={leave}>leave</button>
    </div>
  )
}
