import { GenericBoardGameState } from 'gamenet'
import { Deck } from './types'

export class Poker99State extends GenericBoardGameState {
  maxPlayer = 4
  minPlayer = 4
  turn = 0
  direction = 1
  points = 0
  dead: Record<number, true> = {}
  drawDeck: Deck = []
  trashDeck: Deck = []
  playerDeck: Deck[] = []
  logs: string[] = []
}
