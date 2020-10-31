import React, { FunctionComponent, useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { Network } from 'smnet'

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
}).catch(console.error)

const App: FunctionComponent = () => {
  const [, setText] = useState(0)
  useEffect(() => {
    window.setInterval(() => {
      console.log(network.getState())
      setText(Math.random)
    }, 1000)
  }, [setText])
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
        <input
          value={network.getState().foo}
          onChange={({ target: { value } }) => {
            network.dispatch({ type: 'set-foo', payload: value }).catch(console.error)
          }}
        />
        <button
          onClick={(): void => {
            network.dispatch({ type: '' }).catch(console.log)
          }}>
          error
        </button>
      </header>
    </div>
  )
}

export default App
