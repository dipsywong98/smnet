export interface HomeI18n {
  welcome?: string,
  welcomeTo$gameName?: string,
  join: string,
  yourName: string,
  roomCode: string,
  info: string
}

export interface RoomI18n {
  room: string
  players: string
  leave: string
  start: string
  host: string
  nameForNewHotSeatPlayer: string
  cancel: string
  create: string
  name: string
  ready: string
  hotSeatPlayer: string
  aiPlayer: string
  addHotSeatPlayer: string
  addAiPlayer: string
  spectator: string
  playerReady: string
  playerNotReady: string
  unready: string
  $nameIsHost: string
  $nameIsSpectator: string
  $nameIsLocalPlayerOf$owner: string
  $nameIsAiPlayerOf$owner: string
  $nameIsNotReadyYet: string
  $nameIsReady: string
  showInLobby: string
}

interface CommonI18n {
  langName: string
}

export type GamenetI18n<T extends Record<string, unknown> = {}> = HomeI18n & RoomI18n & CommonI18n & T
