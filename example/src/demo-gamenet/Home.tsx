import React, { FunctionComponent, useState } from 'react'
import { usePoker99 } from './withPoker99Network'
import { Button, Grid, Paper, TextField, Typography } from '@material-ui/core'
import { getRandomName } from './getRandomName'

export const Home: FunctionComponent = () => {
  const { connect } = usePoker99()
  const [name, setName] = useState(getRandomName())
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')
  const join = async (): Promise<void> => await connect(name, room).catch((error: Error) => setError(error.message))
  return (
    <Paper elevation={3} style={{ padding: '32px 64px' }}>
      <Grid container justify='flex-end' direction='column' spacing={3}>
        <Grid item>
          <Typography variant="h5">Welcome to Poker 99</Typography>
        </Grid>
        {error !== '' && <Grid item>{error}</Grid>}
        <Grid item>
          <TextField label='Your Name' value={name} onChange={({ target: { value } }) => setName(value)} fullWidth/>
        </Grid>
        <Grid item>
          <TextField label='Room Code' value={room} onChange={({ target: { value } }) => setRoom(value)} fullWidth/>
        </Grid>
        <Grid item container justify='flex-end'>
          <Button
            color='primary'
            variant='contained'
            disabled={name === '' || room === ''}
            onClick={join}>
            join
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}
