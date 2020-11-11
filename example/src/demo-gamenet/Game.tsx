import React, { FunctionComponent, ReactNode, useMemo, useRef, useState } from 'react'
import { usePoker99 } from './withPoker99Network'
import { Card, Suit } from './poker99/types'
import { Poker99Action, Poker99ActionType } from './poker99/Poker99Action'

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
  const myLocals = useMemo(() => {
    try {
      return Object.keys(state.localPlayers).filter(name => state.localPlayers[name] === myId).map(peerId => state.members[peerId])
    } catch (e) {
      return []
    }
  }, [myId, state])
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
  const d = state.direction === 1 ? '>' : '<'
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
      await dispatch(action).catch(console.error)
    } else if (myLocals.includes(state.players[state.turn])) {
      action.peerId = Object.keys(state.members).filter(peerId => state.members[peerId] === state.players[state.turn])[0]
      await dispatch({
        type: Poker99ActionType.LOCAL_MOVE,
        payload: action
      }).catch(console.error)
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
    }).catch(console.error)
  }
  return (<div>
    <div>
      <h3>{state.points}</h3>
      <h6>{state.players[state.turn]}{"'"}s turn</h6>
      {state.winner !== undefined && <div>winner is {state.winner}<button onClick={again}>again</button></div>}
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
    <pre>
      {JSON.stringify(state, null, 2)}
    </pre>
  </div>)
}
