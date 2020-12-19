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
} | {
  type: GameActionTypes.REMOVE_LOCAL_AI
  payload: string
} | {
  type: GameActionTypes.SET_SHOW_IN_LOBBY
  payload: boolean
}) & NetworkAction

export enum GameActionTypes {
  MEMBER_JOIN = 'member-join',
  MEMBER_LEFT = 'member-left',
  HOST_LEFT = 'host-left',
  RENAME = 'rename',
  READY = 'ready',
  START = 'start',
  ADD_AI = 'add-ai',
  ADD_LOCAL = 'add-local',
  REMOVE_LOCAL_AI = 'remove-local-ai',
  SET_SHOW_IN_LOBBY = 'set-show-in-lobby'
}
