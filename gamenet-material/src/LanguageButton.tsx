import React, { useState } from 'react'
import { IconButton, Menu, MenuItem } from '@material-ui/core'
import { Language } from '@material-ui/icons'
import { useGamenetI18n } from './i18n'

export const LanguageButton = () => {
  const { language, setLanguage, languages } = useGamenetI18n()
  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const selectLang = (lang: string) => {
    setLanguage(lang)
    handleClose()
  }

  return (
    <div>
      <IconButton aria-controls="lang-menu" aria-haspopup="true" onClick={handleClick}>
        <Language/>
      </IconButton>
      <Menu
        id="lang-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {
          languages.map(lang => (
            <MenuItem key={lang} onClick={() => selectLang(lang)}>{lang}</MenuItem>
          ))
        }
      </Menu>
    </div>
  )
}
