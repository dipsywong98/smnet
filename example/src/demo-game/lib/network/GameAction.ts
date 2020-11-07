import { NetworkAction } from 'smnet'

export type GameAction = ({
  type: GameActionTypes.RENAME
  payload: string
} | {
  type: GameActionTypes.MEMBER_LEFT
  payload: string
} | {
  type: GameActionTypes.HOST_LEFT
  payload: string
}) & NetworkAction

export enum GameActionTypes {
  MEMBER_LEFT = 'member-left',
  HOST_LEFT = 'host-left',
  RENAME = 0,
}
