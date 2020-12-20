import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core'
import React, { useEffect } from 'react'
import { useGamenetI18n } from './i18n'
import { extractNamespacedRoom, useLobby } from 'gamenet'

export const Lobby = () => {
  const { i18n } = useGamenetI18n()
  const lobby = useLobby()
  useEffect(() => {
    lobby?.subscribe()
    return () => {
      console.log('want unsubscribe', lobby)
      lobby?.unsubscribe()
    }
  }, [])
  return (
    <TableContainer component={Paper}>
      <Table style={{ width: '100%' }} size="small">
        <TableHead>
          <TableRow>
            <TableCell>{i18n.room}</TableCell>
            <TableCell>{i18n.game}</TableCell>
            <TableCell>{i18n.host}</TableCell>
            <TableCell>{i18n.players}</TableCell>
            <TableCell>{i18n.join}</TableCell>
          </TableRow>
        </TableHead>
        {lobby ? <TableBody>
          {lobby.rooms.map(roomInfo => {
            const { room, namespace } = extractNamespacedRoom(roomInfo.roomNetworkName)
            return (
              <TableRow>
                <TableCell>{room}</TableCell>
                <TableCell>{namespace}</TableCell>
                <TableCell>{roomInfo.members[roomInfo.roomNetworkName] ?? 'Unknown'}</TableCell>
                <TableCell>{Object.keys(roomInfo.members).length}</TableCell>
                <TableCell>{roomInfo.url}</TableCell>
              </TableRow>
            )
          })}
        </TableBody> : 'loading'}
      </Table>
    </TableContainer>
  )
}
