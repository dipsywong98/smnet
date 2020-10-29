import { Network } from './Network'
import { PeerFactory } from './PeerFactory'
import { FakePeer } from './fake/FakePeer'
import { FakeConn } from './fake/FakeConn'
import { pause } from './pause'
import { NetworkReducer } from './types'

interface NetworkState {
  foo: number
  [key: string]: unknown
}

interface Action {
  type: string
  payload: unknown
  [key: string]: unknown
}

type Actions = Action & {type: 'FOO', payload: string}

const peerFactory: PeerFactory = new PeerFactory()

jest.spyOn(peerFactory, 'makeAndOpen').mockImplementation(async id => {
  return await Promise.resolve(new FakePeer(id))
})

const initialStateFactory = (): NetworkState => ({
  foo: 1
})

const reducer: NetworkReducer<NetworkState, Actions> = (prevState, action) => {
  return prevState
}

beforeEach(() => {
  FakePeer.allPeers = {}
  FakeConn.allConns = {}
})

const initNetworkWithMembers = async ([networkName, ...connectionIds]: string[]): Promise<Network<NetworkState, Actions>> => {
  const network = new Network<NetworkState, Actions>(reducer, initialStateFactory)
  await network.join(networkName, peerFactory)
  connectionIds.forEach((id) => {
    const fakeConn = new FakeConn(id)
    FakePeer.allPeers[networkName].trigger('connection', fakeConn)
  })
  await pause(100)
  expect(network.getNeighbor()).toEqual([networkName, ...connectionIds])
  return network
}

it('initNetworkWithMembers', async () => {
  const network = await initNetworkWithMembers(['my-net', 'my-conn'])
  expect(FakePeer.allPeers['my-net']).toBeTruthy()
  expect(FakeConn.allConns['my-conn']).toBeTruthy()
  expect(network.getNeighbor()).toEqual(['my-net', 'my-conn'])
})

describe('Network', () => {
  it('can construct', () => {
    expect(new Network<NetworkState, Actions>(reducer, initialStateFactory)).toBeTruthy()
  })

  it('can join network', async () => {
    const network = new Network<NetworkState, Actions>(reducer, initialStateFactory)
    await network.join('my-net', peerFactory)
    expect(network.getNeighbor()).toEqual(['my-net'])
  })

  it('can accept incoming connection', async () => {
    const network = new Network<NetworkState, Actions>(reducer, initialStateFactory)
    await network.join('my-net', peerFactory)
    expect(network.getNeighbor()).toEqual(['my-net'])
    FakePeer.allPeers['my-net'].trigger('connection', new FakeConn('someId'))
    await pause(100)
    expect(network.getNeighbor()).toEqual(['my-net', 'someId'])
  })

  it('can detect disconnection', async () => {
    const network = new Network<NetworkState, Actions>(reducer, initialStateFactory)
    await network.join('my-net', peerFactory)
    expect(network.getNeighbor()).toEqual(['my-net'])
    const fakeConn = new FakeConn('someId')
    FakePeer.allPeers['my-net'].trigger('connection', fakeConn)
    await pause(100)
    expect(network.getNeighbor()).toEqual(['my-net', 'someId'])
    fakeConn.trigger('close')
    await pause(100)
    expect(network.getNeighbor()).toEqual(['my-net'])
  })

  it('can join existing network', async () => {
    const peerFactory = new PeerFactory()
    jest.spyOn(peerFactory, 'makeAndOpen').mockRejectedValueOnce('error')
    const fakePeer = new FakePeer('some-id')
    const fakeConn = new FakeConn('my-net')
    jest.spyOn(peerFactory, 'makeAndOpen').mockResolvedValueOnce(fakePeer)
    jest.spyOn(fakePeer, 'connect').mockReturnValue(fakeConn)
    const network = new Network(reducer, initialStateFactory)
    await network.join('my-net', peerFactory)
    expect(network.getNeighbor()).toEqual(['some-id', 'my-net'])
  })
})
