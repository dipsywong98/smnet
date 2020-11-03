import Peer, { DataConnection } from 'peerjs'
import { PkgType, PromiseHandler, SendResponse } from './types'
import { v4 } from 'uuid'
import { NotConnectedToPeerError } from './Errors'

export class DataStream {
  private connections: { [id: string]: DataConnection } = {}
  private sentPromises: { [id: string]: PromiseHandler } = {}

  public reset (): void {
    this.connections = {}
  }

  public registerConnection (conn: Peer.DataConnection): void {
    this.connections[conn.peer] = conn
  }

  public unregisterConnection (conn: Peer.DataConnection): void {
    const { [conn.peer]: a, ...rest } = this.connections
    this.connections = rest
  }

  public getConnections (): { [id: string]: DataConnection } {
    return this.connections
  }

  public async send<T, U = unknown> (id: string | DataConnection, pkgType: PkgType, data: T): Promise<SendResponse<U>> {
    const conn = this.getConn(id)
    return await new Promise((resolve, reject) => {
      const pid = v4()
      this.sentPromises[pid] = {
        resolve: (data?: never) => resolve({ conn, data }),
        reject: (error: string) => reject(new Error(error))
      }
      conn.send({ pid, pkgType, data })
    })
  }

  public sendACK (connId: string | DataConnection, pid: string|undefined, data: unknown): void {
    const conn = this.getConn(connId)
    conn.send({ pkgType: PkgType.ACK, pid, data })
  }

  public sendNACK (connId: string | DataConnection, pid: string|undefined, data: unknown): void {
    const conn = this.getConn(connId)
    conn.send({ pkgType: PkgType.NACK, pid, data })
  }

  public async broadcast<T, U = unknown> (pkgType: PkgType, data: T): Promise<Array<SendResponse<U>>> {
    const promises = Object.keys(this.connections).map(async id => await this.send<T, U>(id, pkgType, data))
    return await Promise.all(promises)
  }

  public receiveACK (pid: string | undefined, response: never): void {
    if (pid !== undefined && pid in this.sentPromises) {
      const { resolve } = this.sentPromises[pid]
      resolve(response)
      this.removeSentPromise(pid)
    }
  }

  public receiveNACK (pid: string | undefined, errorMessage: never): void {
    if (pid !== undefined && pid in this.sentPromises) {
      const { reject } = this.sentPromises[pid]
      reject(errorMessage)
      this.removeSentPromise(pid)
    }
  }

  private removeSentPromise (pid: string): void {
    const { [pid]: p, ...rest } = this.sentPromises
    this.sentPromises = rest
  }

  private getConn (id: string | DataConnection): DataConnection {
    if (typeof id === 'string') {
      const conn = this.connections[id]
      if (conn !== undefined) {
        return conn
      }
      throw new NotConnectedToPeerError(id)
    } else {
      return id
    }
  }
}
