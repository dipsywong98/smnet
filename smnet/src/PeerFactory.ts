import Peer from 'peerjs'

export class PeerFactory {
  private readonly _options?: Peer.PeerJSOption
  constructor (options?: Peer.PeerJSOption) {
    if (options !== undefined) {
      this._options = options
    } else {
      const peerHostConfig = process.env.REACT_APP_PEER_CONFIG
      if (peerHostConfig === undefined) {
        this._options = undefined
      } else {
        console.log(peerHostConfig)
        this._options = {
          host: process.env.REACT_APP_PEER_HOST ?? 'localhost',
          port: Number.parseInt(process.env.REACT_APP_PEER_PORT ?? '9000', 10),
          path: process.env.REACT_APP_PEER_PATH ?? '/peer',
          secure: process.env.REACT_APP_PEER_SECURE === 'true',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          config: JSON.parse(peerHostConfig)
        }
      }
    }
  }

  make (id?: string): Peer {
    return new Peer(id, this._options)
  }

  async makeAndOpen (id?: string): Promise<Peer> {
    const peer = this.make(id)
    return await new Promise((resolve, reject) => {
      peer.on('open', () => {
        resolve(peer)
      })
      peer.on('error', () => {
        reject(peer)
      })
    })
  }
}
