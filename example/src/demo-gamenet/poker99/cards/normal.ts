import { Card, IsCard, PlayCard, Suit } from '../types'
import { cardPoints } from '../constants'
import { withEndTurn, withIncrementTurn } from '../Poker99Reducer'

export const isNormalCard: IsCard = (card: Card): boolean => {
  if (card.suit === Suit.SPADE && card.number === 1) {
    return false
  } else {
    return [1, 2, 3, 6, 7, 8, 9].includes(card.number)
  }
}

export const normal: PlayCard = ({ card }) => state => {
  if (isNormalCard(card)) {
    const points = state.points + cardPoints[card.number]
    if (points > 99) {
      throw new Error('playing this card will exceed 99')
    }
    return withEndTurn(withIncrementTurn({ ...state, points }))
  }
  return state
}
