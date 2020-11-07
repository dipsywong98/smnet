import React, { FunctionComponent, useState } from 'react'
import 'reforml/dist/index.css'
import './App.css'
import { logger, NetworkState, PeerFactory, useNetwork } from 'smnet'
import { BaseForm, FormValue } from 'reforml'

interface MyState extends NetworkState {
  foo: string
  pause?: number
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

const DemoCustomPeer: FunctionComponent = () => {
  const [options, setOptions] = useState<{ networkName?: string, peerOptions?: Record<string, unknown> }>({ peerOptions: {} })
  const optionFields = {
    networkName: {
      type: 'text',
      label: 'Network Name',
      required: true
    },
    peerOptions: {
      type: 'object',
      fields: {
        host: {
          type: 'text',
          label: 'host',
          defaultVal: '0.peerjs.com'
        },
        port: {
          type: 'number',
          label: 'port',
          defaultVal: 443
        },
        pingInterval: {
          type: 'number',
          label: 'pingInterval',
          defaultVal: 5000
        },
        path: {
          type: 'text',
          label: 'path',
          defaultVal: '/'
        },
        secure: {
          type: 'checkbox',
          label: 'secure',
          defaultVal: true
        },
        config: {
          type: 'object',
          label: 'config',
          fields: {
            iceTransportPolicy: {
              label: 'iceTransportPolicy',
              type: 'text'
            },
            iceServers: {
              label: 'iceServers',
              type: 'list',
              of: {
                type: 'object',
                fields: {
                  urls: {
                    label: 'urls',
                    type: 'text'
                  },
                  username: {
                    label: 'username',
                    type: 'text'
                  },
                  credential: {
                    label: 'credential',
                    type: 'text'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  const network = useNetwork<MyState, MyAction>((prevState, action) => {
    switch (action.type) {
      case 'set-foo':
        return { ...prevState, foo: action.payload }
      case 'pause': {
        const time = action.payload
        // for (let i = 0; i < time; i++) {
        //   for (let j = 0; j < time; j++) {
        //   }
        // }
        return { ...prevState, time }
      }
      default:
        throw new Error('unknown action')
    }
  }, { foo: '' })
  const join = async (): Promise<void> => {
    if (options.networkName !== undefined) {
      await network.join(options.networkName, new PeerFactory(options.peerOptions))
        .then(() => logger.log('connected'))
        .catch((e: Error) => {
          logger.error(e)
          window.alert('Error when connecting')
        })
    }
  }
  const onOptionChange = (options: FormValue): void => {
    setOptions(options)
  }
  return (
    !network.connected
      ? (
        <div>
          <BaseForm onChange={onOptionChange} fields={optionFields} value={options}/>
          <button
            className='btn'
            onClick={join}>
            join
          </button>
        </div>)
      : (
        <div>
          <div style={{ margin: 'auto' }}>
            <div>Network State: {network.connected ? `connected to ${network.networkName ?? 'unknown network'}` : 'disconnected'}</div>
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
                  network.dispatch({ type: 'set-foo', payload: value }).catch(logger.error)
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
                type='number'
                className='form-control'
                value={network.state.pause}
                onChange={({ target: { value } }) => {
                  network.dispatch({ type: 'pause', payload: Number.parseInt(value) }).catch(logger.error)
                }}
              />
            </label>
          </div>
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={(): void => {
                network.dispatch({ type: '' }).catch((e: Error) => {
                  window.alert(e.message)
                  logger.error(e)
                })
              }}>
              send error
            </button>
            <button
              onClick={(): void => {
                network.leave().catch((e: Error) => {
                  window.alert(e.message)
                  logger.error(e)
                })
              }}>
              leave
            </button>
          </div>
        </div>)
  )
}

export default DemoCustomPeer
