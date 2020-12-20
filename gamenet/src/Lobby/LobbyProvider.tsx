import { useNetwork } from 'smnet'
import { lobbyReducer } from './LobbyReducer'
import { LobbyState } from './LobbyState'
import { LobbyActionTypes } from './LobbyAction'
import React, { createContext, FunctionComponent, useContext, useState } from 'react'
import { LobbyRoomInfo } from './LobbyRoomInfo'

export interface LobbyContext {
  rooms: LobbyRoomInfo[]
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  updateRoom: (roomInfo: Omit<LobbyRoomInfo, 'peerId'>) => Promise<void>
  removeRoom: (roomNetworkName: string) => Promise<void>
}

const LobbyContext = createContext<LobbyContext | null>(null)

export const LobbyProvider: FunctionComponent<{ lobbyName: string }> = ({ lobbyName, children }) => {
  const lobbyNetwork = useNetwork(lobbyReducer, new LobbyState())
  const [updating, setUpdating] = useState(false)

  const ensureConnected = async (): Promise<boolean> => {
    if (!lobbyNetwork.connected && !lobbyNetwork.connecting) {
      await lobbyNetwork.join(lobbyName).catch(console.error)
    }
    return lobbyNetwork.connected
  }

  const subscribe = async () => {
    await ensureConnected()
  }

  const unsubscribe = async () => {
    console.log('unsubscribe')
    await lobbyNetwork.leave()
  }

  const updateRoom = async (roomInfo: Omit<LobbyRoomInfo, 'peerId'>): Promise<void> => {
    if (!updating) {
      setUpdating(true)
      if (await ensureConnected()) {
        await lobbyNetwork.dispatch({
          type: LobbyActionTypes.UPDATE_ROOM_INFO,
          payload: roomInfo
        }).finally(() => {
          // setUpdating(false)
        })
      }
      setUpdating(false)
    }
  }

  const removeRoom = async (roomNetworkName: string): Promise<void> => {
    if (!updating && lobbyNetwork.connected) {
      setUpdating(true)
      await lobbyNetwork.dispatch({
        type: LobbyActionTypes.REMOVE_ROOM,
        payload: {
          roomNetworkName
        }
      }).finally(() => {
        setUpdating(false)
        lobbyNetwork.leave()
      })
    }
  }

  return <LobbyContext.Provider
    value={{ rooms: lobbyNetwork.state.rooms, updateRoom, removeRoom, subscribe, unsubscribe }}>
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
