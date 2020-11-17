import React, { FunctionComponent, ReactNode, useState } from 'react'
import { usePoker99 } from './withPoker99Network'
import { Card, Suit } from './poker99/types'
import { Poker99Action, Poker99ActionType } from './poker99/Poker99Action'

export const Game: FunctionComponent = () => {
  const {
    state,
    dispatch,
    dispatchAs,
    myPlayerId,
    myLocals,
    hideDeck,
    setHideDeck,
    error,
    setError,
    renderedDeckId
  } = usePoker99()
  const [target, setTarget] = useState(0)
  const [increment, setIncrement] = useState(true)
  const d = state.direction === 1 ? '>' : '<'
  const handleError = (e: Error): void => {
    setError(e.message)
  }
  const clickCard = (card: Card) => async () => {
    const action: Poker99Action = {
      type: Poker99ActionType.PLAY_CARD,
      payload: {
        card,
        increase: increment,
        target
      }
    }
    if (state.turn === myPlayerId) {
      await dispatch(action).then(() => setError('')).catch(handleError)
    } else if (myLocals.includes(state.players[state.turn])) {
      await dispatchAs(state.turn, action).then(() => setError('')).catch(handleError)
    }
  }
  const renderDeck = (playerId: number): ReactNode => state.playerDeck[playerId]?.map(card => (
    <button key={card.number * 10 + card.suit} onClick={clickCard(card)}>
      {Suit[card.suit]} {card.number}
    </button>
  ))
  const renderLocalDeck = (): ReactNode => {
    return hideDeck ? <button onClick={() => setHideDeck(false)}>show {state.players[renderedDeckId]}</button>
      : renderDeck(renderedDeckId)
  }
  const again = async (): Promise<void> => {
    await dispatch({
      type: Poker99ActionType.END
    }).catch(handleError)
  }
  return (
    <div style={{ pointerEvents: 'all' }}>
      <div>
        <h3>{state.points}</h3>
        <h6>{state.players[state.turn]}{'\''}s turn</h6>
        {error !== '' && <div style={{ color: 'red' }}>{error}</div>}
        {state.winner !== undefined && state.winner !== null && <div>winner is {state.players[state.winner]}
          <button onClick={again}>again</button>
        </div>}
        {state.players.map((name, id) => (
          <span
            key={name}
            onClick={() => setTarget(id)}
            style={{
              fontWeight: state.turn === id ? 'bold' : 'normal',
              textDecorationLine: state.dead[id] ? 'line-through' : 'none'
            }}>
          {name} {d}
        </span>
        ))}
        <div>
          {
            myLocals.length === 0
              ? renderDeck(myPlayerId)
              : renderLocalDeck()
          }
        </div>
        <div>
          target: {target}
        </div>
        <button onClick={() => setIncrement(!increment)}>
          {increment ? '+' : '-'}
        </button>
      </div>
      <div>
        {state.logs.slice().reverse().map((s, k) => <div key={k}>{s}</div>)}
      </div>
    </div>
  )
}
