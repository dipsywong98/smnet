import { en } from './en'
import { zh } from './zh'
import { GamenetI18n } from './types'
import React, { createContext, FunctionComponent, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

declare global {
  interface ObjectConstructor {
    fromEntries (xs: [string | number | symbol, any][]): object
  }
}

const fromEntries = (xs: [string | number | symbol, any][]) =>
  Object.fromEntries ? Object.fromEntries(xs) : xs.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

export const gamenetI18n: Record<string, GamenetI18n<{}>> = {
  en,
  zh
}

function getDefaultLanguage (availableLangs: string[]) {
  for (const lang of navigator.languages) {
    if (availableLangs.includes(lang)) {
      return lang
    }
  }
  for (const lang of navigator.languages) {
    if (availableLangs.includes(lang.replace(/-.+$/, ''))) {
      return lang
    }
  }
  return availableLangs[0]
}

export const defaultI18n: GamenetI18n<{}> = gamenetI18n[getDefaultLanguage(Object.keys(gamenetI18n))]

interface GamenetI18nContextType<T extends Record<string, unknown>> {
  i18n: GamenetI18n<T>,
  setLanguage: (lang: string) => void,
  languages: string[],
  language: string
}

const GamenetI18nContext = createContext<GamenetI18nContextType<{}>>({
  i18n: defaultI18n,
  setLanguage: () => console.error('Please Wrap with GamenetI18nProvider first'),
  languages: [],
  language: 'en'
})

export function GamenetI18nProvider <T extends Record<string, unknown>> (
  { i18n, i18ns, children }: { i18n?: GamenetI18n<T>, i18ns?: Record<string, GamenetI18n<T>>, children: ReactNode }) {
  const mergedI18ns = useMemo<Record<string, GamenetI18n<T>>>(() => {
    return i18ns !== undefined
      ? Object.fromEntries(
        Object.entries(i18ns)
          .map(([lang, i18n]) => [
            lang,
            { ...gamenetI18n[lang], ...i18n }
          ])
      ) as unknown as Record<string, GamenetI18n<T>> : gamenetI18n as unknown as Record<string, GamenetI18n<T>>
  }, [])
  const availableLangs = Object.keys(mergedI18ns)
  const [language, setLanguage_] = useState<string>(() => {
    const lang = localStorage.getItem('language') ?? getDefaultLanguage(availableLangs)
    return !availableLangs.includes(lang) ? availableLangs[0] : lang
  })
  const setLanguage = (lang: string) => {
    if(availableLangs.includes(lang)) {
      setLanguage_(lang)
      localStorage.setItem('language', lang)
    } else {
      throw new Error(`${lang} is not a supported language. Supported languages are ${availableLangs.join(',')}`)
    }
  }
  useEffect(() => {
    const listener = () => {
      setLanguage(localStorage.getItem('language') ?? language)
    }
    window.addEventListener('storage', listener)
    return () => {
      window.removeEventListener('storage', listener)
    }
  }, [language])
  return <GamenetI18nContext.Provider
    value={{
      i18n: i18n ?? mergedI18ns[language],
      language,
      setLanguage,
      languages: availableLangs
    }}>
    {children}
  </GamenetI18nContext.Provider>
}

export function useGamenetI18n<T extends Record<string, unknown>> (i18nOverride?: Partial<GamenetI18n<T>>): GamenetI18nContextType<T> {
  const { i18n, ...rest } = useContext(GamenetI18nContext)
  return {
    ...rest,
    i18n: { ...i18n, ...i18nOverride } as GamenetI18n<T>
  }
}

export function withGamenetI18n <T extends Record<string, unknown>>(options?: { i18n?: GamenetI18n<T>, i18ns?: Record<string, GamenetI18n<T>> }) {
  return (Component: FunctionComponent): FunctionComponent => (props) => (
    <GamenetI18nProvider {...options}>
      <Component {...props}/>
    </GamenetI18nProvider>
  )
}

export * from './i18nSub'
export * from './types'
