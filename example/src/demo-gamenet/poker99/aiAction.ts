import { Poker99State } from './Poker99State'
import { Poker99Action, Poker99ActionType } from './Poker99Action'
import { Card } from './types'
import { cardPoints } from './constants'
import { shuffle } from 'gamenet'
import { isNormalCard } from './cards/normal'
import { isPmCard } from './cards/pm'

const isSkippingCard = (card: Card): boolean => {
  return [4, 5, 11, 13].includes(card.number)
}

export const aiAction = (state: Poker99State, turn: number): Poker99Action => {
  const cards = state.playerDeck[turn]
  const points = state.points
  const normalCards = cards.filter(isNormalCard).sort((a, b) => cardPoints[b.number] - cardPoints[a.number])
  console.log('normal cards', normalCards, 'points', points)
  const card13 = cards.find(c => c.number === 13)
  if (card13 !== undefined) {
    if (points !== 99 && normalCards.length < 3) {
      return {
        type: Poker99ActionType.PLAY_CARD,
        payload: {
          card: card13
        }
      }
    }
  }

  for (const card of normalCards) {
    console.log('should play normal?', card, points + cardPoints[card.number] <= 99)
    if (points + cardPoints[card.number] <= 99) {
      return ({
        type: Poker99ActionType.PLAY_CARD,
        payload: {
          card
        }
      })
    }
  }
  const pmCards = cards.filter(isPmCard)
  for (const card of pmCards.sort((a, b) => b.number - a.number)) {
    if (points + cardPoints[card.number] <= 99) {
      return ({
        type: Poker99ActionType.PLAY_CARD,
        payload: {
          card,
          increase: true
        }
      })
    }
  }
  {
    const card = cards.find(isSkippingCard)
    if (card !== undefined) {
      return {
        type: Poker99ActionType.PLAY_CARD,
        payload: {
          card,
          target: state.nameDict[shuffle(state.players.filter((name, id) => !state.dead[id] && id !== turn))[0]]
        }
      }
    }
  }
  for (const card of pmCards.sort((a, b) => a.number - b.number)) {
    if (points - cardPoints[card.number] <= 99) {
      return ({
        type: Poker99ActionType.PLAY_CARD,
        payload: {
          card,
          increase: false
        }
      })
    }
  }
  for (const card of cards) {
    if (points - cardPoints[card.number] <= 99) {
      return ({
        type: Poker99ActionType.PLAY_CARD,
        payload: {
          card,
          increase: false
        }
      })
    }
  }
  throw new Error('reached an edge case')
}
