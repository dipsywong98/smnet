import React, { FunctionComponent, useMemo, useState } from 'react'
import { usePoker99 } from './withPoker99Network'
import { Card, Suit } from './poker99/types'
import { Poker99ActionType } from './poker99/Poker99Action'

export const Game: FunctionComponent = () => {
  const { state, myId, dispatch } = usePoker99()
  const [target, setTarget] = useState(0)
  const [increment, setIncrement] = useState(true)
  const myPlayerId = useMemo(() => {
    try {
      return state.nameDict[state.members[myId as string]]
    } catch (e) {
      return 0
    }
  }, [myId, state])
  const d = state.direction === 1 ? '>' : '<'
  const clickCard = (card: Card) => async () => {
    await dispatch({
      type: Poker99ActionType.PLAY_CARD,
      payload: {
        card,
        increase: increment,
        target
      }
    })
  }
  return (<div>
    <div>
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
          state.playerDeck[myPlayerId]?.map(card => (
            <button key={card.number * 10 + card.suit} onClick={clickCard(card)}>
              {Suit[card.suit]} {card.number}
            </button>
          ))
        }
      </div>
      <div>
        target: {target}
      </div>
      <button onClick={() => setIncrement(!increment)}>
        {increment ? '+' : '-'}
      </button>
    </div>
    <pre>
      {JSON.stringify(state, null, 2)}
    </pre>
  </div>)
}
