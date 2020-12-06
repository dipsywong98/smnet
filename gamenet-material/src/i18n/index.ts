import { en } from './en'
import { zh } from './zh'
import { GamenetI18n } from './types'

export const gamenetI18n: Record<string, GamenetI18n> = {
  en,
  zh
}

export const defaultI18n: GamenetI18n = navigator.languages.reduce<GamenetI18n|undefined>((i18n, lang) => {
  if(i18n === undefined){
    return gamenetI18n[lang]
  } else {
    return i18n
  }
}, undefined) ?? gamenetI18n.en
