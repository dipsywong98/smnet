import { GenericGameState } from 'gamenet'

enum Suit {
  SPADE,
  HEART,
  CLUB,
  DIAMOND
}

interface Card {
  suit: Suit
  number: number
}

type Deck = Card[]

const getFullDeck = (): Deck => {
  const deck: Deck = []
  for (let suit = 0; suit < 4; suit++) {
    for (let number = 1; number <= 13; number++) {
      deck.push({ suit, number })
    }
  }
  return deck
}

export class Poker99State extends GenericGameState {
  maxPlayer = 4
  minPlayer = 4
  drawDeck: Deck = []
  trashDeck: Deck = []
  playerDeck: Deck[] = []
  turn = 0
  direction = 1
  points = 0
}
