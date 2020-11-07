import { NetworkAction } from 'smnet'

export type GameAction = ({
  type: GameActionTypes.RENAME
  payload: string
}) & NetworkAction

export enum GameActionTypes {
  RENAME
}
