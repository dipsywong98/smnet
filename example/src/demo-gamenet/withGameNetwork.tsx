import React, { FunctionComponent } from 'react'
import { GameNetworkProvider, GenericGameState } from 'gamenet'

export const withGameNetwork = (Component: FunctionComponent): FunctionComponent => {
  const WithGameNetwork: FunctionComponent = props => (
    <GameNetworkProvider reducer={(prevState) => prevState} initialState={new GenericGameState()}>
      <Component {...props} />
    </GameNetworkProvider>
  )
  WithGameNetwork.displayName = 'WithGameNetwork'
  return WithGameNetwork
}
