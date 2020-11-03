import React, { FunctionComponent, useState } from 'react'
import './App.css'
import { NetworkState, useNetwork } from 'smnet'
import 'reforml/dist/index.css'

interface MyState extends NetworkState {
  foo: string
  pause?: number
  [key: string]: unknown | undefined
}

type MyAction = ({
  type: 'set-foo'
  payload: string
} | {
  type: 'pause'
  payload: number
} | {
  type: ''
})

const DemoNormalPeer: FunctionComponent = () => {
  const [networkName, setNetworkName] = useState('')
  const network = useNetwork<MyState, MyAction>((prevState, action) => {
    switch (action.type) {
      case 'set-foo':
        return { ...prevState, foo: action.payload }
      case 'pause': {
        const pause = action.payload
        // for (let i = 0; i < pause; i++) {
        //   for (let j = 0; j < pause; j++) {
        //   }
        // }
        return { ...prevState, pause }
      }
      default:
        throw new Error('unknown action')
    }
  }, { foo: '' })
  const join = async (): Promise<void> => {
    await network.join(networkName)
      .then(() => console.log('connected'))
      .catch((e: Error) => {
        console.error(e)
        window.alert('Error when connecting')
      })
  }
  return (
    !network.connected
      ? (
        <div className='reforml-form-group'>
          <label>Network name: </label>
          <input className='form-control' onChange={({ target: { value } }) => setNetworkName(value)}/>
          <div style={{ marginTop: '8px' }}>
            <button
              className='btn btn-primary'
              onClick={join}>
              join
            </button>
          </div>
        </div>)
      : (
        <div>
          <div style={{ margin: 'auto' }}>
            <div>Network State: {network.connected ? `connected to ${network.networkName}` : 'disconnected'}</div>
            <pre>
              {JSON.stringify(network.state, null, 2)}
            </pre>
          </div>
          <div className='reforml-form-group'>
            <label>
              <span>
                edit foo
              </span>
              <input
                className='form-control'
                value={network.state.foo ?? ''}
                onChange={({ target: { value } }) => {
                  network.dispatch({ type: 'set-foo', payload: value }).catch(console.error)
                }}
              />
            </label>
          </div>
          <div className='reforml-form-group'>
            <label>
              <span>
                pause
              </span>
              <input
                className='form-control'
                value={network.state.pause ?? 0}
                onChange={({ target: { value } }) => {
                  network.dispatch({ type: 'pause', payload: Number.parseInt(value) }).catch(console.error)
                }}
              />
            </label>
          </div>
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={(): void => {
                network.dispatch({ type: '' }).catch(e => {
                  window.alert(e.message)
                  console.error(e)
                })
              }}>
              send error
            </button>
            <button
              onClick={(): void => {
                network.leave().catch(e => {
                  window.alert(e.message)
                  console.error(e)
                })
              }}>
              leave
            </button>
          </div>
        </div>)
  )
}

export default DemoNormalPeer
