import { NetworkAction, NetworkReducer } from 'smnet'
import { GenericGameState } from './GenericGameState'
import { GameActionTypes, GenericGameAction } from './GenericGameAction'
import { v4 } from 'uuid'

type StateMapper = (prevState: GenericGameState) => GenericGameState

export const compose: <T>(...func: Array<(t: T) => T>) => ((t: T) => T) = (...funcs) => t => {
  return funcs.reverse().reduce((p, func) => func(p), t)
}

export const shuffle = <T> (a: T[]): T[] => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const withMemberJoin: (peerId: string) => StateMapper = peerId => (prevState) => {
  if (peerId in prevState.members) {
    throw new Error(`peerId ${peerId} already joined this room`)
  }
  if ((prevState.maxPlayer > 0 && Object.values(prevState.members).length >= prevState.maxPlayer) || prevState.started) {
    prevState.spectators[peerId] = true
  }
  return { ...prevState, members: { ...prevState.members, [peerId]: '' } }
}

const withRename: (peerId: string, newName: string) => StateMapper = (peerId, newName) => (prevState) => {
  if (Object.values(prevState.members).includes(newName)) {
    throw new Error(`there is already someone named ${newName}`)
  }
  if (prevState.started && Object.keys(prevState.nameDict).includes(newName)) {
    const { [peerId]: _, ...spectators } = prevState.spectators
    prevState.spectators = spectators
  }
  return { ...prevState, members: { ...prevState.members, [peerId]: newName } }
}

const withUpdateLocalAndAi: (oldMasterId: string, newMasterId: string | undefined) => StateMapper = (oldMasterPeerId, newMasterId) => prevState => {
  const localPlayers: Record<string, string> = {}
  const aiPlayers: Record<string, string> = {}
  Object.entries(prevState.localPlayers).forEach(([fakePeerId, masterId]) => {
    if (masterId !== oldMasterPeerId) {
      localPlayers[fakePeerId] = masterId
    } else if (newMasterId !== undefined) {
      localPlayers[fakePeerId] = newMasterId
    }
  })
  Object.entries(prevState.aiPlayers).forEach(([fakePeerId, masterId]) => {
    if (masterId !== oldMasterPeerId) {
      aiPlayers[fakePeerId] = masterId
    } else if (newMasterId !== undefined) {
      aiPlayers[fakePeerId] = newMasterId
    }
  })
  return { ...prevState, localPlayers, aiPlayers }
}

const withRemovePlayer: (peerId: string) => StateMapper = (peerId) => prevState => {
  const { [peerId]: _1, ...members } = prevState.members
  const { [peerId]: _2, ...localPlayers } = prevState.localPlayers
  const { [peerId]: _3, ...aiPlayers } = prevState.aiPlayers
  return { ...prevState, members, localPlayers, aiPlayers }
}

const withToggleReady: (peerId: string) => StateMapper = (peerId) => prevState => {
  if (prevState.ready[peerId]) {
    const { [peerId]: _, ...ready } = prevState.ready
    return { ...prevState, ready }
  } else {
    return { ...prevState, ready: { ...prevState.ready, [peerId]: true } }
  }
}

const withShuffleId: StateMapper = (prevState) => {
  const players = shuffle(Object.entries(prevState.members).filter(([peerId]) => !prevState.spectators[peerId]).map(a => a[1]))
  if (players.length > prevState.maxPlayer) {
    throw new Error(`Too much players, max: ${prevState.maxPlayer}, got: ${players.length}`)
  }
  if (players.length < prevState.minPlayer) {
    throw new Error(`Not enough players, min: ${prevState.minPlayer}, got: ${players.length}`)
  }
  const nameDict: Record<string, number> = {}
  players.forEach((name, id) => {
    nameDict[name] = id
  })
  return { ...prevState, nameDict, players }
}

const withGameStart: (networkName: string) => StateMapper = (networkName) => prevState => {
  if (prevState.started) {
    throw new Error('Started already')
  }
  const who = Object.keys(prevState.members)
    .filter(id => id !== networkName)
    .filter(id => !prevState.spectators[id])
    .filter(id => prevState.localPlayers[id] === undefined)
    .filter(id => prevState.aiPlayers[id] === undefined)
    .filter((id) => id !== undefined && !(prevState.ready[id] ?? false))
  if (who.length === 0) {
    return withShuffleId({ ...prevState, started: true })
  } else {
    throw new Error(`${who.map(id => prevState.members[id]).join(',')} not ready yet`)
  }
}

const withAddAiPlayer: (name: string, masterPeerId: string) => StateMapper = (name, masterPeerId) => prevState => {
  const fakePeerId = `ai-${name}-${v4()}`
  const nextState = compose(
    withRename(fakePeerId, name),
    withMemberJoin(fakePeerId)
  )(prevState)
  return { ...nextState, aiPlayers: { ...nextState.aiPlayers, [fakePeerId]: masterPeerId } }
}

const withAddLocalPlayer: (name: string, masterPeerId: string) => StateMapper = (name, masterPeerId) => prevState => {
  const fakePeerId = `local-${name}-${v4()}`
  const nextState = compose(
    withRename(fakePeerId, name),
    withMemberJoin(fakePeerId)
  )(prevState)
  return { ...nextState, localPlayers: { ...nextState.localPlayers, [fakePeerId]: masterPeerId } }
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
      return withMemberJoin(peerId)(prevState)
    case GameActionTypes.RENAME:
      return withRename(peerId, action.payload)(prevState)
    case GameActionTypes.MEMBER_LEFT:
      return compose(
        withUpdateLocalAndAi(action.payload, networkName),
        withRemovePlayer(action.payload)
      )(prevState)
    case GameActionTypes.HOST_LEFT:
      return compose(
        withUpdateLocalAndAi(action.payload, networkName),
        withRename(networkName, prevState.members[action.payload]),
        withRemovePlayer(action.payload)
      )(prevState)
    case GameActionTypes.READY:
      return withToggleReady(peerId)(prevState)
    case GameActionTypes.START:
      return withGameStart(networkName)(prevState)
    case GameActionTypes.ADD_AI:
      return withAddAiPlayer(action.payload, peerId)(prevState)
    case GameActionTypes.ADD_LOCAL:
      return withAddLocalPlayer(action.payload, peerId)(prevState)
    case GameActionTypes.REMOVE_LOCAL_AI:
      return withRemovePlayer(action.payload)(prevState)
    default:
      return prevState
  }
}

export const withGenericGameReducer = <State extends GenericGameState, Action extends NetworkAction> (reducer: NetworkReducer<State, Action>): NetworkReducer<GenericGameState, NetworkAction> => {
  return (prevState, action) => {
    return reducer(generalGameReducer(prevState, action as GenericGameAction) as State, action as Action)
  }
}
