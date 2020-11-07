import { NetworkState } from 'smnet'

export class GameState implements NetworkState {
  [key: string]: unknown | undefined
  minPlayer = 1
  maxPlayer = 4
  networkName?: string
  members: { [peerId: string]: string | undefined } = {}
  ready: {[peerId: string]: boolean | undefined} = {}
}
