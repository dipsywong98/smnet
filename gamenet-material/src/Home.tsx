import React, { FunctionComponent, useState } from 'react'
import { Button, Grid, Paper, TextField, Typography } from '@material-ui/core'
import { getRandomName } from './getRandomName'
import { Alert } from '@material-ui/lab'
import { Loading } from './Loading'

export const Home: FunctionComponent<{ connect: (name: string, room: string) => Promise<void>, connecting: boolean, gameName: string }> = ({ connect, connecting, gameName }) => {
  const [name, setName] = useState(getRandomName())
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')
  const join = async (): Promise<void> => await connect(name, room).catch((error: Error) => setError(error.message))
  return (
    <Paper elevation={3} style={{ padding: '32px 64px' }}>
      <Grid container justify='flex-end' direction='column' spacing={3}>
        <Grid item>
          <Typography variant="h5">Welcome to {gameName}</Typography>
        </Grid>
        <Grid item>
          <TextField label='Your Name' value={name} onChange={({ target: { value } }) => setName(value)} fullWidth/>
        </Grid>
        <Grid item>
          <TextField label='Room Code' value={room} onChange={({ target: { value } }) => setRoom(value)} fullWidth/>
        </Grid>
        {error !== '' && <Alert severity='error'>{error}</Alert>}
        <Grid item container justify='flex-end'>
          <Loading loading={connecting}>
            <Button
              color='primary'
              variant='contained'
              disabled={name === '' || room === '' || connecting}
              onClick={join}>
              join
            </Button>
          </Loading>
        </Grid>
      </Grid>
    </Paper>
  )
}
