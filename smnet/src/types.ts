import { DataConnection } from 'peerjs'

export interface NetworkAction {
  peerId?: string

  [key: string]: unknown | undefined
}

export interface NetworkState {
  networkName?: string

  [key: string]: unknown | undefined
}

export interface PromiseHandler {
  resolve: (data?: never) => void
  reject: (error: string) => void
}

export enum PkgType {
  DISPATCH = 'DISPATCH',
  ACK = 'ACK',
  NACK = 'NACK',
  PROMOTE = 'PROMOTE',
  CANCEL = 'CANCEL',
  SET_STATE = 'SET_STATE',
  ASK_STATE = 'ASK_STATE',
  KICK = 'KICK',
}

export type Pkg<State extends NetworkState, Action extends NetworkAction> = (
  { pkgType: PkgType.DISPATCH, data: Action }
  | { pkgType: PkgType.ACK, data: string }
  | { pkgType: PkgType.NACK, data: string }
  | { pkgType: PkgType.CANCEL, data: string }
  | { pkgType: PkgType.SET_STATE, data: NetworkState }
  | { pkgType: PkgType.ASK_STATE }
  | { pkgType: PkgType.KICK, data: string }
  | { pkgType: PkgType }) & { pid?: string, data: never }

export type NetworkReducer<State extends NetworkState, Action extends NetworkAction> = (prevState: State, action: Action) => State

export interface SendResponse<T> {
  conn: DataConnection
  data?: T
  error?: string
}
