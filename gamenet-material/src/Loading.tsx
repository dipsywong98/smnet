import React, { FunctionComponent } from 'react'
import { CircularProgress } from '@material-ui/core'
import PropTypes from 'prop-types'

const propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool.isRequired,
  size: PropTypes.number
}

export const Loading: FunctionComponent<PropTypes.InferProps<typeof propTypes>> = (props) => {
  return (
    <div style={{ position: 'relative' }}>
      {props.children}
      {props.loading && <CircularProgress size={props.size ?? 24} style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12
      }}/>}
    </div>
  )
}

Loading.propTypes = propTypes
