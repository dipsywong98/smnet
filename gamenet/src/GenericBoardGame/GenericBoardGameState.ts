import { GenericGameState } from '../Generic/GenericGameState'

export class GenericBoardGameState extends GenericGameState {
  turn = 0
  winner: number | null = null
}
