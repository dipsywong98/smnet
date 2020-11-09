import { compose } from './withGenericGameReducer'

it('compose functions', () => {
  const a = (s: string): string => `${s}a`
  const b = (s: string): string => `${s}b`
  const c = (s: string): string => `${s}c`
  const letter = (l: string) => (s: string) => `${s}${l}`
  expect(compose(
    a,
    b,
    c,
    letter('d')
  )('efg')).toEqual('efgdcba')
})
