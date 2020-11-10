import React, { FunctionComponent } from 'react'
import { usePoker99 } from './withPoker99Network'

export const Game: FunctionComponent = () => {
  const { state } = usePoker99()
  return (<div>
    <pre>
      {JSON.stringify(state, null, 2)}
    </pre>
  </div>)
}
