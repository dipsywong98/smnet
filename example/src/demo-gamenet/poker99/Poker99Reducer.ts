import { NetworkReducer } from 'smnet'
import { Poker99State } from './Poker99State'
import { PlayCardPayload, Poker99Action, Poker99ActionType } from './Poker99Action'
import { Deck, PlayCard, StateMapper, Suit } from './types'
import { compose, GameActionTypes, shuffle } from 'gamenet'
import { maxCard } from './constants'
import { minPossible } from './utils'
import cloneDeep from 'clone-deep'
import { bomb } from './cards/bomb'
import { normal } from './cards/normal'
import { pm } from './cards/pm'
import { reverse } from './cards/reverse'
import { skip } from './cards/skip'
import { target } from './cards/target'
import { spade1 } from './cards/spade1'

const getFullDeck = (): Deck => {
  const deck: Deck = []
  for (let suit = 0; suit < 4; suit++) {
    for (let number = 1; number <= 13; number++) {
      deck.push({ suit, number })
    }
  }
  return deck
}

const withDrawCard: (playerId: number) => StateMapper = playerId => prevState => {
  if (prevState.playerDeck[playerId].length >= maxCard) {
    throw new Error(`cannot draw, ${prevState.players[playerId]} already has ${maxCard} cards`)
  }
  const card = prevState.drawDeck.shift()
  if (card === undefined) {
    return withDrawCard(playerId)({ ...prevState, drawDeck: shuffle(prevState.trashDeck), trashDeck: [] })
  } else {
    prevState.playerDeck[playerId].push(card)
    return { ...prevState }
  }
}

const withInitGame: StateMapper = (prevState: Poker99State) => {
  prevState = {
    ...prevState,
    drawDeck: [],
    trashDeck: [],
    playerDeck: [],
    points: 0,
    direction: 1,
    turn: 0,
    dead: {},
    logs: ['game started'],
    winner: undefined
  }
  prevState.drawDeck = shuffle(getFullDeck())
  for (let id = 0; id < prevState.players.length; id++) {
    prevState.playerDeck[id] = []
    for (let k = 0; k < maxCard; k++) {
      prevState = withDrawCard(id)(prevState)
    }
  }
  return { ...prevState }
}

const withDiscardCard: PlayCard = ({ card }, playerId) => state => {
  state.trashDeck.push(card)
  state.playerDeck[playerId] = state.playerDeck[playerId].filter(({ suit, number }) => !(suit === card.suit && number === card.number))
  return state
}

const withPlayCard: (playerId: number, payload: PlayCardPayload) => StateMapper = (playerId, payload) => prevState => {
  const { card } = payload
  const cardStr = `${Suit[card.suit]}${card.number}`
  if (prevState.playerDeck[playerId].find(({ suit, number }) => suit === card.suit && number === card.number) === undefined) {
    throw new Error(`${prevState.players[playerId]} doesnt own card ${cardStr}`)
  }
  if (prevState.turn !== playerId) {
    throw new Error('not your turn')
  }
  return compose(
    withDrawCard(playerId),
    ...[withDiscardCard, bomb, normal, pm, reverse, skip, target, spade1].map(playCard => playCard(payload, playerId))
  )(prevState)
}

export const withIncrementTurn: StateMapper = prevState => {
  const nextPlayerId = (prevState.turn + prevState.maxPlayer + prevState.direction) % prevState.maxPlayer
  return { ...prevState, turn: nextPlayerId }
}

export const withEndTurn: StateMapper = prevState => {
  if (!prevState.dead[prevState.turn] && minPossible(prevState.points, prevState.playerDeck[prevState.turn])[0] > 99) {
    prevState.logs.push(`${prevState.players[prevState.turn]} die, his card: ${prevState.playerDeck[prevState.turn].map(card => (
      `${Suit[card.suit]}${card.number}`)
    ).join(',')}`)
    prevState.dead[prevState.turn] = true
  }
  if (Object.keys(prevState.dead).length === prevState.players.length - 1 && prevState.started) {
    prevState.winner = [0, 1, 2, 3].filter(k => !prevState.dead[k])[0]
  }
  if (prevState.dead[prevState.turn]) {
    return withEndTurn(withIncrementTurn({ ...prevState, turn: prevState.turn }))
  } else {
    return { ...prevState, turn: prevState.turn }
  }
}

export const Poker99Reducer: NetworkReducer<Poker99State, Poker99Action> = (prevState, action) => {
  console.log('poker99 reducer')
  const peerId = action.peerId
  if (peerId === undefined) {
    throw new Error('Expect peerId in action')
  }
  const playerId = (): number => {
    const id = prevState.nameDict[prevState.members[peerId]]
    if (id === undefined) {
      throw new Error('game not started')
    }
    return id
  }
  switch (action.type) {
    case GameActionTypes.START:
      return withInitGame(prevState)
    case Poker99ActionType.PLAY_CARD:
      return withPlayCard(playerId(), action.payload)(cloneDeep(prevState))
    case Poker99ActionType.LOCAL_MOVE:
      return Poker99Reducer(prevState, action.payload)
    case Poker99ActionType.END:
      return { ...prevState, started: false }
  }
  return prevState
}
