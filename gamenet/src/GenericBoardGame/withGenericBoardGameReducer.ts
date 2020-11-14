import { NetworkReducer } from 'smnet'
import { GenericBoardGameState } from './GenericBoardGameState'
import { GenericBoardGameAction } from './GenericBoardGameAction'

export const generalBoardGameReducer: NetworkReducer<GenericBoardGameState, GenericBoardGameAction> = (prevState) => {
  return prevState
}

export const withGenericBoardGameReducer = <State extends GenericBoardGameState, Action extends GenericBoardGameAction> (reducer: NetworkReducer<State, Action>): NetworkReducer<GenericBoardGameState, GenericBoardGameAction> => {
  return (prevState, action) => {
    return reducer(generalBoardGameReducer(prevState, action) as State, action as Action)
  }
}
