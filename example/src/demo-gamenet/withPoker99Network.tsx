import React, { createContext, FunctionComponent, useContext } from 'react'
import { GameContextInterface, useGameNetwork } from 'gamenet'
import { Poker99State } from './poker99/Poker99State'
import { Poker99Reducer } from './poker99/Poker99Reducer'
import { Poker99Action } from './poker99/Poker99Action'

const Poker99Context = createContext<GameContextInterface<Poker99State, Poker99Action> | null>(null)

export const withPoker99Network = (Component: FunctionComponent): FunctionComponent => {
  const WithGameNetwork: FunctionComponent = props => {
    const network = useGameNetwork(Poker99Reducer, new Poker99State()) as GameContextInterface<Poker99State, Poker99Action>
    return (
      <Poker99Context.Provider value={network}>
        <Component {...props} />
      </Poker99Context.Provider>
    )
  }
  WithGameNetwork.displayName = 'WithGameNetwork'
  return WithGameNetwork
}

export const usePoker99 = (): GameContextInterface<Poker99State, Poker99Action> => {
  const network: GameContextInterface<Poker99State, Poker99Action> | null = useContext(Poker99Context)
  if (network === null) {
    throw new Error('please wrap it using withPoker99Network before calling this hook')
  }
  return network
}
