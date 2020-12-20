import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { useGamenetI18n } from './i18n'
import { extractNamespacedRoom, useLobby } from 'gamenet'
import { PlayArrow } from '@material-ui/icons'
import { attachParams } from './urlHelper'
import { Loading } from './Loading'
import { grey } from '@material-ui/core/colors'

export const Lobby: FunctionComponent<{ playerName: string }> = ({ playerName }) => {
  const { i18n } = useGamenetI18n()
  const [loading, setLoading] = useState(true)
  const lobby = useLobby()
  useEffect(() => {
    lobby?.subscribe().then(() => {
      setLoading(false)
    })
    return () => {
      console.log('want unsubscribe', lobby)
      lobby?.unsubscribe()
    }
  }, [])
  return (
    <Loading loading={loading}>
      <TableContainer component={Paper}>
        <Table style={{ width: '100%', backgroundColor: loading ? grey[100] : undefined }} size="small">
          <TableHead>
            <TableRow>
              <TableCell>{i18n.room}</TableCell>
              <TableCell>{i18n.game}</TableCell>
              <TableCell>{i18n.host}</TableCell>
              <TableCell>{i18n.players}</TableCell>
              <TableCell>{i18n.join}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && lobby ? lobby.rooms.length > 0 ? lobby.rooms.map(roomInfo => {
                const { room, namespace } = extractNamespacedRoom(roomInfo.roomNetworkName)
                const url = (() => {
                  if (room === undefined) {
                    return ''
                  }
                  if (playerName === '') {
                    return attachParams({ room }, roomInfo.url)
                  }
                  return attachParams({ room, join: 'true', name: playerName }, roomInfo.url)
                })()
                return (
                  <TableRow key={roomInfo.roomNetworkName}>
                    <TableCell>{room ?? i18n.unknown}</TableCell>
                    <TableCell>{namespace ?? i18n.unknown}</TableCell>
                    <TableCell>{roomInfo.members[roomInfo.roomNetworkName] ?? i18n.unknown}</TableCell>
                    <TableCell>{Object.keys(roomInfo.members).length}</TableCell>
                    <TableCell>
                      <Button component='a' variant='contained' href={url} disabled={url === ''} size='small'>
                        <PlayArrow fontSize='small'/>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
              : <TableRow><TableCell rowSpan={5}>{i18n.noRooms}</TableCell></TableRow>
              : <TableRow><TableCell rowSpan={5}>loading</TableCell></TableRow>
            }</TableBody>
        </Table>
      </TableContainer>
    </Loading>
  )
}
