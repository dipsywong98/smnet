import { NetworkState } from 'smnet'
import { LobbyRoomInfo } from './LobbyRoomInfo'

export class LobbyState implements NetworkState {
  [key: string]: unknown | undefined

  rooms: LobbyRoomInfo[] = []
}
