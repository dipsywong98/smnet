# gamenet

> GameNetwork is a decentralized peer to peer state management store for making state save multiplayer game based on smnet.

## Install

```sh
# npm
npm i gamenet

# yarn
yarn add gamenet
```

## Usage-Anywhere
TBA

## Usage-React

```tsx
import {GenericGameState, useGameNetwork} from 'gamenet'

//...
const App = () => {
<GameNetworkProvider reducer={myReducer} initialState={new GenericGameState() /* or something extends this*/}>
  {/* your game GUI or room */}
  <SomeComponent/>
</GameNetworkProvider>
}

//...
const SomeComponent = () => {
  const { room, state, leave, isAdmin, myId, kick, ready, start } = useGameNetwork()
// ...
}
```


## API
```ts
interface UseGameNetwork {
  // join the room, name is player name, room is room name
  connect: (name: string, room: string) => Promise<void>

  // leave the room
  leave: () => Promise<void>

  // int enum, HOME=0, ROOM=1, GAME=2 
  gameAppState: GameAppState

  // sate stored in network
  state: GenericGameState

  // room name
  room?: string

  // true if i am the host of game
  isAdmin: boolean

  // peerId of this point. hosting point has peerId same as networkName
  // please be aware that when the host gets disconnected,
  // one of the points will take up as the new host
  // myId of that point will change to networkName
  // (this is intended so other point can still reach to this network)
  myId?: string

  // kick other point having this peerId out of this network
  kick: (id: string) => Promise<void>

  // mark i am ready/ not ready
  ready: () => Promise<void>

  // start the game
  start: () => Promise<void>

  // general dispatch function
  dispatch: (action: GenericGameAction) => Promise<void>
}
```
