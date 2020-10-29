export class AlreadyJoinedNetworkError extends Error {
  message = 'already joined network'
  name = 'AlreadyJoinedNetworkError'
}

export class PlayerNameAlreadyExistError extends Error {
  message = 'player name already exist'
  name = 'PlayerNameAlreadyExistError'
}

export class NotConnectedToPeerError extends Error {
  name = 'PlayerNameAlreadyExistError'

  constructor (id: string) {
    super()
    this.message = `not connected to ${id}`
  }
}

const NO_STAGING_STATE = 'No Staging State'
export class NoStagingStateError extends Error {
  message = NO_STAGING_STATE
  name = 'NoStagingStateError'
}

export class NetworkBusyError extends Error {
  message = 'Network is busy, please retry later'
  name = 'NetworkBusyError'
}
