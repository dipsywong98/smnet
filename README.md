# smnet

> **S**tar**M**esh**N**etwork is a redux like decentralized peer to peer state management system

(Currently only have star network, but seems that is good enough already)

## Install

```sh
# npm
npm i smnet

# yarn
yarn add 
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

## Methods
```ts
export interface UseNetworkReturn<State extends NetworkState, Action extends NetworkAction> {
  state: State
  join: (networkName: string, peerFactory?: PeerFactory) => Promise<void>
  leave: () => Promise<void>
  dispatch: (action: Action) => Promise<void>
}
```

## TODO

- [ ] better examples
- [ ] gamenet
- [ ] calculate ping 
- [ ] is connected
- [ ] logs
- [ ] unit tests

