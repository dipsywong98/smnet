import React, { FunctionComponent } from 'react'
import { useGameNetwork } from 'gamenet'

export const Game: FunctionComponent = () => {
  const { state } = useGameNetwork()
  return (<div>
    <pre>
      {JSON.stringify(state, null, 2)}
    </pre>
  </div>)
}
