import React, { FunctionComponent, ReactNode, useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, Grid, IconButton, Paper, TextField, Typography } from '@material-ui/core'
import { getRandomName } from './getRandomName'
import { Alert } from '@material-ui/lab'
import { Loading } from './Loading'
import { HomeI18n, i18nSub, useGamenetI18n } from './i18n'
import { InfoRounded } from '@material-ui/icons'
import { pushRoomCodeToHistory } from 'gamenet-material/src/pushRoomCodeToHistory'

export const Home: FunctionComponent<{
  connect: (name: string, room: string) => Promise<void>, connecting: boolean, gameName: string, i18n?: Partial<HomeI18n>, children?: ReactNode
}> = ({
        connect,
        connecting,
        gameName,
        i18n: _i18n,
        children
      }) => {
  const { i18n } = useGamenetI18n(_i18n)
  const [name, setName] = useState(getRandomName())
  const [room, setRoom] = useState(window.location.hash.substring(2))
  const [error, setError] = useState('')
  const [openInfo, setOpenInfo] = useState(false)
  const join = async (): Promise<void> => await connect(name, room)
    .then(() => {
      setError('')
      pushRoomCodeToHistory(gameName, room)
    })
    .catch((error: Error) => setError(error.message))
  useEffect(() => {
    const listener = ({ state }: { state?: { roomCode: string } }): void => {
      setRoom(state?.roomCode ?? '')
    }
    window.addEventListener('popstate', listener)
    window.history.replaceState({ roomCode: window.location.hash.substring(2) }, gameName)
    return () => {
      window.removeEventListener('popstate', listener)
    }
  }, [])
  return (
    <Paper elevation={3} style={{ padding: '32px 64px' }}>
      <Grid container justify='flex-end' direction='column' spacing={3}>
        <Grid item>
          <Typography
            variant="h5">{gameName !== undefined ? (i18nSub(i18n.welcomeTo$gameName ?? i18n.welcome ?? 'Welcome to {{}}', { gameName })) : i18n.welcome}</Typography>
        </Grid>
        <Grid item>
          <TextField label={i18n.yourName} value={name} onChange={({ target: { value } }) => setName(value)} fullWidth/>
        </Grid>
        <Grid item>
          <TextField label={i18n.roomCode} value={room} onChange={({ target: { value } }) => setRoom(value)} fullWidth/>
        </Grid>
        {error !== '' && <Alert severity='error'>{error}</Alert>}
        <Grid item container justify='space-between' alignItems='center'>
          {children ? <IconButton onClick={() => setOpenInfo(true)} title={i18n.info}>
            <InfoRounded/>
          </IconButton> : <div/>}
          <Loading loading={connecting}>
            <Button
              color='primary'
              variant='contained'
              disabled={name === '' || room === '' || connecting}
              onClick={join}>
              {i18n.join}
            </Button>
          </Loading>
        </Grid>
      </Grid>
      {children && (
        <Dialog open={openInfo} onClose={() => setOpenInfo(false)} aria-labelledby="form-dialog-title">
          {children}
          <DialogActions>
            <Button onClick={() => setOpenInfo(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  )
}
