import React, { FunctionComponent } from 'react'
import { SvgIcon } from '@material-ui/core'

export const PersonAdd: FunctionComponent = () => (
  <SvgIcon>
    <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
      <path
        d="M12,5.5c2.2,0,4,1.8,4,4s-1.8,4-4,4s-4-1.8-4-4S9.8,5.5,12,5.5 M12,7.5c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2
            S13.1,7.5,12,7.5 M12,14.5c2.7,0,8,1.3,8,4v3H4v-3C4,15.8,9.3,14.5,12,14.5 M12,16.4c-3,0-6.1,1.5-6.1,2.1v1.1h12.2v-1.1
            C18.1,17.9,15,16.4,12,16.4z"
      />
      <path d="M17.9,1.8v3h-3v2h3v3h2v-3h3v-2h-3v-3H17.9z"/>
    </svg>
  </SvgIcon>
)
