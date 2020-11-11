import { NetworkReducer } from 'smnet'
import { Poker99State } from './Poker99State'
import { PlayCardPayload, Poker99Action, Poker99ActionType } from './Poker99Action'
import { Deck, StateMapper, Suit } from './types'
import { GameActionTypes, shuffle } from 'gamenet'
import { cardAmount, maxCard } from './constants'
import { minPossible } from './utils'
import cloneDeep from 'clone-deep'

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

const withPlayCard: (playerId: number, payload: PlayCardPayload) => StateMapper = (playerId, payload) => prevState => {
  const { card } = payload
  const cardStr = `${Suit[card.suit]}${card.number}`
  if (prevState.playerDeck[playerId].find(({ suit, number }) => suit === card.suit && number === card.number) === undefined) {
    throw new Error(`${prevState.players[playerId]} doesnt own card ${cardStr}`)
  }
  if (prevState.turn !== playerId) {
    throw new Error('not your turn')
  }
  let sign = 1
  let amount = cardAmount[card.number]
  if (card.number === 10 || card.number === 12) {
    if (payload.increase === undefined) {
      throw new Error('card with number 10 or 12 require increase in payload')
    }
    sign = payload.increase ? 1 : -1
  } else if (card.number === 13) {
    amount = 99 - prevState.points
  } else if (card.number === 1 && card.suit === Suit.SPADE) {
    sign = -1
    amount = prevState.points - 1
  }
  prevState.points += sign * amount
  if (prevState.points > 99) {
    throw new Error('playing this card will exceed 99')
  }
  prevState.playerDeck[playerId] = prevState.playerDeck[playerId].filter(({ suit, number }) => !(suit === card.suit && number === card.number))
  prevState.trashDeck.push(card)
  prevState = withDrawCard(playerId)(prevState)
  if (card.number === 5) {
    if (payload.target === undefined) {
      throw new Error('Card with number 5 require target in payload')
    }
    if (payload.target === playerId) {
      throw new Error('Target cannot be myself')
    }
    if (prevState.dead[payload.target]) {
      throw new Error('cannot target on dead body')
    }
    prevState.logs.push(`${prevState.players[prevState.turn]} played ${cardStr}, targeted ${prevState.players[payload.target]}`)
    prevState.turn = payload.target
    return withBeforeNextTurn(prevState)
  } else if (card.number === 4) {
    prevState.direction *= -1
    prevState.logs.push(`${prevState.players[prevState.turn]} played ${cardStr}, direction reversed`)
  } else {
    prevState.logs.push(`${prevState.players[prevState.turn]} played ${cardStr}, add ${sign * amount}, now ${prevState.points} points`)
  }
  return withBeforeNextTurn(withIncrementTurn(prevState))
}

const withIncrementTurn: StateMapper = prevState => {
  const nextPlayerId = (prevState.turn + prevState.maxPlayer + prevState.direction) % prevState.maxPlayer
  return { ...prevState, turn: nextPlayerId }
}

const withBeforeNextTurn: StateMapper = prevState => {
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
    return withBeforeNextTurn(withIncrementTurn({ ...prevState, turn: prevState.turn }))
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
