import { Card, IsCard, PlayCard } from '../types'
import { withEndTurn, withIncrementTurn } from '../Poker99Reducer'

export const isReverseCard: IsCard = (card: Card): boolean => {
  return card.number === 4
}

export const reverse: PlayCard = ({ card }) => state => {
  if (isReverseCard(card)) {
    state.direction *= -1
    return withEndTurn(withIncrementTurn(state))
  }
  return state
}
