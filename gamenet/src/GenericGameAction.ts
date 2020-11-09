import { NetworkAction } from 'smnet'

export type GenericGameAction = ({
  type: GameActionTypes.RENAME
  payload: string
} | {
  type: GameActionTypes.MEMBER_LEFT
  payload: string
} | {
  type: GameActionTypes.HOST_LEFT
  payload: string
} | {
  type: GameActionTypes.READY
} | {
  type: GameActionTypes.START
} | {
  type: GameActionTypes.MEMBER_JOIN
} | {
  type: GameActionTypes.ADD_AI
  payload: string
} | {
  type: GameActionTypes.ADD_LOCAL
  payload: string
}) & NetworkAction

export enum GameActionTypes {
  MEMBER_JOIN = 'member-join',
  MEMBER_LEFT = 'member-left',
  HOST_LEFT = 'host-left',
  RENAME = 0,
  READY,
  START,
  ADD_AI,
  ADD_LOCAL,
}
