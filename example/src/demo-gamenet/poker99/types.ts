import { Poker99State } from './Poker99State'
import { PlayCardPayload } from './Poker99Action'

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

export type IsCard = (card: Card) => boolean

export type PlayCard = (payload: PlayCardPayload, playerId: number) => StateMapper
