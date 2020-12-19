import { NetworkAction } from 'smnet'
import { LobbyRoomInfo } from './LobbyRoomInfo'

export type LobbyAction = ({
  type: LobbyActionTypes.UPDATE_ROOM_INFO
  payload: Omit<LobbyRoomInfo, 'peerId'>
} | {
  type: LobbyActionTypes.MEMBER_JOIN
} | {
  type: LobbyActionTypes.MEMBER_LEFT
} | {
  type: LobbyActionTypes.HOST_LEFT
} | {
  type: LobbyActionTypes.REMOVE_ROOM
  payload: {
    roomNetworkName: string
  }
}) & NetworkAction

export enum LobbyActionTypes {
  MEMBER_JOIN = 'member-join',
  MEMBER_LEFT = 'member-left',
  HOST_LEFT = 'host-left',
  UPDATE_ROOM_INFO = 'update-room-info',
  REMOVE_ROOM = 'remove-room'
}
