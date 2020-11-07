import { NetworkReducer } from 'smnet'
import { GameState } from './GameState'
import { GameAction, GameActionTypes } from './GameAction'

export const gameReducer: NetworkReducer<GameState, GameAction> = (prevState, action) => {
  const peerId = action.peerId
  if (peerId === undefined) {
    throw new Error('expect peerId in action')
  }
  switch (action.type) {
    case GameActionTypes.RENAME:
      return { ...prevState, members: { ...prevState.members, [peerId]: action.payload } }
    default:
      return prevState
  }
}
