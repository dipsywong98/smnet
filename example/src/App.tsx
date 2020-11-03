import React, { FunctionComponent, useState } from 'react'
import './App.css'
import 'reforml/dist/index.css'
import DemoNormalPeer from './DemoNormalPeer'
import DemoCustomPeer from './DemoCustomPeer'

const App: FunctionComponent = () => {
  const [custom, setCustom] = useState(false)
  return (
    <div className="App">
      <header className="App-header">
        <h1>smnet demonstration
        </h1>
        <label>
          <input type='checkbox' value={custom.toString()} onChange={() => setCustom(!custom)}/>
          use custom peer option
        </label>
        {!custom ? <DemoNormalPeer/> : <DemoCustomPeer/>}
        <div style={{ marginBottom: '16px' }}/>
      </header>
    </div>
  )
}

export default App
