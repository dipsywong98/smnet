import { NetworkReducer } from 'smnet'
import { GameState } from './GameState'
import { GameAction, GameActionTypes } from './GameAction'

export const gameReducer: NetworkReducer<GameState, GameAction> = (prevState, action) => {
  const peerId = action.peerId
  if (peerId === undefined) {
    throw new Error('expect peerId in action')
  }
  const networkName = prevState.networkName
  if (networkName === undefined) {
    throw new Error('expect networkName in prevState')
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
      members[networkName] = prevState.members[action.payload]
      return { ...prevState, members }
    }
    case GameActionTypes.READY:
      if (prevState.ready[peerId] === true) {
        const { [peerId]: _, ...ready } = prevState.ready
        return { ...prevState, ready }
      } else {
        return { ...prevState, ready: { ...prevState.ready, [peerId]: true } }
      }
    case GameActionTypes.START: {
      const who = Object.keys(prevState.members).filter(id => id !== networkName).filter((id) => id !== undefined && !(prevState.ready[id] ?? false))
      if (who.length === 0) {
        return { ...prevState, started: true }
      } else {
        throw new Error(`${who.map(id => prevState.members[id]).join(',')} not ready yet`)
      }
    }
    default:
      return prevState
  }
}
