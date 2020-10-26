import React, { FunctionComponent } from 'react'
import logo from './logo.svg'
import './App.css'
import DummyClass from 'smnet'

const App: FunctionComponent = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer">
          {DummyClass.str}
        </a>
      </header>
    </div>
  )
}

export default App
