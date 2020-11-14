import { GameActionTypes, GenericBoardGameAction } from 'gamenet'
import { Card } from './types'

export enum Poker99ActionType {
  PLAY_CARD,
  LOCAL_MOVE,
  END,
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
  type: Poker99ActionType.END
} | {
  type: GameActionTypes
  payload: never
}) & GenericBoardGameAction
