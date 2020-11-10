import { Poker99State } from './Poker99State'

export enum Suit {
  SPADE,
  HEART,
  CLUB,
  DIAMOND
}

export interface Card {
  suit: Suit
  number: number
}

export type Deck = Card[]

export type StateMapper = (prevState: Poker99State) => Poker99State
