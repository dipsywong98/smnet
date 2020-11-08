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
   * name to in game id map
   */
  nameDict: { [name: string]: number } = {}
  /**
   * peerId in ready iff ready
   */
  ready: {[peerId: string]: true } = {}
  started = false
}
