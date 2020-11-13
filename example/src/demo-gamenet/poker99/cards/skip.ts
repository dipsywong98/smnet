import { Card, IsCard, PlayCard } from '../types'
import { withEndTurn, withIncrementTurn } from '../Poker99Reducer'

export const isSkipCard: IsCard = (card: Card): boolean => {
  return card.number === 11
}

export const skip: PlayCard = ({ card }) => state => {
  if (isSkipCard(card)) {
    return withEndTurn(withIncrementTurn(state))
  }
  return state
}
