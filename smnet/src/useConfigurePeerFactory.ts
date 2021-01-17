import { PeerFactory } from './PeerFactory'
import { createContext, useContext } from 'react'
import Peer from 'peerjs'

class PeerFactoryContext {
  factory = new PeerFactory()
  setFactory = (options: Peer.PeerJSOption) => {
    this.factory = new PeerFactory(options)
  }
}

const peerFactoryContext = createContext(new PeerFactoryContext())

export const useConfigurePeerFactory = (options: Peer.PeerJSOption): void => {
  const { setFactory } = useContext(peerFactoryContext)
  setFactory(options)
}

export const usePeerFactory = (): PeerFactory => useContext(peerFactoryContext).factory
