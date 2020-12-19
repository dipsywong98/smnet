import { NetworkState } from 'smnet'

export enum PlayerType {
  NORMAL,
  LOCAL,
  AI
}

export class GenericGameState implements NetworkState {
  [key: string]: unknown | undefined

  minPlayer = 1
  maxPlayer = 4
  networkName?: string
  /**
   * all connected members and their names
   */
  members: { [peerId: string]: string } = {}
  /**
   * peerId in this dict iff not playing
   */
  spectators: { [peerId: string]: true } = {}
  /**
   * local players, key: display name, value is the peerId that control this local player
   */
  localPlayers: { [name: string]: string } = {}
  /**
   * ai players, key: display name, value is the peerId that control this ai player
   */
  aiPlayers: { [name: string]: string } = {}
  /**
   * name to in game id map
   */
  nameDict: { [name: string]: number } = {}
  /**
   * in game id to name map
   */
  players: string[] = []
  /**
   * peerId in ready iff ready
   */
  ready: { [peerId: string]: true } = {}
  /**
   * whether should this room show in lobby, you should handle this yourself when using lobby
   */
  showInLobby: boolean | null = null
  started = false
}
