import React, { FunctionComponent } from 'react'
import PropTypes from 'prop-types'

const transition = (time: number, props: string[], ease = 'ease'): { transition: string } => ({
  transition: props.map(p => `${time}s ${p} ${ease}`).join(',')
})

const props = {
  GameRenderer: PropTypes.node,
  gameAppState: PropTypes.number.isRequired,
  children: PropTypes.arrayOf(PropTypes.node.isRequired).isRequired
}

export const GamePagesSlider: FunctionComponent<PropTypes.InferProps<typeof props>> = ({ GameRenderer, gameAppState, children }) => {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {GameRenderer}
      {children?.slice().reverse().map((child, k) => {
        return <div
          style={{
            ...(k === 0 ? {pointerEvents: 'none'} : {justifyContent: 'center', alignItems: 'center'}),
            display: 'flex',
            height: '100vh',
            width: '100vw',
            left: `${-(gameAppState + k - children.length + 1) * 100}%`,
            position: 'absolute',
            ...transition(0.3, ['left'], 'linear')
          }}>
          {child}
        </div>
      })}
    </div>
  )
}

GamePagesSlider.propTypes = props
