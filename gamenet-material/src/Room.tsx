import React, { PropsWithChildren, useState } from 'react'
import { BoardGameContextInterface, GenericBoardGameState, GenericGameAction, PlayerType } from 'gamenet'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Typography,
  useTheme
} from '@material-ui/core'
import { CancelOutlined, Person, PersonOutline, Visibility } from '@material-ui/icons'
import { AccountCheck, Crown, Robot } from 'mdi-material-ui'
import { RobotAdd } from './RobotAdd'
import { PersonAdd } from './PersonAdd'
import Alert from '@material-ui/lab/Alert'
import { getRandomName } from './getRandomName'

export const Room = <S extends GenericBoardGameState, A extends GenericGameAction>({ room, state, leave, isAdmin, myId, kick, ready, start, addAi, addLocal, playerType }: PropsWithChildren<BoardGameContextInterface<S, A>> ) => {
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [creatingLocal, setCreatingLocal] = useState<boolean | undefined>(undefined)
  const theme = useTheme()
  const handleStartClick = async (): Promise<void> => {
    await start().catch((e: Error) => setError(e.message))
  }
  const handleReadyClick = async (): Promise<void> => {
    await ready().catch((e: Error) => setError(e.message))
  }
  const handleAddAiClick = async (): Promise<void> => {
    await addAi(getRandomName()).catch((e: Error) => setError(e.message))
  }
  const handleCloseClick = (): void => {
    setName('')
    setCreatingLocal(undefined)
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
  const getIcon = (peerId: string, name: string): React.ReactNode => {
    if (peerId in state.spectators) {
      return <Grid item title='spectator'>
        <Visibility/>
      </Grid>
    } else if (state.networkName === peerId) {
      return <Grid item title='host'>
        <Crown/>
      </Grid>
    } else if (playerType(name) === PlayerType.NORMAL) {
      if(state.ready[peerId]) {
        return <Grid item title='player ready'>
          <AccountCheck/>
        </Grid>
      }else{
        return <Grid item title='player not ready'>
          <Person/>
        </Grid>
      }
    } else if (playerType(name) === PlayerType.LOCAL) {
      return <Grid item title='hot seat player'>
        <PersonOutline/>
      </Grid>
    } else if (playerType(name) === PlayerType.AI) {
      return <Grid item title='AI player'>
        <Robot/>
      </Grid>
    }
  }

  const renderHintText = (peerId: string, name: string) => {
    if (peerId === state.networkName) {
      return `${name} is the host`
    }else if (peerId in state.spectators) {
      return `${name} is a spectator`
    } else if (peerId in state.localPlayers) {
      return `${name} is a local player of ${state.members[state.localPlayers[peerId]]}`
    } else if (peerId in state.aiPlayers) {
      return `${name} is an ai player of ${state.members[state.aiPlayers[peerId]]}`
    } else {
      if (state.ready[peerId]) {
        return `${name} is not ready yet`
      } else {
        return `${name} is ready`
      }
    }
  }

  return (
    <Paper elevation={3} style={{ padding: '32px 64px', minWidth: '400px' }}>
      <Grid container justify='flex-end' direction='column' spacing={3}>
        <Grid item>
          <Typography variant="h5">Room: {room}</Typography>
        </Grid>
        <Grid item>
          <Grid container justify='space-between' alignItems='flex-end'>
            <Grid item>
              <Typography variant="h6">Players</Typography>
            </Grid>
            <Grid item>
              <IconButton size='medium' title='Add Local Hot Seat player' onClick={() => setCreatingLocal(true)}>
                <PersonAdd/>
              </IconButton>
              <IconButton size='medium' title='Add AI Player' onClick={handleAddAiClick}>
                <RobotAdd/>
              </IconButton>
            </Grid>
          </Grid>
          <Divider/>
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
                    <IconButton edge="end" aria-label="delete" onClick={() => kick(id)} title='Kick'>
                      <CancelOutlined color='error'/>
                    </IconButton>
                  </ListItemSecondaryAction>}
                </ListItem>
              )
            })}
          </List>
        </Grid>
        {error !== '' && <Alert severity='error'>{error}</Alert>}
        <Grid item container justify='flex-end' spacing={1}>
          <Grid item>
            <Button variant='contained' color='secondary' onClick={leave}>leave</Button>
          </Grid>
          <Grid item>
            {isAdmin
              ? <Button variant='contained' color='primary' onClick={handleStartClick}>start</Button>
              : <Button variant='contained' color='primary' onClick={handleReadyClick}>{state.ready[myId ?? ''] ? 'unready' : 'ready'}</Button>}
          </Grid>
        </Grid>
      </Grid>
      <Dialog open={creatingLocal !== undefined} onClose={handleCloseClick} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Name for new {creatingLocal === true ? 'local' : 'AI'} player</DialogTitle>
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
            Cancel
          </Button>
          <Button onClick={createLocalOrAI} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
