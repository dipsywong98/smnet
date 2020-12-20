import {
  Button,
  Grid,
  isWidthUp,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  withWidth
} from '@material-ui/core'
import React, { FunctionComponent, useEffect, useState } from 'react'
import { useGamenetI18n } from './i18n'
import { extractNamespacedRoom, LobbyRoomInfo, useLobby } from 'gamenet'
import { PlayArrow } from '@material-ui/icons'
import { attachParams } from './urlHelper'
import { Loading } from './Loading'
import { grey } from '@material-ui/core/colors'
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints'

const _Lobby: FunctionComponent<{ playerName: string, width?: Breakpoint }> = ({ playerName, width }) => {
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
  const parseRoomInfo = (roomInfo: LobbyRoomInfo) => {
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
    return {
      room, namespace, url
    }
  }
  const renderRoomsInTbody = (rooms: LobbyRoomInfo[]) => {
    return rooms.map(roomInfo => {
      const { room, namespace, url } = parseRoomInfo(roomInfo)
      return (
        <TableRow key={roomInfo.roomNetworkName}>
          <TableCell>{room ?? i18n.unknown}</TableCell>
          <TableCell>{namespace ?? i18n.unknown}</TableCell>
          <TableCell>{roomInfo.members[roomInfo.roomNetworkName] ?? i18n.unknown}</TableCell>
          <TableCell>{Object.keys(roomInfo.members).length}</TableCell>
          <TableCell>{roomInfo.started ? i18n.started : i18n.waiting}</TableCell>
          <TableCell>
            <Button component='a' variant='contained' href={url} disabled={url === ''} size='small'>
              <PlayArrow fontSize='small'/>
            </Button>
          </TableCell>
        </TableRow>
      )
    })
  }
  const renderRoomsInCards = (rooms: LobbyRoomInfo[]) => {
    return (
      <Grid container direction='column' spacing={1}>
        {
          rooms.map(roomInfo => {
            const { room, namespace, url } = parseRoomInfo(roomInfo)
            return (
              <Grid item>
                <Paper style={{ padding: '16px' }}>
                  <div><strong>{room}</strong></div>
                  <div>{i18n.game}:{namespace ?? i18n.unknown}</div>
                  <div>{i18n.host}:{roomInfo.members[roomInfo.roomNetworkName] ?? i18n.unknown}</div>
                  <Grid item>{Object.keys(roomInfo.members).length}{i18n.players}</Grid>
                  <Grid container justify='space-between'>
                    <Grid item>{roomInfo.started ? i18n.started : i18n.waiting}</Grid>
                    <Grid item>
                      <Button component='a' variant='contained' href={url} disabled={url === ''} size='small'>
                        <PlayArrow fontSize='small'/>
                        {i18n.join}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )
          })
        }
      </Grid>)
  }
  return (
    <Loading loading={loading}>
      {isWidthUp('sm', width!) ? <TableContainer component={Paper}>
          <Table style={{ width: '100%', backgroundColor: loading ? grey[100] : undefined }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>{i18n.room}</TableCell>
                <TableCell>{i18n.game}</TableCell>
                <TableCell>{i18n.host}</TableCell>
                <TableCell>{i18n.players}</TableCell>
                <TableCell>{i18n.status}</TableCell>
                <TableCell>{i18n.join}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && lobby
                ? lobby.rooms.length > 0
                  ? renderRoomsInTbody(lobby.rooms)
                  : <TableRow><TableCell rowSpan={5}>{i18n.noRooms}</TableCell></TableRow>
                : <TableRow><TableCell rowSpan={5}>loading</TableCell></TableRow>
              }</TableBody>
          </Table>
        </TableContainer>
        : !loading && lobby ? lobby.rooms.length > 0 ? renderRoomsInCards(lobby.rooms) : i18n.noRooms : ''
      }
    </Loading>
  )
}

export const Lobby = withWidth()(_Lobby)
