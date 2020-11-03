import { NetworkState } from './types'

type Setter<State extends NetworkState> = (state: State) => void

type Resetter = () => void

/**
 * Make State changes policy extensible
 * Only have get, set and reset
 */
export class StateManager<State extends NetworkState> {
  private readonly _set: Setter<State>
  private readonly _reset: Resetter
  private readonly initialState!: State
  private state!: State

  constructor (initialState: State, onChange?: Setter<State>) {
    this.initialState = JSON.parse(JSON.stringify(initialState)) as State
    this._reset = () => this.set(JSON.parse(JSON.stringify(this.initialState)))
    this.state = initialState

    this._set = onChange ?? ((state: State) => {
      this.state = state
    })
  }

  public get (): State {
    return this.state
  }

  public set (state: State): void {
    this.state = state
    this._set({ ...state })
  }

  public reset (): void {
    this._reset()
  }

  static make<State extends NetworkState> (initialState: State, onChange?: Setter<State>): StateManager<State> {
    return new StateManager<State>(initialState, onChange)
  }
}
