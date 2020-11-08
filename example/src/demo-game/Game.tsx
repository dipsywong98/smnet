import React, { FunctionComponent } from 'react'
import { useGame } from './lib/network/useGame'

export const Game: FunctionComponent = () => {
  const { state } = useGame()
  return (<pre>
    {JSON.stringify(state, null, 2)}
  </pre>)
}
