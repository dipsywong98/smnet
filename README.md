# smnet

> **S**tar**M**esh**N**etwork is a ~~redux like~~ decentralized peer to peer state management store

(If you want to make state safe multiplayer game/ room system, you may want to check [gamenet](//github.com/dipsywong98/smnet/tree/master/gamenet))

(Currently only have star network, but seems that is good enough already)

[gamenet(-material) demo](https://dipsywong98.github.io/poker99/)

[gamenet(-material) demo code](https://github.com/dipsywong98/poker99)

[smnet example](https://github.com/dipsywong98/smnet/tree/master/example)

## Install

```sh
# npm
npm i smnet

# yarn
yarn add smet
```

## Usage (anywhere)
```ts
import {Network} from 'smnet'
const network = new Network((prevState, action) => {
                                switch (action.type) {
                                  case 'set-foo':
                                    return { ...prevState, foo: (action.payload ?? '') as string }
                                  default:
                                    throw new Error('unknown action')
                                }
                              }, { foo: '' })
network.join('my-net').then(() => {
  console.log('connected')
  network.dispatch({type: 'set-foo', payload: 'bar'}).then(() => {
    console.log(network.state) // {foo: 'bar'}
  })
})
```

## Usage (React)
```tsx
import {useNetwork} from 'smnet'
const MyApp = () => {
  const network = useNetwork((prevState, action) => {
    switch (action.type) {
      case 'set-foo':
        return { ...prevState, foo: (action.payload ?? '') as string }
      default:
        throw new Error('unknown action')
    }
  }, { foo: '' })
  useEffect(() => {
    network.join('my-net').then(() => console.log('connected')).catch(console.error)
  }, [])
  return (
      <div>
        <input
          value={network.state.foo}
          onChange={({ target: { value } }) => {
            network.dispatch({ type: 'set-foo', payload: value }).catch(console.error)
          }}
        />
        <button
          onClick={(): void => {
            network.dispatch({ type: '' }).catch(console.error)
          }}>
          error
        </button>
      </div>
  )
}
```

## Some Notes before reading

In the following, I will call each `new Network()` instance as point,
which most probably just a browser tab.
(May construct multiple, but the logging will be a complete mess) 

## Methods
```ts
export interface UseNetworkReturn<State extends NetworkState, Action extends NetworkAction> {
  // state held by each point in the network,
  // smnet has ensured everypoint has the same state except during state update has network delay
  state: State

  // whether this point has join a network
  connected: boolean
 
  // name of the joined network, undefined if not joined yet
  networkName: string | undefined 
  
   // join the given network, supply a peerFactory for custom peerjs configuration,
   // promise resolves when successfully joined the network and obtained the state
  join: (networkName: string, peerFactory?: PeerFactory) => Promise<void>

  // leave the network, promise resolves when disconnected
  leave: () => Promise<void>

  // dispatch an action to the network state,
  // promise resolves when every point gets its state updated
  dispatch: (action: Action) => Promise<void>  

  // true when this point is the hosting point, false otherwise
  isAdmin: boolean

  // peerId of this point. hosting point has peerId same as networkName
  // please be aware that when the host gets disconnected,
  // one of the points will take up as the new host
  // myId of that point will change to networkName
  // (this is intended so other point can still reach to this network)
  myId?: string

  // kick other point having this peerId out of this network
  kick: (peerId: string) => Promise<void>
}
```

## State

Each point of the network saves a copy of state. `networkName` is the networkName of network,
undefined if this point has not joined any network.

```ts
interface NetworkState {
  networkName?: string

  [key: string]: unknown | undefined
}
```

You may extend your own and supply to the constructor of Network for better typing

```ts
interface MyState extends NetworkState {
  foo: string
}
const network = new Network<MyState>(myReducer, {foo: ''})
```

## Action

Action is just an object containing a type, payload and peerId,
or any other key value pair you defined.
The peerId is the peerId of the point that dispatched the action,
which will be injected automatically once you dispatch.

```ts
interface NetworkAction {
  peerId?: string

  [key: string]: unknown | undefined
}
```

You may extend your own and supply to the constructor of Network for better typing
```ts
type MyAction = ({
    type: 'set-foo',
    payload: string
} | {
    type: 'set-bar',
    payload: string
}) & NetworkAction
const network = new Network<MyState, MyAction>(myReducer, {foo: ''})

network.dispatch({
  type: 'set-foo',
  payload: 'bar'
}).then(() => {
  console.log('every point set bar successfully')
}).catch((e) => {
  console.log('the dispatch is unsuccessful, reason: ', e)
})
```

## Reducer

Reducer is the function mapping previous state and dispatched action to a new state.
You can throw error inside reducer to block this action or do any validation.

```ts
const myReducer: NetworkReducer<MyState, MyAction> = (prevState, action) => {
  switch(action.type){
    case 'set-foo':
      if (action.payload === 'error') {
        throw new Error('you cannot set foo to error')
      }
      return {...prevState, foo: action.payload}
    case 'set-bar':
      return {...prevState, bar: action.payload}
    default:
      return prevState
  }
}

const network = new Network<MyState, MyAction>(myReducer, {foo: ''})

await network.dispatch({
  type: 'set-foo',
  payload: 'bar'
})
console.log(network.state) // {foo: 'bar'}
await network.dispatch({
  type: 'set-foo',
  payload: 'error'
})  // throw you cannot set foo to error
```

## Auto dispatch
Some action will be automatically dispatched when some event happened,
so you can handle them directly using the network reducer

**Member Join**

dispatched by the new point when that point has connected to the network
(so you can get the new joiner)
```js
action = {
  type: 'member-join',
  peerId: 'peerId-of-the-new-joiner'
}
```

**Member Left**

dispatched by host when some non-host point has disconnected from the network
```js
action = {
  type: 'member-left',
  payload: 'peerId-of-the-member-left',
  peerId: 'network-name'
}
```

**Host Left**

dispatched by the new host when the host point has disconnected from the network
```js
action = {
  type: 'host-left',
  payload: 'old-peerId-of-the-new-host',
  peerId: 'network-name'
}
```

## Debugging

Unless you set environment variable `REACT_APP_DISABLE_SMNET_WINDOW_VAR=true`,
once you called `useNetwork`, you can access the network object using `window.network`,
and view its internal log by calling `window.smnetLog.printLogs()`.

If you set environment variable `REACT_APP_SMNET_VERBOSE_ALL_NO_HISTORY=true`,
it will log all activity of smnet immediately on console,
otherwise it will print only the warnings and errors, and store the rest in memory.

you can set the store and print level by

```ts
import {logger,LoggerLevel} from 'smnet'
logger.historyLevel = LoggerLevel.OFF
logger.verbLevel = LoggerLevel.OFF
logger.keep = 100 // keeping only latest 100 logs in history
```

## TODO

- [ ] better examples
- [x] gamenet
- [ ] calculate ping 
- [x] is connected
- [x] logs
- [ ] unit tests

