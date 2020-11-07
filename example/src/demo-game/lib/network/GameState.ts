import { NetworkState } from 'smnet'

export class GameState implements NetworkState {
  [key: string]: unknown | undefined
  members: { [peerId: string]: string | undefined } = {}
  ready: {[peerId: string]: boolean | undefined} = {}
}
