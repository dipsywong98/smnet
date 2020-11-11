import React, { FunctionComponent, useState } from 'react'
import { v4 } from 'uuid'
import { usePoker99 } from './withPoker99Network'

export const Home: FunctionComponent = () => {
  const { connect } = usePoker99()
  const [name, setName] = useState(v4().substring(0, 4))
  const [room, setRoom] = useState('my-room')
  const [error, setError] = useState('')
  return (
    <div>
      <h1>Demo Game - Poker 99</h1>
      {error !== '' && <div>{error}</div>}
      <div>
        <label>your name: <input value={name} onChange={({ target: { value } }) => setName(value)}/></label>
      </div>
      <div>
        <label>room code: <input value={room} onChange={({ target: { value } }) => setRoom(value)}/></label>
      </div>
      <button
        disabled={name === '' || room === ''}
        onClick={async () => await connect(name, room).catch((error: Error) => setError(error.message))}>
        join
      </button>
    </div>
  )
}
