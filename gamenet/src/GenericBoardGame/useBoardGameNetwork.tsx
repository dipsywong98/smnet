import { NetworkAction, NetworkReducer } from 'smnet'
import { GenericBoardGameState } from './GenericBoardGameState'
import { GenericBoardGameAction } from './GenericBoardGameAction'
import { GameContextInterface, GameNetworkProps, useGameNetwork } from '../Generic/useGameNetwork'
import { withGenericBoardGameReducer } from './withGenericBoardGameReducer'
import { useEffect, useRef, useState } from 'react'

export interface BoardGameContextInterface<State extends GenericBoardGameState, Action extends NetworkAction> extends GameContextInterface<State, Action> {
  hideDeck: boolean
  setHideDeck: (flag: boolean) => void
  renderedDeckId: number
  error: string
  setError: (message: string) => void
}

type AiAction<State extends GenericBoardGameState, Action extends NetworkAction> = (state: State, turn: number) => Action

export interface BoardGameNetworkProps<State extends GenericBoardGameState, Action extends GenericBoardGameAction> extends GameNetworkProps<State, Action> {
  aiAction: AiAction<State, Action>
}

export const useBoardGameNetwork = <State extends GenericBoardGameState, Action extends NetworkAction> (reducer: NetworkReducer<State, Action>, initialState: State, aiAction?: AiAction<State, Action>): BoardGameContextInterface<State, Action> => {
  const network = useGameNetwork(withGenericBoardGameReducer(reducer), initialState)
  const { myLocals, myPlayerId, myAis, dispatchAs } = network
  const state = network.state as State
  const [error, setError] = useState('')
  let [hideDeck, setHideDeck] = useState(myLocals.length > 0)
  const [renderedDeckId, setRenderedDeckId] = useState(myPlayerId)
  const prevTurn = useRef(-1)
  if (state.turn !== prevTurn.current) {
    if (myLocals.length > 0) {
      hideDeck = true
      setHideDeck(true)
      setRenderedDeckId(state.turn)
    }
    prevTurn.current = state.turn
  }
  const handleError = (e: Error): void => {
    setError(e.message)
  }
  useEffect(() => {
    if (aiAction !== undefined && myAis.includes(state.players[state.turn]) && state.started && state.winner === null) {
      const cb = (): void => {
        const action = aiAction(state, state.turn)
        // action.peerId = Object.keys(state.members).filter(peerId => state.members[peerId] === state.players[state.turn])[0]
        dispatchAs(state.turn, action).catch(handleError)
      }
      const n = window.setTimeout(cb, 500)
      return () => {
        window.clearTimeout(n)
      }
    }
  }, [state])
  return {
    ...network,
    state,
    hideDeck,
    setHideDeck,
    error,
    setError,
    renderedDeckId
  }
}
