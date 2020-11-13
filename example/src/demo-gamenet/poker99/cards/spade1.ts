import { Card, IsCard, PlayCard, Suit } from '../types'
import { withEndTurn, withIncrementTurn } from '../Poker99Reducer'

export const isSpade1Card: IsCard = (card: Card): boolean => {
  return card.number === 1 && card.suit === Suit.SPADE
}

export const spade1: PlayCard = ({ card }) => state => {
  if (isSpade1Card(card)) {
    state.points = 1
    return withEndTurn(withIncrementTurn(state))
  }
  return state
}
