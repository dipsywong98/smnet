import { Card, IsCard, PlayCard } from '../types'
import { withEndTurn, withIncrementTurn } from '../Poker99Reducer'

export const isBombCard: IsCard = (card: Card): boolean => {
  return card.number === 13
}

export const bomb: PlayCard = ({ card }) => state => {
  if (isBombCard(card)) {
    state.points = 99
    return withEndTurn(withIncrementTurn(state))
  }
  return state
}
