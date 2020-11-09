import { NetworkState } from 'smnet'

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
   * local players, key: local-<name>, value is the peerId that control this local player
   */
  localPlayers: { [fakePeerId: string]: string } = {}
  /**
   * ai players, key: ai-<name>, value is the peerId that control this ai player
   */
  aiPlayers: { [fakePeerId: string]: string } = {}
  /**
   * name to in game id map
   */
  nameDict: { [name: string]: number } = {}
  /**
   * peerId in ready iff ready
   */
  ready: { [peerId: string]: true } = {}
  started = false
}
