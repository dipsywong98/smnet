import { useNetwork } from 'smnet'
import { lobbyReducer } from './LobbyReducer'
import { LobbyState } from './LobbyState'
import { LobbyActionTypes } from './LobbyAction'
import React, { createContext, FunctionComponent, useContext, useEffect, useState } from 'react'
import { LobbyRoomInfo } from './LobbyRoomInfo'

export interface LobbyContext {
  rooms: LobbyRoomInfo[]
  updateRoom: (roomInfo: Omit<LobbyRoomInfo, 'peerId'>) => Promise<void>
}

const LobbyContext = createContext<LobbyContext|null>(null)

export const LobbyProvider: FunctionComponent<{lobbyName: string}> = ({lobbyName, children}) => {
  const lobbyNetwork = useNetwork(lobbyReducer, new LobbyState())
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    // @ts-ignore
    window.lobby = lobbyNetwork
    lobbyNetwork.join(lobbyName).catch(console.error)
  }, [])

  const updateRoom = async (roomInfo: Omit<LobbyRoomInfo, 'peerId'>): Promise<void> => {
    if(!updating) {
      setUpdating(true)
      await lobbyNetwork.dispatch({
        type: LobbyActionTypes.UPDATE_ROOM_INFO,
          payload: roomInfo
      }).finally(() => {
        setUpdating(false)
      })
    }
  }

  return <LobbyContext.Provider value={{ rooms: lobbyNetwork.state.rooms, updateRoom }}>
    {children}
  </LobbyContext.Provider>
}

export const useLobby = (): LobbyContext | null => {
  return useContext(LobbyContext)
}

export const withLobby = (Component: FunctionComponent): FunctionComponent => {
  return props => <LobbyProvider lobbyName='test-lobby'>
    <Component {...props}/>
  </LobbyProvider>
}
