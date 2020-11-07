import React, { FunctionComponent, useState } from 'react'
import { useGame } from './lib/network/useGame'

export const Room: FunctionComponent = () => {
  const { room, state, leave, isAdmin, myId, kick, ready, start } = useGame()
  const [error, setError] = useState('')
  const handleStartClick = async (): Promise<void> => {
    await start().catch((e: Error) => setError(e.message))
  }
  const handleReadyClick = async (): Promise<void> => {
    await ready().catch((e: Error) => setError(e.message))
  }
  return (
    <div>
      <div>Room: {room}</div>
      <div>
        {Object.entries(state.members).map(([id, name]) => (
          <div key={name}>{name} {(id !== myId && isAdmin) &&
          <button onClick={async () => await kick(id)}>kick</button>}{(state.ready[id] ?? false) && '(ready)'}</div>)
        )}
      </div>
      <button onClick={leave}>leave</button>
      {isAdmin ? <button onClick={handleStartClick}>start</button> : <button onClick={handleReadyClick}>ready</button>}
      {error !== '' && <div>{error}</div>}
    </div>
  )
}
