import { GameActionTypes, GenericGameAction } from 'gamenet'
import { Card } from './types'
import { NetworkAction } from 'smnet'

export enum Poker99ActionType {
  PLAY_CARD,
  LOCAL_MOVE,
}

export interface PlayCardPayload {
  card: Card
  increase?: boolean
  target?: number
}

export type Poker99Action = ({
  type: Poker99ActionType.PLAY_CARD
  payload: PlayCardPayload
} | {
  type: Poker99ActionType.LOCAL_MOVE
  payload: Poker99Action
} | {
  type: GameActionTypes
  payload: never
} | GenericGameAction) & NetworkAction
