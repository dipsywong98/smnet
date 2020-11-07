import { NetworkReducer } from 'smnet'
import { GameState } from './GameState'
import { GameAction, GameActionTypes } from './GameAction'

export const gameReducer: NetworkReducer<GameState, GameAction> = (prevState, action) => {
  const peerId = action.peerId
  if (peerId === undefined) {
    throw new Error('expect peerId in action')
  }
  switch (action.type) {
    case GameActionTypes.MEMBER_JOIN:
      if (Object.values(prevState.members).length >= prevState.maxPlayer) {
        throw new Error(`room reached maximum number of players which is ${prevState.maxPlayer}`)
      }
      return { ...prevState, members: { ...prevState.members, [peerId]: '' } }
    case GameActionTypes.RENAME:
      if (Object.values(prevState.members).includes(action.payload)) {
        throw new Error(`there is already someone named ${action.payload}`)
      }
      return { ...prevState, members: { ...prevState.members, [peerId]: action.payload } }
    case GameActionTypes.MEMBER_LEFT: {
      const { [action.payload]: _, ...members } = prevState.members
      return { ...prevState, members }
    }
    case GameActionTypes.HOST_LEFT: {
      const { [action.payload]: _, ...members } = prevState.members
      if (prevState.networkName !== undefined) {
        members[prevState.networkName] = prevState.members[action.payload]
      }
      return { ...prevState, members }
    }
    default:
      return prevState
  }
}
