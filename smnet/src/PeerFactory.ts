import Peer from 'peerjs'

export class PeerFactory {
  make (id?: string): Peer {
    const peerHostConfig = process.env.REACT_APP_PEER_HOST
    if (peerHostConfig === undefined) {
      return new Peer(id)
    } else {
      return new Peer(id, {
        host: process.env.REACT_APP_PEER_HOST ?? 'localhost',
        port: Number.parseInt(process.env.REACT_APP_PEER_PORT ?? '9000', 10),
        path: process.env.REACT_APP_PEER_PATH ?? '/peer',
        secure: process.env.REACT_APP_PEER_SECURE === 'true',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: JSON.parse(peerHostConfig)
      })
    }
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
