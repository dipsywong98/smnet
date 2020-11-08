import { NetworkReducer } from 'smnet'
import { GenericGameState } from './GenericGameState'
import { GameActionTypes, GenericGameAction } from './GenericGameAction'

const shuffle = <T> (a: T[]): T[] => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const withShuffleId: NetworkReducer<GenericGameState, GenericGameAction> = (prevState) => {
  const membersNames = shuffle(Object.values(prevState.members))
  const nameDict: Record<string, number> = {}
  membersNames.forEach((name, id) => {
    nameDict[name] = id
  })
  return { ...prevState, nameDict }
}

export const generalGameReducer: NetworkReducer<GenericGameState, GenericGameAction> = (prevState, action) => {
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
      if ((prevState.maxPlayer > 0 && Object.values(prevState.members).length >= prevState.maxPlayer) || prevState.started) {
        prevState.spectators[peerId] = true
      }
      return { ...prevState, members: { ...prevState.members, [peerId]: '' } }
    case GameActionTypes.RENAME:
      if (Object.values(prevState.members).includes(action.payload)) {
        throw new Error(`there is already someone named ${action.payload}`)
      }
      if (prevState.started && Object.keys(prevState.nameDict).includes(action.payload)) {
        const { [peerId]: _, ...spectators } = prevState.spectators
        prevState.spectators = spectators
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
      if (prevState.ready[peerId]) {
        const { [peerId]: _, ...ready } = prevState.ready
        return { ...prevState, ready }
      } else {
        return { ...prevState, ready: { ...prevState.ready, [peerId]: true } }
      }
    case GameActionTypes.START: {
      const who = Object.keys(prevState.members)
        .filter(id => id !== networkName)
        .filter(id => !prevState.spectators[id])
        .filter((id) => id !== undefined && !(prevState.ready[id] ?? false))
      if (who.length === 0) {
        return withShuffleId({ ...prevState, started: true }, action)
      } else {
        throw new Error(`${who.map(id => prevState.members[id]).join(',')} not ready yet`)
      }
    }
    default:
      return prevState
  }
}

export const withGenericGameReducer = (reducer: NetworkReducer<GenericGameState, GenericGameAction>): NetworkReducer<GenericGameState, GenericGameAction> => {
  return (prevState, action) => {
    return reducer(generalGameReducer(prevState, action), action)
  }
}
