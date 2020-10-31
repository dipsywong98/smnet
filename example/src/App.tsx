import React, { FunctionComponent, useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import { useNetwork } from 'smnet'

const App: FunctionComponent = () => {
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
    <div className="App">
      <header className="App-header">
        {JSON.stringify(network.state)}
        <img src={logo} className="App-logo" alt="logo"/>
        <input
          value={network.state.foo}
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
