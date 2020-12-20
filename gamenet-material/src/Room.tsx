import React, { PropsWithChildren, useEffect, useState } from 'react'
import {
  BoardGameContextInterface,
  GenericBoardGameState,
  GenericGameAction,
  LobbyRoomInfo,
  PlayerType,
  useLobby
} from 'gamenet'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  isWidthUp,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Typography,
  useTheme,
  withWidth
} from '@material-ui/core'
import { CancelOutlined, Person, PersonOutline, Visibility } from '@material-ui/icons'
import { AccountCheck, Crown, Robot } from 'mdi-material-ui'
import { RobotAdd } from './RobotAdd'
import { PersonAdd } from './PersonAdd'
import Alert from '@material-ui/lab/Alert'
import { getRandomName } from './getRandomName'
import { Loading } from './Loading'
import { i18nSub, RoomI18n, useGamenetI18n } from './i18n'
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints'

export const Room = withWidth()(<S extends GenericBoardGameState, A extends GenericGameAction> (
  {
    room,
    state,
    leave,
    isAdmin,
    myId,
    kick,
    ready,
    start,
    addAi,
    addLocal,
    playerType,
    dispatching,
    i18n: i18n_,
    width,
    defaultShowInLobby,
    setShowInLobby,
    roomUrlBuilder
  }: PropsWithChildren<BoardGameContextInterface<S, A>> & { i18n?: Partial<RoomI18n>, width?: Breakpoint, defaultShowInLobby?: boolean, roomUrlBuilder?: (room: string, name: string) => string }) => {
  const { i18n } = useGamenetI18n(i18n_)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [creatingLocal, setCreatingLocal] = useState<boolean | undefined>(undefined)
  const lobby = useLobby()
  const theme = useTheme()
  const showInLobby = state.showInLobby ?? defaultShowInLobby ?? true
  useEffect(() => {
    const membersChanged = JSON.stringify(state.members) !== JSON.stringify(lobby?.rooms.find((r: LobbyRoomInfo) => r.roomNetworkName === myId)?.members ?? {})
    if (showInLobby && lobby && room && myId?.includes(room) && membersChanged) {
      lobby.updateRoom({
        roomNetworkName: myId,
        members: state.members,
        url: window.location.href
      }).catch((e: Error) => setError(e.message))
    }
    if (!showInLobby && lobby && room && myId?.includes(room)) {
      lobby.removeRoom(myId).catch((e: Error) => setError(e.message))
    }
  }, [showInLobby, lobby, myId, room, state.members])
  const handleStartClick = async (): Promise<void> => {
    setError('')
    await start().catch((e: Error) => setError(e.message))
  }
  const handleReadyClick = async (): Promise<void> => {
    setError('')
    await ready().catch((e: Error) => setError(e.message))
  }
  const handleAddAiClick = async (): Promise<void> => {
    setError('')
    await addAi(getRandomName()).catch((e: Error) => setError(e.message))
  }
  const handleCloseClick = (): void => {
    setName('')
    setCreatingLocal(undefined)
  }
  const handleLeaveClick = () => {
    setError('')
    if(room && myId?.includes(room)) {
      lobby?.removeRoom(myId).catch((e: Error) => setError(e.message))
    }
    leave()
  }
  const createLocalOrAI = async (): Promise<void> => {
    if (name !== '') {
      if (creatingLocal === true) {
        await addLocal(name).catch((e: Error) => setError(e.message))
      } else if (creatingLocal === false) {
        await addAi(name).catch((e: Error) => setError(e.message))
      }
    }
    handleCloseClick()
  }
  const handleKick = (id: string) => {
    kick(id).then(() => setError('')).catch(e => setError(e.message))
  }
  const getIcon = (peerId: string, name: string): React.ReactNode => {
    if (peerId in state.spectators) {
      return <Grid item title={i18n.spectator}>
        <Visibility/>
      </Grid>
    } else if (state.networkName === peerId) {
      return <Grid item title={i18n.host}>
        <Crown/>
      </Grid>
    } else if (playerType(name) === PlayerType.NORMAL) {
      if (state.ready[peerId]) {
        return <Grid item title={i18n.playerReady}>
          <AccountCheck/>
        </Grid>
      } else {
        return <Grid item title={i18n.playerNotReady}>
          <Person/>
        </Grid>
      }
    } else if (playerType(name) === PlayerType.LOCAL) {
      return <Grid item title={i18n.hotSeatPlayer}>
        <PersonOutline/>
      </Grid>
    } else if (playerType(name) === PlayerType.AI) {
      return <Grid item title={i18n.aiPlayer}>
        <Robot/>
      </Grid>
    }
  }

  const renderHintText = (peerId: string, name: string) => {
    if (peerId === state.networkName) {
      return i18nSub(i18n.$nameIsHost, { name })
    } else if (peerId in state.spectators) {
      return i18nSub(i18n.$nameIsSpectator, { name })
    } else if (peerId in state.localPlayers) {
      return i18nSub(i18n.$nameIsLocalPlayerOf$owner, { name, owner: state.members[state.localPlayers[peerId]] })
    } else if (peerId in state.aiPlayers) {
      return i18nSub(i18n.$nameIsAiPlayerOf$owner, { name, owner: state.members[state.aiPlayers[peerId]] })
    } else {
      if (state.ready[peerId]) {
        return i18nSub(i18n.$nameIsNotReadyYet, { name })
      } else {
        return i18nSub(i18n.$nameIsReady, { name })
      }
    }
  }

  const padding = isWidthUp('sm', width!) ? '64px' : '16px'
  const height = isWidthUp('sm', width!) ? 'calc(100vh - 100px)' : 'calc(100vh - 30px)'
  return (
    <Paper elevation={3} component={Grid} style={{
      display: 'flex',
      justifyContent: 'flex-end',
      flexDirection: 'column',
      width: 'calc(min(500px, 95%))',
      maxHeight: height,
      minHeight: height,
      boxSizing: 'border-box'
    }}>
      <Grid item style={{ padding: `32px ${padding} 0 ${padding}` }}>
        <Typography variant="h5">{i18n.room}: {room}</Typography>
        <Grid container justify='space-between' alignItems='flex-end'>
          <Grid item>
            <Typography variant="h6">{i18n.players}</Typography>
          </Grid>
          <Grid item>
            <IconButton size='medium' title={i18n.addHotSeatPlayer} onClick={() => setCreatingLocal(true)}>
              <PersonAdd/>
            </IconButton>
            <IconButton size='medium' title={i18n.addAiPlayer} onClick={handleAddAiClick}>
              <RobotAdd/>
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
      <Divider/>
      <Grid item style={{ flex: 1, overflow: 'auto', paddingLeft: padding, paddingRight: padding }}>
        <List>
          {Object.entries(state.members).map(([id, name]) => {
            const color = (id === state.networkName || [PlayerType.LOCAL, PlayerType.AI].includes(playerType(name)))
              ? theme.palette.primary.main
              : state.ready[id] ? theme.palette.success.main : theme.palette.text.secondary
            return (
              <ListItem
                key={id}
                title={renderHintText(id, name)}
                style={{ color }}>
                <ListItemIcon>
                    <span style={{ color }}>
                      {getIcon(id, name)}
                    </span>
                </ListItemIcon>
                <ListItemText>
                  {name}
                </ListItemText>
                {((isAdmin || [PlayerType.LOCAL, PlayerType.AI].includes(playerType(name))) && id !== myId && id !== state.networkName) &&
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleKick(id)} title='Kick'>
                    <CancelOutlined color='error'/>
                  </IconButton>
                </ListItemSecondaryAction>}
              </ListItem>
            )
          })}
        </List>
      </Grid>
      <Divider/>
      {error !== '' && <Alert severity='error'>{error}</Alert>}
      <Grid item container justify='space-between' spacing={1}
            style={{ padding: `16px ${padding} 16px ${padding}` }}>
        <Grid item>
          <FormControlLabel
            control={
              <Checkbox
                disabled={!isAdmin}
                checked={showInLobby}
                onChange={() => setShowInLobby(!showInLobby)}
                name="showInLobby"
                color="primary"
              />
            }
            label={i18n.showInLobby}
          />
        </Grid>
        <Grid item>
          <Grid container spacing={1}>
            <Grid item>
              <Button variant='contained' color='secondary' onClick={handleLeaveClick}>{i18n.leave}</Button>
            </Grid>
            <Grid item>
              <Loading loading={dispatching}>
                {isAdmin
                  ? <Button
                    variant='contained' color='primary' disabled={dispatching}
                    onClick={handleStartClick}>
                    {i18n.start}
                  </Button>
                  : <Button
                    variant='contained' color='primary' disabled={dispatching}
                    onClick={handleReadyClick}>
                    {state.ready[myId ?? ''] ? i18n.unready : i18n.ready}
                  </Button>}
              </Loading>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Dialog open={creatingLocal !== undefined} onClose={handleCloseClick} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">{i18n.nameForNewHotSeatPlayer}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClick} color="primary">
            {i18n.cancel}
          </Button>
          <Button onClick={createLocalOrAI} color="primary">
            {i18n.create}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
})
