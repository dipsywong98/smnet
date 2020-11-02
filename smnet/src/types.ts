import { DataConnection } from 'peerjs'

export type NetworkAction = Record<string, unknown>
export interface NetworkState{
  [key: string]: unknown | undefined
}

export interface PromiseHandler {
  resolve: (data?: never) => void
  reject: (error: string) => void
}

export enum PkgType {
  DISPATCH,
  ACK,
  NACK,
  PROMOTE,
  CANCEL,
  SET_STATE,

}

export type Pkg<State extends NetworkState, Action extends NetworkAction> = (
  { pkgType: PkgType.DISPATCH, data: Action }
  | { pkgType: PkgType.ACK, data: string }
  | { pkgType: PkgType.NACK, data: string }
  | { pkgType: PkgType.CANCEL, data: string }
  | { pkgType: PkgType.SET_STATE, data: NetworkState }
  | { pkgType: PkgType }) & { pid?: string, data: never }

export type NetworkReducer<State extends NetworkState, Action extends NetworkAction> = (prevState: State, action: Action) => State

export interface SendResponse<T> {
  conn: DataConnection
  data?: T
  error?: string
}
