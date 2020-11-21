import { NetworkAction, NetworkReducer } from 'smnet'
import { GenericBoardGameState } from './GenericBoardGameState'

export const generalBoardGameReducer: NetworkReducer<GenericBoardGameState, NetworkAction> = (prevState) => {
  return prevState
}

export const withGenericBoardGameReducer = <State extends GenericBoardGameState, Action extends NetworkAction> (reducer: NetworkReducer<State, Action>): NetworkReducer<GenericBoardGameState, NetworkAction> => {
  return (prevState, action) => {
    return reducer(generalBoardGameReducer(prevState, action) as State, action as Action)
  }
}
