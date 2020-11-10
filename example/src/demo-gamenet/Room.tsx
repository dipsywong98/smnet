import React, { FunctionComponent, useState } from 'react'
import { PlayerType } from 'gamenet'
import { usePoker99 } from './withPoker99Network'

export const Room: FunctionComponent = () => {
  const { room, state, leave, isAdmin, myId, kick, ready, start, addAi, addLocal, playerType } = usePoker99()
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const handleStartClick = async (): Promise<void> => {
    await start().catch((e: Error) => setError(e.message))
  }
  const handleReadyClick = async (): Promise<void> => {
    await ready().catch((e: Error) => setError(e.message))
  }
  const handleAddLocalClick = async (): Promise<void> => {
    setName('')
    await addLocal(name).catch((e: Error) => setError(e.message))
  }
  const handleAddAiClick = async (): Promise<void> => {
    setName('')
    await addAi(name).catch((e: Error) => setError(e.message))
  }
  const displayPlayerType = {
    [PlayerType.NORMAL]: '',
    [PlayerType.LOCAL]: '(local)',
    [PlayerType.AI]: '(ai)'
  }
  return (
    <div>
      <div>Room: {room}</div>
      <div>
        {Object.entries(state.members).map(([id, name]) => (
          <div key={name}>
            {name} {displayPlayerType[playerType(name)]}
            {(id !== myId && isAdmin) &&
            <button onClick={async () => await kick(id)}>kick</button>
            }
            {(state.ready[id] ?? false) && '(ready)'}
          </div>)
        )}
      </div>
      <div>
        <button onClick={leave}>leave</button>
        {isAdmin
          ? <button onClick={handleStartClick}>start</button>
          : <button onClick={handleReadyClick}>ready</button>}
      </div>
      <div>
        <input
          placeholder='new local/ai player name'
          value={name}
          onChange={({ target: { value } }) => setName(value)}
        />
        <button onClick={handleAddLocalClick}>Add local</button>
        <button onClick={handleAddAiClick}>Add AI</button>
      </div>
      {error !== '' && <div>{error}</div>}
    </div>
  )
}
