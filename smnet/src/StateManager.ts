import { NetworkState } from './types'

type Getter<State extends NetworkState> = () => State

type Setter<State extends NetworkState> = (state: State) => void

type Resetter = () => void

/**
 * Make State changes policy extensible
 * Only have get, set and reset
 */
export class StateManager<State extends NetworkState> {
  private readonly _get: Getter<State>
  private readonly _set: Setter<State>
  private readonly _reset: Resetter
  private readonly initialState!: State
  private state!: State

  protected constructor (get: Getter<State> | State, set?: Setter<State>, reset?: Resetter) {
    if (typeof get === 'function') {
      this._get = get
      this._reset = reset ?? (() => {
        console.warn('called StateManager reset but reset is not set')
      })
    } else {
      this.initialState = JSON.parse(JSON.stringify(get)) as State
      this._get = () => this.state
      this._reset = () => this._set(JSON.parse(JSON.stringify(this.initialState)))
      this.state = get
    }
    this._set = set ?? ((state: State) => {
      this.state = state
    })
  }

  public get (): State {
    return this._get()
  }

  public set (state: State): void {
    this._set(state)
  }

  public reset (): void {
    this._reset()
  }

  static make<State extends NetworkState> (get: Getter<State>, set: Setter<State>, reset?: Resetter): StateManager<State>
  static make<State extends NetworkState> (initialState: State): StateManager<State>
  static make<State extends NetworkState> (get: Getter<State> | State, set?: Setter<State>, reset?: Resetter): StateManager<State> {
    return new StateManager<State>(get, set, reset)
  }
}
