import { NetworkState } from './types'
import cloneDeep from 'clone-deep'

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
  private readonly history: State[] = []
  private readonly historyMax: number

  constructor (initialState: State, onChange?: Setter<State>, historyMax = 0) {
    this.historyMax = historyMax
    this.initialState = cloneDeep(initialState)
    this._reset = () => this.set(cloneDeep(this.initialState))
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
    if (this.historyMax > 0) {
      if (this.history.length >= this.historyMax) {
        this.history.shift()
      }
      this.history.push(cloneDeep(state))
    }
    this._set({ ...state })
  }

  public reset (): void {
    this._reset()
  }

  public getHistory (): State[] {
    return this.history
  }

  static make<State extends NetworkState> (initialState: State, onChange?: Setter<State>, historyMax?: number): StateManager<State> {
    return new StateManager<State>(initialState, onChange, historyMax)
  }
}
