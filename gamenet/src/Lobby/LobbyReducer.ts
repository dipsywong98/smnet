import { NetworkReducer } from 'smnet'
import { LobbyState } from './LobbyState'
import { LobbyAction, LobbyActionTypes } from './LobbyAction'
import { LobbyRoomInfo } from './LobbyRoomInfo'

const updateRoomInfo = (state: LobbyState, roomInfo: LobbyRoomInfo): LobbyState => {
  const find = Object.keys(roomInfo.members).length > 0 && state.rooms.find(room => room.roomNetworkName === roomInfo.roomNetworkName)
  if (!find) {
    return { ...state, rooms: [...state.rooms, roomInfo] }
  } else {
    return {
      ...state,
      rooms: state.rooms.map(room => room.roomNetworkName === roomInfo.roomNetworkName ? roomInfo : room)
    }
  }
}

export const lobbyReducer: NetworkReducer<LobbyState, LobbyAction> = (state, action) => {
  console.log('LOBBY ACTION')
  switch (action.type) {
    case LobbyActionTypes.UPDATE_ROOM_INFO:
      return updateRoomInfo(state, { ...action.payload, peerId: action.peerId! })
    case LobbyActionTypes.REMOVE_ROOM:
      return { ...state, rooms: state.rooms.filter(room => room.roomNetworkName !== action.payload.roomNetworkName) }
    case LobbyActionTypes.MEMBER_LEFT:
      console.log('MEMBER_LEFT',state.rooms, action.payload, action.peerId)
      return {...state, rooms: state.rooms.filter(room => room.peerId !== action.payload)}
    case LobbyActionTypes.HOST_LEFT:
      console.log('HOST_LEFT',state.rooms, action.payload, action.peerId)
      return {...state, rooms: state.rooms.filter(room => room.peerId !== action.peerId)}
    default:
      return state
  }
}
