import { GenericGameAction } from 'gamenet'

export enum Poker99ActionType {
  PLAY_CARD
}

export type Poker99Action = ({
  type: Poker99ActionType.PLAY_CARD
}) & GenericGameAction
