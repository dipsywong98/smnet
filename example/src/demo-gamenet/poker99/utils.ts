import { Card, Suit } from './types'
import { cardPoints } from './constants'

export const minPossible = (current: number, cards: Card[]): number[] => {
  let min = Infinity
  let index = 0
  cards.forEach(({ suit, number }, k) => {
    let next = 0
    if (suit === Suit.SPADE && number === 1) {
      return [0, k]
    } else if (number === 10) {
      next = current - 10
    } else if (number === 12) {
      next = current - 20
    } else if (number === 13) {
      next = 99
    } else {
      next = current + cardPoints[number]
    }
    if (next < min) {
      min = next
      index = k
    }
  })
  return [min, index]
}
